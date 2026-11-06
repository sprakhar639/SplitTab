import crypto from "crypto";
import redis from "../config/redis.js"

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.sessionId;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Session cookie missing. Please log in again." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

   const userId= await redis.get(`session:${tokenHash}`);

    if (!userId) {
      return res.status(401).json({ message: "Session Not Found" });
    }

    req.user = { id:userId };
    next();
  } catch (error) {
    next(error)
  }
}

export default authMiddleware;
