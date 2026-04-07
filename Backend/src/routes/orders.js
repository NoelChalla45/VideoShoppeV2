// Order routes for checkout and order history.
import express from "express";
import { OrderType, PendingCheckoutStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireStripe } from "../lib/stripe.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Group matching cart lines before checkout so totals stay clean.
function normalizeItems(items = []) {
  const grouped = new Map();

  for (const raw of items) {
    const id = Number.parseInt(raw?.id, 10);
    const quantity = Number.parseInt(raw?.quantity, 10);
    const mode = String(raw?.mode || "rent").toLowerCase();

    if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    const orderType = mode === "buy" ? OrderType.PURCHASE : OrderType.RENTAL;
    const key = `${id}-${orderType}`;
    const current = grouped.get(key) || { id, quantity: 0, orderType };
    grouped.set(key, { ...current, quantity: current.quantity + quantity });
  }

  return Array.from(grouped.values());
}

function normalizeContact(rawContact = {}) {
  return {
    phone: String(rawContact?.phone || "").trim(),
    address: String(rawContact?.address || "").trim(),
  };
}

function toCheckoutLineItems(items = []) {
  return items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.title,
      },
      unit_amount: Math.round(Number(item.unitPrice) * 100),
    },
    quantity: item.quantity,
  }));
}

router.post("/checkout/session", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const normalizedItems = normalizeItems(req.body?.items);
  const contact = normalizeContact(req.body?.contact);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: "Checkout items are required." });
  }
  if (!contact.phone || !contact.address) {
    return res.status(400).json({ error: "Phone number and address are required for checkout." });
  }

  try {
    const stripe = requireStripe();
    const sessionPayload = await prisma.$transaction(async (tx) => {
      const customer = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (!customer?.name) {
        throw new Error("MISSING_NAME");
      }

      const ids = [...new Set(normalizedItems.map((item) => item.id))];
      const inventoryRows = await tx.inventory.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, price: true, stock: true },
      });
      const stockById = new Map(inventoryRows.map((row) => [row.id, row]));

      // Make sure every requested title exists and has enough stock.
      for (const item of normalizedItems) {
        const row = stockById.get(item.id);
        if (!row) throw new Error(`NOT_FOUND:${item.id}`);
        if (row.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${row.id}:${row.name}:${row.stock}:${item.quantity}`);
        }
      }

      // Build the order lines that will be saved with the order.
      const orderItemsData = normalizedItems.map((item) => {
        const row = stockById.get(item.id);
        const unitPrice = item.orderType === OrderType.PURCHASE ? row.price * 5 : row.price;
        return {
          inventoryId: row.id,
          title: row.name,
          quantity: item.quantity,
          unitPrice,
          orderType: item.orderType,
        };
      });

      const totalAmount = Number(
        orderItemsData.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
      );

      const pendingCheckout = await tx.pendingCheckout.create({
        data: {
          userId,
          contactPhone: contact.phone,
          contactAddress: contact.address,
          totalAmount,
          itemsJson: orderItemsData,
          stripeSessionId: `pending_${crypto.randomUUID()}`,
        },
      });

      return {
        customer,
        pendingCheckoutId: pendingCheckout.id,
        totalAmount,
        orderItemsData,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: sessionPayload.customer.email,
      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/cart`,
      metadata: {
        pendingCheckoutId: sessionPayload.pendingCheckoutId,
        userId,
      },
      line_items: toCheckoutLineItems(sessionPayload.orderItemsData),
    });

    await prisma.pendingCheckout.update({
      where: { id: sessionPayload.pendingCheckoutId },
      data: {
        stripeSessionId: session.id,
      },
    });

    return res.status(201).json({ url: session.url });
  } catch (err) {
    const message = String(err?.message || "");
    if (message === "STRIPE_NOT_CONFIGURED") {
      return res.status(500).json({ error: "Stripe is not configured on the server yet." });
    }
    if (message === "MISSING_NAME") {
      return res.status(400).json({ error: "Your account must have a name before checkout." });
    }
    if (message.startsWith("NOT_FOUND:")) {
      const [, id] = message.split(":");
      return res.status(404).json({ error: `DVD ${id} was not found.` });
    }
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      const [, id, name, stock, requested] = message.split(":");
      return res.status(409).json({
        error: `Not enough stock for "${name}" (ID ${id}). In stock: ${stock}, requested: ${requested}.`,
      });
    }
    console.error("Create checkout session error:", err);
    return res.status(500).json({ error: "Failed to create Stripe checkout session." });
  }
});

