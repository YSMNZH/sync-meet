import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import meetingsRouter from "./routes/meetings.js";
import invitationsRouter from "./routes/invitations.js";
import googleRouter from "./routes/google.js";
import authRouter from "./routes/auth.js";

const app = express();

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "syncmeet-server" });
});

app.use("/api/meetings", meetingsRouter);
app.use("/api/invitations", invitationsRouter);
app.use("/api/google", googleRouter);
app.use("/api/auth", authRouter);

export default app;