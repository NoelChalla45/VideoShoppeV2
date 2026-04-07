// Inventory routes for catalog browsing and owner updates.
import express from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Group duplicate checkout items so stock is checked once per DVD.
function normalizeCheckoutItems(items = []) {
  const grouped = new Map();

  for (const raw of items) {
    const id = Number.parseInt(raw?.id, 10);
    const quantity = Number.parseInt(raw?.quantity, 10);

    if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    const current = grouped.get(id) || 0;
    grouped.set(id, current + quantity);
  }

  return Array.from(grouped.entries()).map(([id, quantity]) => ({ id, quantity }));
}

// ── GET ALL DVDS (Catalog View) ───────────────────────────────
router.get("/", async (req, res) => {
  try {
    const dvds = await prisma.inventory.findMany({
      orderBy: { id: "asc" }, 
    });
    res.json(dvds);
  } catch (err) {
    console.error("Error fetching all DVDs:", err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// ── CHECKOUT (DECREMENT STOCK) ───────────────────────────────
router.post("/checkout", async (req, res) => {
  const normalizedItems = normalizeCheckoutItems(req.body?.items);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: "Checkout items are required." });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const ids = normalizedItems.map((item) => item.id);
      const inventoryRows = await tx.inventory.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, stock: true },
      });

      const stockById = new Map(inventoryRows.map((row) => [row.id, row]));

      // Validate stock before applying any updates.
      for (const item of normalizedItems) {
        const row = stockById.get(item.id);
        if (!row) {
          throw new Error(`NOT_FOUND:${item.id}`);
        }
        if (row.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${row.id}:${row.name}:${row.stock}:${item.quantity}`);
        }
      }

      // Decrement stock for each checked-out title.
      for (const item of normalizedItems) {
        await tx.inventory.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });
      }
    });

    return res.json({ message: "Checkout stock updated." });
  } catch (err) {
    const message = String(err?.message || "");

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

    console.error("Checkout stock update error:", err);
    return res.status(500).json({ error: "Failed to update stock for checkout." });
  }
});

// ── EMPLOYEE RESTOCK ─────────────────────────────────────────
router.post("/:id/restock", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const amount = Number.parseInt(req.body?.amount, 10);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid inventory id." });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: "Restock amount must be a positive integer." });
  }

  try {
    const updated = await prisma.inventory.update({
      where: { id },
      data: { stock: { increment: amount } },
    });
    return res.json(updated);
  } catch (err) {
    console.error("Restock error:", err);
    return res.status(404).json({ error: "DVD not found or restock failed." });
  }
});

// ── GET SINGLE DVD BY ID (Detail View) ────────────────────────
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const dvd = await prisma.inventory.findUnique({
      where: { 
        id: parseInt(id)
      },
    });

    if (!dvd) {
      return res.status(404).json({ error: "DVD not found in database" });
    }

    res.json(dvd);
  } catch (err) {
    console.error(`Error fetching DVD ID ${id}:`, err);
    res.status(500).json({ error: "Server error fetching movie details" });
  }
});

// ── ADD NEW DVD ───────────────────────────────────────────────
router.post("/add", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const { name, price, category, stock, year, rating, director, cast, image, description } = req.body;

  try {
    const dvd = await prisma.inventory.create({
      data: {
        name,
        price: Number(price),
        category,
        stock: Number(stock) || 0,
        year: year ? Number(year) : null,
        rating: rating ? String(rating) : null, 
        director: director || null,
        cast: cast || null,
        image,
        description: description || null,
      },
    });

    res.status(201).json(dvd);
  } catch (err) {
    console.error("Error creating DVD:", err);
    res.status(400).json({ error: "Error adding DVD" });
  }
});

// ── UPDATE DVD ────────────────────────────────────────────────
router.put("/:id", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const id = parseInt(req.params.id); 

  try {
    const updated = await prisma.inventory.update({
      where: { id }, 
      data: {
        ...req.body,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        stock: req.body.stock !== undefined ? parseInt(req.body.stock) : undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error("Error updating DVD:", err);
    res.status(404).json({ error: "DVD not found or update failed" });
  }
});

// ── DELETE DVD ────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  try {
    await prisma.inventory.delete({
      where: { id: parseInt(req.params.id) }, 
    });
    res.json({ message: "DVD removed" });
  } catch (err) {
    console.error("Error deleting DVD:", err);
    res.status(404).json({ error: "DVD not found" });
  }
});

export default router;
