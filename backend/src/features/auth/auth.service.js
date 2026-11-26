import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../../prisma/db.ts";
import redis from "../../config/redis.js";
import AppError from "../../utils/AppError.js";
import "temporal-polyfill/full/global";
import { and, or } from "@prisma/orm-postgres/orm-client";

const { User } = db.orm.public;

const SESSION_DURATION = 7 * 24 * 60 * 60;

// Redis session keys
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

// REGISTER
async function register({ username, email, password, name } = {}) {
  // Validate required fields
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof name !== "string" ||
    !username.trim() ||
    !email.trim() ||
    !password ||
    !name.trim()
  ) {
    throw new AppError("All fields are required", 400);
  }

  // Normalize input
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();
  name = name.trim();

  // Validate name
  if (name.length < 2) {
    throw new AppError("Name must contain at least 2 characters", 400);
  }

  // Validate username
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    throw new AppError(
      "Username must contain 3-20 letters, numbers or underscores",
      400,
    );
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Invalid email address", 400);
  }

  // Validate password
  if (password.length < 8 || password.length > 128) {
    throw new AppError(
      "Password must contain between 8 and 128 characters",
      400,
    );
  }

  // Check duplicate email or username
  const existingUser = await User.where((u) =>
    or(u.email.eq(email), u.username.eq(username)),
  ).first();

  if (existingUser) {
    throw new AppError("Email or username already exists", 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    passwordHash,
  });

  // Create session
  const sessionToken = await createSession(user.id);

  return sessionToken;
}

// LOGIN
async function login({ identifier, password } = {}) {
  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    !identifier.trim() ||
    !password
  ) {
    throw new AppError("Email/username and password are required", 400);
  }

  identifier = identifier.trim().toLowerCase();

  // Find user by email or username
  const user = await User.where((u) =>
    or(u.email.eq(identifier), u.username.eq(identifier)),
  ).first();

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  // Compare password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  // Create session
  const sessionToken = await createSession(user.id);

  return sessionToken;
}

// LOGOUT
async function logout(sessionId) {
  // No session cookie
  if (!sessionId) {
    return;
  }

  const tokenHash = hashSessionToken(sessionId);

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

// GET CURRENT USER
async function getCurrentUser(userId) {
  // Validate user ID
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AppError("Invalid user ID", 400);
  }

  // Find user
  const user = await User.where((u) => u.id.eq(userId)).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Return only required information
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
  };
}

// UPDATE USER PROFILE
async function updateProfile(userId, { name, username, email } = {}) {
  // Validate user ID
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AppError("Invalid user ID", 400);
  }

  // Find user
  const user = await User.where((u) => u.id.eq(userId)).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Build update object using only provided fields
  const updateData = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      throw new AppError("Name must contain at least 2 characters", 400);
    }

    updateData.name = name.trim();
  }

  if (username !== undefined) {
    if (typeof username !== "string") {
      throw new AppError("Invalid username", 400);
    }

    username = username.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw new AppError(
        "Username must contain 3-20 letters, numbers or underscores",
        400,
      );
    }

    updateData.username = username;
  }

  if (email !== undefined) {
    if (typeof email !== "string") {
      throw new AppError("Invalid email address", 400);
    }

    email = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("Invalid email address", 400);
    }

    updateData.email = email;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError("No fields provided for update", 400);
  }

  // Update user
  const updatedUser = await User.where((u) => u.id.eq(userId)).update(
    updateData,
  );

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    username: updatedUser.username,
    email: updatedUser.email,
  };
}

// CHANGE PASSWORD
async function changePassword(userId, { currentPassword, newPassword } = {}) {
  // 1. Validate user ID
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AppError("Invalid user ID", 400);
  }

  // 2. Validate password inputs
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  ) {
    throw new AppError("Both passwords are required", 400);
  }

  // 3. Validate new password length
  if (newPassword.length < 8 || newPassword.length > 128) {
    throw new AppError(
      "Password must contain between 8 and 128 characters",
      400,
    );
  }

  // 4. Fetch user
  const user = await User.where((u) => u.id.eq(userId)).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // 5. Verify current password
  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  // 6. Prevent reusing current password
  if (currentPassword === newPassword) {
    throw new AppError("New password must differ from current password", 400);
  }

  // 7. Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // 8. Update password
  await User.where((u) => u.id.eq(userId)).update({
    passwordHash,
  });

  // 9. Invalidate all existing Redis sessions
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

  const sessionHashes = await redis.smembers(userSessionsKey);

  if (sessionHashes.length > 0) {
    const sessionKeys = sessionHashes.map((hash) => `${SESSION_PREFIX}${hash}`);

    await redis.del(...sessionKeys);
  }

  await redis.del(userSessionsKey);

  return { success: true };
}

// FORGET PASSWORD
async function forgetPassword(email) {
  // Validate email
  if (typeof email !== "string" || !email.trim()) {
    throw new AppError("Email is required", 400);
  }

  email = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Invalid email address", 400);
  }

  // Find user
  const user = await User.where((u) => u.email.eq(email)).first();

  // Avoid exposing whether an account exists
  if (!user) {
    return { success: true };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token
  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Calculate expiration
  const expiresAt = Temporal.Now.instant().add({
    minutes: 5,
  });

  // Store token hash in database
  const { PasswordResetToken } = db.orm.public;

  // Invalidate previous unused reset tokens
  await PasswordResetToken.where((t) =>
    and(t.userId.eq(user.id), t.usedAt.isNull()),
  ).updateAll({
    usedAt: Temporal.Now.instant(),
  });

  await PasswordResetToken.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    success: true,
    resetToken,
  };
}

// RESET PASSWORD
async function resetPassword(password, token) {
  // Validate password
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new AppError(
      "Password must contain between 8 and 128 characters",
      400,
    );
  }

  // Validate token
  if (typeof token !== "string" || !token.trim()) {
    throw new AppError("Reset token is required", 400);
  }

  // Hash received token
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { PasswordResetToken } = db.orm.public;

  // Find reset token
  const check = await PasswordResetToken.where((t) =>
    t.tokenHash.eq(tokenHash),
  ).first();
  if (!check) {
    throw new AppError("Invalid reset token", 400);
  }

  // Check token usage
  if (check.usedAt !== null) {
    throw new AppError("Reset token has already been used", 400);
  }

  // Check token expiry
  if (Temporal.Instant.compare(check.expiresAt, Temporal.Now.instant()) <= 0) {
    throw new AppError("Reset token has expired", 400);
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, 10);

  // Atomically consume token and update password
  await db.transaction(async (tx) => {
    const { User, PasswordResetToken } = tx.orm.public;

    // Consume token only if it is unused and unexpired
    const consumedToken = await PasswordResetToken.where((t) =>
      and(
        t.id.eq(check.id),
        t.usedAt.isNull(),
        t.expiresAt.gt(Temporal.Now.instant()),
      ),
    ).update({
      usedAt: Temporal.Now.instant(),
    });

    if (!consumedToken) {
      throw new AppError(
        "Reset token is invalid, expired or already used",
        400,
      );
    }

    // Update associated user's password
    await User.where((u) => u.id.eq(check.userId)).update({
      passwordHash,
    });
  });

  // Invalidate all existing Redis sessions
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${check.userId}`;

  const sessionHashes = await redis.smembers(userSessionsKey);

  if (sessionHashes.length > 0) {
    const sessionKeys = sessionHashes.map((hash) => `${SESSION_PREFIX}${hash}`);

    await redis.del(...sessionKeys);
  }

  await redis.del(userSessionsKey);

  return { success: true };
}

export {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgetPassword,
  resetPassword,
};
