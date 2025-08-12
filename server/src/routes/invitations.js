import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";

const router = Router();

router.get("/:token", async (req, res) => {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: req.params.token },
      include: { meeting: true },
    });
    if (!invitation) return res.status(404).json({ error: "Invalid token" });
    res.json(invitation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invitation" });
  }
});

const respondSchema = z.object({ token: z.string(), status: z.enum(["ACCEPTED", "DECLINED"]) });

router.post("/respond", async (req, res) => {
  try {
    const input = respondSchema.parse(req.body);
    const invitation = await prisma.invitation.update({
      where: { token: input.token },
      data: { status: input.status, respondedAt: new Date() },
    });
    res.json(invitation);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.issues });
    console.error(err);
    res.status(500).json({ error: "Failed to respond to invitation" });
  }
});

export default router;