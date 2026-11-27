import crypto from "crypto";
import redis from "../../../config/redis.js";

// Redis session configuration
const SESSION_DURATION = 7 * 24 * 60 * 60;
const SESSION_PREFIX = "splittab:session:";
const USER_SESSIONS_PREFIX = "splittab:user-sessions:";

// Generate SHA-256 hash of session token
function hashSessionToken(sessionToken) {
  return crypto.createHash("sha256").update(sessionToken).digest("hex");
}

// CREATE SESSION
async function createSession(userId) {
  // Generate cryptographically secure token
  const sessionToken = crypto.randomBytes(32).toString("hex");

  // Store only its hash in Redis
  const tokenHash = hashSessionToken(sessionToken);

  const sessionKey = `${SESSION_PREFIX}${tokenHash}`;
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

  // Store session
  await redis.set(sessionKey, String(userId), "EX", SESSION_DURATION);

  // Maintain a per-user session index
  await redis.sadd(userSessionsKey, tokenHash);
  await redis.expire(userSessionsKey, SESSION_DURATION);

  return sessionToken;
}

// DELETE ONE SESSION
async function deleteSession(sessionToken) {
  if (!sessionToken) {
    return;
  }

  const tokenHash = hashSessionToken(sessionToken);

  const sessionKey = `${SESSION_PREFIX}${tokenHash}`;

  // Get user ID before deleting session
  const userId = await redis.get(sessionKey);

  // Delete session
  await redis.del(sessionKey);

  // Remove session from user's session index
  if (userId) {
    await redis.srem(`${USER_SESSIONS_PREFIX}${userId}`, tokenHash);
  }
}

// INVALIDATE ALL USER SESSIONS
async function invalidateUserSessions(userId) {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID for session invalidation");
  }

  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

  // Get all session hashes belonging to the user
  const sessionHashes = await redis.smembers(userSessionsKey);

  // Build Redis session keys
  if (sessionHashes.length > 0) {
    const sessionKeys = sessionHashes.map((hash) => `${SESSION_PREFIX}${hash}`);

    // Delete all sessions
    await redis.del(...sessionKeys);
  }

  // Delete user's session index
  await redis.del(userSessionsKey);
}

export {
  hashSessionToken,
  createSession,
  deleteSession,
  invalidateUserSessions,
};
