import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { config } from "../config/env.js";
import { sendMail } from "../config/mailer.js";
import { buildInvitationEmail } from "../utils/emailTemplates.js";

const router = Router();

const createMeetingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  colorHex: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional(),
  reminderMinutesBefore: z.number().int().min(1).max(1440).optional(),
  invitees: z.array(z.string().email()).optional(),
});

router.post("/", async (req, res) => {
  try {
    const input = createMeetingSchema.parse(req.body);

    const meeting = await prisma.meeting.create({
      data: {
        title: input.title,
        description: input.description,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        colorHex: input.colorHex?.startsWith("#") ? input.colorHex : input.colorHex ? `#${input.colorHex}` : null,
        reminderMinutesBefore: input.reminderMinutesBefore ?? null,
      },
    });

    const invitees = input.invitees || [];
    if (invitees.length > 0) {
      const invitations = await prisma.$transaction(
        invitees.map((email) =>
          prisma.invitation.create({ data: { meetingId: meeting.id, email } })
        )
      );

      for (const inv of invitations) {
        const invitationLink = `${config.clientUrl}/invite?token=${inv.token}`;
        const { subject, html } = buildInvitationEmail({ meeting, invitationLink });
        try {
          await sendMail({ to: inv.email, subject, html });
        } catch (err) {
          console.error("Failed to send invitation to", inv.email, err?.message);
        }
      }
    }

    res.status(201).json(meeting);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.issues });
    console.error(err);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { start, end, includeArchived } = req.query;
    const where = {
      ...(start && end
        ? { startTime: { gte: new Date(String(start)) }, endTime: { lte: new Date(String(end)) } }
        : {}),
      ...(includeArchived ? {} : { archived: false }),
    };

    const meetings = await prisma.meeting.findMany({ where, orderBy: { startTime: "asc" } });
    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id }, include: { invitations: true } });
    if (!meeting) return res.status(404).json({ error: "Not found" });
    res.json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch meeting" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const input = createMeetingSchema.partial().parse(req.body);
    const updated = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.startTime !== undefined ? { startTime: new Date(input.startTime) } : {}),
        ...(input.endTime !== undefined ? { endTime: new Date(input.endTime) } : {}),
        ...(input.colorHex !== undefined
          ? { colorHex: input.colorHex?.startsWith("#") ? input.colorHex : `#${input.colorHex}` }
          : {}),
        ...(input.reminderMinutesBefore !== undefined ? { reminderMinutesBefore: input.reminderMinutesBefore } : {}),
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.issues });
    console.error(err);
    res.status(500).json({ error: "Failed to update meeting" });
  }
});

router.post("/:id/archive", async (req, res) => {
  try {
    const updated = await prisma.meeting.update({ where: { id: req.params.id }, data: { archived: true } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to archive meeting" });
  }
});

router.get("/archives/list", async (_req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({ where: { archived: true }, orderBy: { startTime: "desc" } });
    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch archives" });
  }
});

export default router;
