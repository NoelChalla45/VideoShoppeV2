// Authentication routes plus owner-only employee lookups.
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Normalize incoming role values before saving them.
function normalizeRole(inputRole) {
  const role = String(inputRole || "CUSTOMER").toUpperCase();
  if (role === "EMPLOYEE") return UserRole.EMPLOYEE;
  if (role === "OWNER") return UserRole.OWNER;
  return UserRole.CUSTOMER;
}

// ── Register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, password, name, role, phone, address, employmentType } = req.body;
  const normalizedName = String(name || "").trim();

  if (!email || !password || !normalizedName) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const normalizedRole = normalizeRole(role);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: normalizedName,
        role: normalizedRole,
        phone: phone || null,
        address: address || null,
        employmentType: employmentType || null,
      },
    });

    // Return a signed token so the frontend can stay logged in.
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, address: user.address },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── Login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Return the same token shape used during registration.
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, address: user.address },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── Get current user (protected) ──────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true, phone: true, address: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user });
  } catch (err) {
    console.error("Fetch current user error:", err);
    res.status(500).json({ error: "Failed to load current user." });
  }
});

// ── Owner: list employee accounts ─────────────────────────────
router.get("/employees", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: UserRole.EMPLOYEE },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        employmentType: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(employees);
  } catch (err) {
    console.error("List employees error:", err);
    return res.status(500).json({ error: "Failed to fetch employee accounts." });
  }
});

// ── Owner: employee account detail ────────────────────────────
router.get("/employees/:id", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  try {
    const employee = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.EMPLOYEE },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        employmentType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found." });
    }
    return res.json(employee);
  } catch (err) {
    console.error("Employee detail error:", err);
    return res.status(500).json({ error: "Failed to fetch employee details." });
  }
});

export default router;
