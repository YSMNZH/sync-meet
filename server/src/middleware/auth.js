import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { config } from "../config/env.js";

export async function requireAuth(req, res, next) {
  let token;
  
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {    token = req.headers.authorization.replace("Bearer ", "");
  }
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Invalid user" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}