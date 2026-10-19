import express from "express";
import db from "../prisma/db.ts";
import crypto from "crypto";

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.sessionId;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const session = await db.orm.public.Session.where((s) =>
      s.tokenHash.eq(tokenHash),
    ).first();
    if (!session) {
      return res.status(401).json({ message: "Session Not Found" });
    }

    if(new Date()>session.expiresAt){
     return res.status(401).json({message:"Session Expired"})
    }

    req.user={id:session.userId};
    next();
  } catch (error) {
    console.error("Error:", error);
  }
}

export default authMiddleware;