router.post("/checkout/confirm", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const sessionId = String(req.body?.sessionId || "").trim();

  if (!sessionId) {
    return res.status(400).json({ error: "Stripe session id is required." });
  }

  try {
    const stripe = requireStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Stripe payment has not completed yet." });
    }

    const pendingCheckoutId = String(session.metadata?.pendingCheckoutId || "");
    if (!pendingCheckoutId) {
      return res.status(400).json({ error: "Missing pending checkout metadata." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const pending = await tx.pendingCheckout.findFirst({
        where: { id: pendingCheckoutId, userId },
      });

      if (!pending) {
        throw new Error("PENDING_NOT_FOUND");
      }

      if (pending.status === PendingCheckoutStatus.COMPLETED && pending.completedOrderId) {
        const existingOrder = await tx.order.findUnique({
          where: { id: pending.completedOrderId },
          include: { items: true },
        });
        return existingOrder;
      }

      const normalizedOrderItems = Array.isArray(pending.itemsJson) ? pending.itemsJson : [];
      const ids = normalizedOrderItems.map((item) => item.inventoryId);
      const inventoryRows = await tx.inventory.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, stock: true },
      });
      const stockById = new Map(inventoryRows.map((row) => [row.id, row]));

      for (const item of normalizedOrderItems) {
        const row = stockById.get(item.inventoryId);
        if (!row) throw new Error(`NOT_FOUND:${item.inventoryId}`);
        if (row.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${row.id}:${row.name}:${row.stock}:${item.quantity}`);
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          phone: pending.contactPhone,
          address: pending.contactAddress,
        },
      });

      for (const item of normalizedOrderItems) {
        await tx.inventory.update({
          where: { id: item.inventoryId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount: Number(pending.totalAmount.toFixed(2)),
          items: {
            create: normalizedOrderItems.map((item) => ({
              inventoryId: item.inventoryId,
              title: item.title,
              quantity: item.quantity,
              unitPrice: Number(Number(item.unitPrice).toFixed(2)),
              orderType: item.orderType,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      await tx.pendingCheckout.update({
        where: { id: pending.id },
        data: {
          status: PendingCheckoutStatus.COMPLETED,
          completedOrderId: order.id,
        },
      });

      return order;
    });

    return res.status(201).json({ message: "Checkout completed.", order: result });
  } catch (err) {
    const message = String(err?.message || "");
    if (message === "STRIPE_NOT_CONFIGURED") {
      return res.status(500).json({ error: "Stripe is not configured on the server yet." });
    }
    if (message === "PENDING_NOT_FOUND") {
      return res.status(404).json({ error: "Pending checkout was not found." });
    }
    if (message.startsWith("NOT_FOUND:")) {
      const [, id] = message.split(":");
      return res.status(404).json({ error: `DVD ${id} was not found.` });
    }
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      const [, id, name, stock, requested] = message.split(":");
      return res.status(409).json({
        error: `Not enough stock for "${name}" (ID ${id}). In stock: ${stock}, requested: ${requested}.`,
      });
    }
    console.error("Confirm checkout error:", err);
    return res.status(500).json({ error: "Failed to confirm Stripe checkout." });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: {
            inventory: {
              select: { image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  } catch (err) {
    console.error("Fetch my orders error:", err);
    return res.status(500).json({ error: "Failed to fetch customer orders." });
  }
});

router.get("/customers", requireAuth, requireRole(["EMPLOYEE", "OWNER"]), async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: [
        { name: "asc" },
        { email: "asc" },
      ],
    });

    return res.json(customers);
  } catch (err) {
    console.error("Fetch customers error:", err);
    return res.status(500).json({ error: "Failed to fetch customers." });
  }
});

router.get("/customers/:userId", requireAuth, requireRole(["EMPLOYEE", "OWNER"]), async (req, res) => {
  try {
    const customer = await prisma.user.findFirst({
      where: { id: req.params.userId, role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        isActive: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const orders = await prisma.order.findMany({
      where: { userId: req.params.userId },
      include: {
        items: {
          include: {
            inventory: {
              select: { image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ customer, orders });
  } catch (err) {
    console.error("Fetch customer detail error:", err);
    return res.status(500).json({ error: "Failed to fetch customer details." });
  }
});

router.get("/recent", requireAuth, requireRole(["EMPLOYEE", "OWNER"]), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            inventory: {
              select: { image: true },
            },
          },
        },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json(orders);
  } catch (err) {
    console.error("Fetch recent orders error:", err);
    return res.status(500).json({ error: "Failed to fetch recent orders." });
  }
});

export default router;
