import app from "./app.js";
import { config } from "./config/env.js";
import cron from "node-cron";
import { prisma } from "./prisma.js";
import { sendMail } from "./config/mailer.js";
import { buildReminderEmail } from "./utils/emailTemplates.js";
import { addMinutes, isAfter, isBefore } from "date-fns";

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const in60 = addMinutes(now, 60);

    const meetings = await prisma.meeting.findMany({
      where: {
        archived: false,
        startTime: { gte: now, lte: in60 },
        reminderMinutesBefore: { not: null },
      },
      include: { 
        invitations: true,
        organizer: true,
      },
    });
    let flag = false
    for (const meeting of meetings) {
      const reminderTime = addMinutes(new Date(meeting.startTime), -meeting.reminderMinutesBefore);
      if (isAfter(now, reminderTime) && isBefore(now, new Date(meeting.startTime))) {
        const { subject, html } = buildReminderEmail({ meeting });
        if (flag === false){
                try{        await sendMail({ to: meeting.organizerEmail, subject, html });
                    console.log(`Reminder sent to organizer ${meeting.organizerEmail} for meeting "${meeting.title}"`);
                    flag = true

}catch(err){
            flag = false
            console.error(`Failed to send reminder to ${meeting.organizerEmail}:`, err.message);
          }}
        for (const inv of meeting.invitations) {
            if (!inv.email || inv.reminderSent || inv.status != "ACCEPTED") continue; 
          try {
            await sendMail({ to: inv.email, subject, html });

            await prisma.invitation.update({
              where: { id: inv.id },
              data: { reminderSent: true },
            });
            console.log(`Reminder sent to ${inv.email} for meeting "${meeting.title}"`);
          } catch (err) {
            console.error(`Failed to send reminder to ${inv.email}:`, err.message);
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
