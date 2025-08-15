import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { syncMeetingToGoogle } from '../services/google.js';

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

const normalizeHex = (hex) => {
  if (hex == null) return null;
  return hex.startsWith("#") ? hex : `#${hex}`;};

const parseBool = (v) => (typeof v === "string" ? v.toLowerCase() === "true" : !!v);

const userScope = (user) => ({
  OR: [
    { organizerId: user.id },
    {
      invitations: {
        some: {
          OR: [
            { inviteeId: user.id, status: "ACCEPTED" },
            { email: user.email, status: "ACCEPTED" },
          ],
        },
      },
    },
  ],
});

function addLocalTime(meeting, currentUserId) {
  return {
    ...meeting,
    startTimeLocal: meeting.startTime
      ? new Date(meeting.startTime).toLocaleString("en-US", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      : null,
    endTimeLocal: meeting.endTime
      ? new Date(meeting.endTime).toLocaleString("en-US", {        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      : null,    organizer: meeting.organizerId === currentUserId,
  };
}

async function autoArchivePastMeetings() {
  const now = new Date();
  try {
    await prisma.meeting.updateMany({
      where: { archived: false, endTime: { lt: now } },
      data: { archived: true },
    });
  } catch (e) {
    // console.error("autoArchivePastMeetings Failed:", e?.message || e);
  }
}

async function hasOverlap(userId, userEmail, start, end, excludeId = null) {
  const overlap = await prisma.meeting.findFirst({
    where: {
      archived: false,
      NOT: excludeId ? { id: excludeId } : undefined,
      OR: [
        {
          organizerId: userId,
          startTime: { lt: end },
          endTime: { gt: start },
        },
        {
          invitations: {
            some: {
              OR: [{ inviteeId: userId }, { email: userEmail }],
              status: "ACCEPTED",
            },
          },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      ],
    },
  });
  return !!overlap;
}

router.post("/", requireAuth, async (req, res) => {
  try {    const input = createMeetingSchema.parse(req.body);
    const now = new Date();
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);

    if (start >= end) {
      return res.status(400).json({ error: "Start Time must be before End Time" });
    }

    if (await hasOverlap(req.user.id, req.user.email, start, end)) {
      return res.status(400).json({ error: "You already have a Meeting during this Time" });
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: input.title,
        description: input.description,
        startTime: start,
        endTime: end,
        colorHex: normalizeHex(input.colorHex ?? null),
        reminderMinutesBefore: input.reminderMinutesBefore ?? null,
        organizerId: req.user.id,
        organizerEmail: req.user.email,
        archived: end < now,
      },
    });

    const invitees = input.invitees || [];
    if (invitees.includes(req.user.email)) {
      return res.status(400).json({ error: "You Cannot Invite Yourself" });
    }

    if (invitees.length > 0) {
      await prisma.$transaction(
        invitees.map((email) =>
          prisma.invitation.create({
            data: { meetingId: meeting.id, email },
          })
        )
      );
    }

    try {
      const googleCredential = await prisma.googleCredential.findUnique({
        where: { ownerEmail: req.user.email },
      });
      if (googleCredential) {        // console.log(`User ${req.user.email} is connected to Google. Syncing new meeting ID: ${meeting.id}`);
        await syncMeetingToGoogle(meeting.id, req.user.id, req.user.email);
          console.log(`Meeting ${meeting.id} synced successfully to Google Calendar.`);
      }
    } catch (syncError) {
        console.error(`BACKGROUND_SYNC_FAILED: Could not sync meeting ${meeting.id} to Google Calendar for user ${req.user.email}. Error:`, syncError.message);
    }

    res.status(201).json(addLocalTime(meeting, req.user.id));
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.issues });
      console.error(err);
    res.status(500).json({ error: "Failed to Create Meeting" });
  }
});

router.get("/archives/list", requireAuth, async (req, res) => {
  try {
    await autoArchivePastMeetings();
    const meetings = await prisma.meeting.findMany({
      where: { archived: true, ...userScope(req.user) },
      orderBy: { startTime: "desc" },
      include: { invitations: true },
    });
    res.json(meetings.map((m) => addLocalTime(m, req.user.id)));
  } catch (err) {
      console.error(err);
    res.status(500).json({ error: "Failed to Fetch Archives" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    await autoArchivePastMeetings();
    const { start, end } = req.query;
    const includeArchived = parseBool(req.query.includeArchived);

    const dateFilter =
      start && end
        ? {
          startTime: { gte: new Date(String(start)) },
          endTime: { lte: new Date(String(end)) },
        }
        : {};

    const meetings = await prisma.meeting.findMany({
      where: {
        ...dateFilter,
        ...(includeArchived ? {} : { archived: false }),
        ...userScope(req.user),
      },
      include: { invitations: true },
      orderBy: { startTime: "asc" },
    });

    res.json(meetings.map((m) => addLocalTime(m, req.user.id)));
  } catch (err) {
      console.error(err);
    res.status(500).json({ error: "Failed to Fetch Meetings" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    await autoArchivePastMeetings();
    const meeting = await prisma.meeting.findFirst({      where: { id: req.params.id, ...userScope(req.user) },
      include: { invitations: true },
    });
    if (!meeting) return res.status(404).json({ error: "Not Found" });
    res.json(addLocalTime(meeting, req.user.id));
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: "Failed to Fetch Meeting" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const input = createMeetingSchema.partial().parse(req.body);
    const existing = await prisma.meeting.findUnique({
      where: { id: req.params.id },
    });
    if (!existing || existing.organizerId !== req.user.id) {
      return res.status(403).json({ error: "Not Authorized" });
    }

    const now = new Date();
    const newStart =
      input.startTime !== undefined
        ? new Date(input.startTime)
        : existing.startTime;
    const newEnd =
      input.endTime !== undefined ? new Date(input.endTime) : existing.endTime;

    if (newStart >= newEnd) {
      return res.status(400).json({ error: "Start Time Must be Before End Time" });
    }

    if (await hasOverlap(req.user.id, req.user.email, newStart, newEnd, existing.id)) {
      return res.status(400).json({ error: "You already have a Meeting during this Time" });
    }

    const updated = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),        ...(input.startTime !== undefined ? { startTime: newStart } : {}),
        ...(input.endTime !== undefined ? { endTime: newEnd } : {}),
        ...(input.colorHex !== undefined ? { colorHex: normalizeHex(input.colorHex) } : {}),
        ...(input.reminderMinutesBefore !== undefined ? { reminderMinutesBefore: input.reminderMinutesBefore } : {}),
        archived: newEnd < now,
      },
    });

    res.json(addLocalTime(updated, req.user.id));
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.issues });
        console.error(err);    res.status(500).json({ error: "Failed to Update Meeting" });
  }});

router.post("/:id/archive", requireAuth, async (req, res) => {
  try {
    const existing = await prisma.meeting.findUnique({
      where: { id: req.params.id },
    });
    if (!existing || existing.organizerId !== req.user.id) {
      return res.status(403).json({ error: "Not Authorized" });
    }
    const updated = await prisma.meeting.update({
      where: { id: req.params.id },
      data: { archived: true },
    });
    res.json(addLocalTime(updated, req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to Archive Meeting" });
  }
});

export default router;
