import bcrpyt from "bcrypt";
import crypto from "crypto";
import db from "../../prisma/db.ts";
import { or } from "@prisma/orm-postgres/orm-client";
const { User, Session } = db.orm.public;

async function register({ username, email, password, name }) {
  try {
    const passwordHash = await bcrpyt.hash(password, 10);
    const user = await User.create({
      email,
      username,
      name,
      passwordHash,
    });

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const session = await Session.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { sessionToken };
  } catch (error) {
    console.error("error message", error);
  }
}

async function login({ identifier, password }) {
  try {
    const user = await User.where((u) =>
      or(u.email.eq(identifier), u.username.eq(identifier)),
    ).first();

    if (!user) {
      throw new Error("User Not Found");
    }

    const passwordMatch = await bcrpyt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      throw new Error("Wrong Password");
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const session = await Session.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return { sessionToken };
  } catch (error) {
    console.error("error", error);
    throw error;
  }
}

async function logout(sessionId) {
  const hashSession = crypto
    .createHash("sha256")
    .update(sessionId)
    .digest("hex");
  await Session.where((u) => u.tokenHash.eq(hashSession)).delete();
}
export { register, login, logout };
