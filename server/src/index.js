import app from "./app.js";
import { config } from "./config/env.js";
import cron from "node-cron";
import { prisma } from "./prisma.js";
import { sendMail } from "./config/mailer.js";
import { buildReminderEmail } from "./utils/emailTemplates.js";
import { differenceInMilliseconds } from "date-fns";

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const meetings = await prisma.meeting.findMany({
      where: {
        archived: false,
        startTime: { gt: now },
        reminderMinutesBefore: { not: null },
      },
      include: {
        invitations: true,
        organizer: true,
      },
    });

    for (const meeting of meetings) {
      const diffMs = meeting.startTime - now;
      const diffMinutes = diffMs / 60000;

      if (
        Math.abs(diffMinutes - meeting.reminderMinutesBefore) < 0.5 &&
        !meeting.organizerReminderSent
      ) {
        const { subject, html } = buildReminderEmail({ meeting });

        try {
          await prisma.$transaction(async (tx) => {
            const updated = await tx.meeting.updateMany({
              where: { id: meeting.id, organizerReminderSent: false },
              data: { organizerReminderSent: true },
            });

            if (updated.count > 0) {
              await sendMail({ to: meeting.organizerEmail, subject, html });
              console.log(
                `Organizer reminder sent to ${meeting.organizerEmail} for "${meeting.title}"`
              );
            }
          });
        } catch (err) {
          console.error(
            `Failed to send organizer reminder to ${meeting.organizerEmail}:`,
            err.message
          );
        }
      }

      if (Math.abs(diffMinutes - meeting.reminderMinutesBefore) < 0.5) {
        const { subject, html } = buildReminderEmail({ meeting });
        for (const inv of meeting.invitations) {
          if (!inv.email || inv.reminderSent || inv.status !== "ACCEPTED")
            continue;
          try {
            await prisma.$transaction(async (tx) => {
              const updated = await tx.invitation.updateMany({
                where: { id: inv.id, reminderSent: false },
                data: { reminderSent: true },
              });

              if (updated.count > 0) {
                await sendMail({ to: inv.email, subject, html });
                console.log(
                  `Invitee reminder sent to ${inv.email} for "${meeting.title}"`
                );
              }
            });
          } catch (err) {
            console.error(
              `Failed to send invitee reminder to ${inv.email}:`,
              err.message
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("Reminder cron failed:", err.message);
  }
});

cron.schedule("0 * * * *", async () => {
  try {
    const result = await prisma.meeting.updateMany({
      where: { archived: false, endTime: { lt: new Date() } },
      data: { archived: true },
    });
    console.log(`Archived ${result.count} past meetings.`);
  } catch (err) {
    console.error("Archive cron failed:", err.message);
  }
});

export default server;
