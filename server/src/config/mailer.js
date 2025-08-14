import nodemailer from "nodemailer";
import { config } from "./env.js";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465, 
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendMail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
  } catch (err) {
  }
}
