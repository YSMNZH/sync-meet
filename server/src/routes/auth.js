import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { config } from "../config/env.js";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

router.post("/signup", async (req, res) => {
  try {
    const input = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { email: input.email, name: input.name || null, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    const token = jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: "7d" });
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.issues });
    console.error(err);
    res.status(500).json({ error: "Failed to sign up" });
  }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post("/login", async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(input.password, user.passwordHash || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const publicUser = { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt };
    const token = jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: "7d" });
    res.json({ user: publicUser, token });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.issues });
    console.error(err);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt });
  } catch (err) {
    const message = err?.name === "JsonWebTokenError" ? "Invalid token" : "Failed to fetch user";
    const status = err?.name === "JsonWebTokenError" ? 401 : 500;
    res.status(status).json({ error: message });
  }
});

export default router;


