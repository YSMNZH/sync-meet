import { format } from "date-fns";

export function buildReminderEmail({ meeting }) {
  const subject = `Reminder: ${meeting.title} starting soon`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <div style="background-color: #4f46e5; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Meeting Reminder</h1>
    </div>
    <div style="padding: 20px; color: #333;">
      <h2 style="margin-top: 0; color: #4f46e5;">${meeting.title}</h2>
      <p style="margin: 10px 0;">${meeting.description || "No description provided."}</p>
      <p style="margin: 10px 0;"><strong>Organizer:</strong> ${meeting.organizer?.name || "N/A"}</p>
      <p style="margin: 10px 0;"><strong>Starts at:</strong> ${format(new Date(meeting.startTime), "PPpp")}</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="text-align: center; color: #555; font-size: 14px;">This is an automated reminder from SyncMeet.</p>
    </div>
  </div>
  `;

  return { subject, html };
}
