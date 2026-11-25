import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../../prisma/db.ts";
import redis from "../../config/redis.js";
import { or } from "@prisma/orm-postgres/orm-client";
const { User } = db.orm.public;
const SESSION_DURATION = 7 * 24 * 60 * 60;

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

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

  await redis.set(
    `splittab:session:${tokenHash}`,
    String(userId),
    "EX",
    SESSION_DURATION,
  );

  return sessionToken;
}

// REGISTER
async function register({ username, email, password, name }) {
  // Validate required fields
  if (!username || !email || !password || !name) {
    throw createError("All fields are required", 400);
  }

  // Normalize input
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();
  name = name.trim();

  // Validate name
  if (name.length < 2) {
    throw createError("Name must contain at least 2 characters", 400);
  }

  // Validate username
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    throw createError(
      "Username must contain 3-20 letters, numbers or underscores",
      400,
    );
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError("Invalid email address", 400);
  }

  // Validate password
  if (typeof password !== "string" || password.length < 8) {
    throw createError("Password must contain at least 8 characters", 400);
  }

  // Check duplicate email or username
  const existingUser = await User.where((u) =>
    or(u.email.eq(email), u.username.eq(username)),
  ).first();

  if (existingUser) {
    throw createError("Email or username already exists", 409);
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
async function login({ identifier, password }) {
  if (!identifier || !password) {
    throw createError("Email/username and password are required", 400);
  }

  identifier = identifier.trim().toLowerCase();

  // Find user by email or username
  const user = await User.where((u) =>
    or(u.email.eq(identifier), u.username.eq(identifier)),
  ).first();

  if (!user) {
    throw createError("Invalid credentials", 401);
  }

  // Compare password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw createError("Invalid credentials", 401);
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

  await redis.del(`splittab:session:${tokenHash}`);
}

// GET CURRENT USER
async function getCurrentUser(userId) {
  // Validate user ID
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw createError("Invalid user ID", 400);
  }

  // Find user
  const user = await User.where((u) => u.id.eq(userId)).first();

  if (!user) {
    throw createError("User not found", 404);
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
async function updateProfile(userId, { name, username, email }) {
  // Validate user ID
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw createError("Invalid user ID", 400);
  }

  // Find user
  const user = await User.where((u) => u.id.eq(userId)).first();

  if (!user) {
    throw createError("User not found", 404);
  }

  // Build update object using only provided fields
  const updateData = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      throw createError("Name must contain at least 2 characters", 400);
    }

    updateData.name = name.trim();
  }

  if (username !== undefined) {
    username = username.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw createError(
        "Username must contain 3-20 letters, numbers or underscores",
        400,
      );
    }

    updateData.username = username;
  }

  if (email !== undefined) {
    email = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError("Invalid email address", 400);
    }

    updateData.email = email;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError("No fields provided for update", 400);
  }

  // Update user
  const updatedUser = await User.where((u) => u.id.eq(userId)).update(
    updateData,
  );

  return {
    name: updatedUser.name,
    username: updatedUser.username,
    email: updatedUser.email,
  };
}

export { register, login, logout, getCurrentUser, updateProfile };
