import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.get("/my", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const received = await prisma.invitation.findMany({
      where: {
        OR: [{ inviteeId: userId }, { email: userEmail }],
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            colorHex: true,
            organizer: { select: { id: true, name: true, email: true } },
          },
        },
        invitee: { select: { id: true, name: true, email: true } },
      },
    });

    const sent = await prisma.invitation.findMany({
      where: { meeting: { organizerId: userId } },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            colorHex: true,
            organizer: { select: { id: true, name: true, email: true } },
          },
        },
        invitee: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ sent, received });
  } catch (err) {
    console.error("Error Fetching Invitations:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/respond", requireAuth, async (req, res) => {
  try {
    const { token, status } = req.body;
    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return res.status(400).json({ error: "Invalid Status" });
    }

    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation)
      return res.status(404).json({ error: "Invitation Not Found" });

    if (
      invitation.inviteeId &&
      invitation.inviteeId !== req.user.id &&
      invitation.email !== req.user.email
    ) {
      return res.status(403).json({ error: "Not Allowed to Respond" });
    }

    const updated = await prisma.invitation.update({
      where: { token },
      data: { status, respondedAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    console.error("Error Responding to Invitation:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
