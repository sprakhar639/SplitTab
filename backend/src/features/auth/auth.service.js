import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../../prisma/db.ts";
import redis from "../../config/redis.js";
import { or } from "@prisma/orm-postgres/orm-client";
const { User } = db.orm.public;

async function register({ username, email, password, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    username,
    name,
    passwordHash,
  });

  const {sessionToken} = await createSession(user.id);
  return sessionToken;
}

async function login({ identifier, password }) {
  const user = await User.where((u) =>
    or(u.email.eq(identifier), u.username.eq(identifier)),
  ).first();

  if (!user) {
    throw new Error("User Not Found");
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new Error("Wrong Password");
  }

  const {sessionToken} = await createSession(user.id);
  return sessionToken;
}

async function logout(sessionId) {
  const tokenHash = crypto.createHash("sha256").update(sessionId).digest("hex");
  await redis.del(`session:${tokenHash}`);
}

async function createSession(userId) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");
  await redis.set(
    `session:${tokenHash}`,
    String(userId),
    "EX",
    7 * 24 * 60 * 60,
  );
  return { sessionToken };
}
export { register, login, logout };
