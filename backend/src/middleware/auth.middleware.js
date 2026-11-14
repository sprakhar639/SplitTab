import crypto from "crypto";
import redis from "../config/redis.js";

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.sessionId;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Session cookie missing. Please log in again." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const storedUserId = await redis.get(`session:${tokenHash}`);

    if (!storedUserId) {
      return res.status(401).json({ message: "Session Not Found" });
    }
    const userId = Number(storedUserId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      await redis.del(`session:${tokenHash}`);

      return res.status(401).json({
        message: "Invalid Session",
      });
    }

    req.user = { id: userId };
    console.log("User ID:", req.user.id);
    console.log("User ID type:", typeof req.user.id);
    next();
  } catch (error) {
    next(error);
  }
}

export default authMiddleware;
