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
        OR: [
          { inviteeId: userId },
          { email: userEmail }
        ]
      },
      include: {
        meeting: { select: { id: true, title: true, description: true, organizerId: true } },
        invitee: { select: { id: true, name: true, email: true } },
      },
    });

    const meetings = await prisma.meeting.findMany({
      where: { organizerId: userId },
      select: { id: true },
    });
    const meetingIds = meetings.map(m => m.id);

const sent = await prisma.invitation.findMany({
  where: { meeting: { organizerId: userId } },
  include: {
    meeting: { select: { id: true, title: true, description: true, startTime: true, endTime: true, colorHex: true } },
    invitee: { select: { id: true, name: true, email: true } },
  },
});


    res.json({ sent, received });
  } catch (err) {
    console.error("Error fetching invitations:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/respond", requireAuth, async (req, res) => {
  try {
    const { token, status } = req.body;

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation) return res.status(404).json({ error: "Invitation not found" });

    if (invitation.inviteeId && invitation.inviteeId !== req.user.id && invitation.email !== req.user.email) {
      return res.status(403).json({ error: "Not allowed to respond" });
    }

    const updated = await prisma.invitation.update({
      where: { token },
      data: { status, respondedAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    console.error("Error responding to invitation:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
