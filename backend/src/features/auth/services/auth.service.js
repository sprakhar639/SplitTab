import bcrypt from "bcrypt";
import AppError from "../../../utils/AppError.js";
import db from "../../../prisma/db.ts";
import { or } from "@prisma/orm-postgres/orm-client";

import { createSession, deleteSession } from "./session.service.js";

const { User } = db.orm.public;

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
  await deleteSession(sessionId);
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

export { register, login, logout, getCurrentUser };
