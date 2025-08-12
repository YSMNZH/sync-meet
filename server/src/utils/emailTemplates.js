import { format } from "date-fns";

export function buildInvitationEmail({ meeting, invitationLink }) {
  const subject = `Invitation: ${meeting.title}`;
  const html = `
    <h2>You are invited to: ${meeting.title}</h2>
    <p>${meeting.description || ""}</p>
    <p><strong>When:</strong> ${format(new Date(meeting.startTime), "PPpp")} - ${format(new Date(meeting.endTime), "PPpp")}</p>
    <p>
      Please respond: <a href="${invitationLink}">Respond to invitation</a>
    </p>
  `;
  return { subject, html };
}

export function buildReminderEmail({ meeting }) {
  const subject = `Reminder: ${meeting.title} starting soon`;
  const html = `
    <h2>Reminder: ${meeting.title}</h2>
    <p>${meeting.description || ""}</p>
    <p><strong>Starts at:</strong> ${format(new Date(meeting.startTime), "PPpp")}</p>
  `;
  return { subject, html };
}