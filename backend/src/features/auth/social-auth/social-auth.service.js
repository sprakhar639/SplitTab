import { and } from "@prisma/orm-postgres/orm-client";
import AppError from "../../../utils/AppError.js";
import db from "../../../prisma/db.ts";
import { verifyGoogleToken } from "./google.service.js";
import { createSession } from "../services/session.service.js";

async function generateUsername(tx, email) {
  const { User } = tx.orm.public;

  const emailPrefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);

  const baseUsername = emailPrefix || "googleuser";

  let username = baseUsername;
  let counter = 1;

  while (await User.where((user) => user.username.eq(username)).first()) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

async function googleLogin(idToken) {
  const googleUser = await verifyGoogleToken(idToken);

  const user = await db.transaction(async (tx) => {
    const { User, Account } = tx.orm.public;

    // 1. Check whether this Google identity is already linked.
    const existingAccount = await Account.where((account) =>
      and(
        account.provider.eq("google"),
        account.providerAccountId.eq(googleUser.providerAccountId),
      ),
    ).first();

    if (existingAccount) {
      const existingUser = await User.where((user) =>
        user.id.eq(existingAccount.userId),
      ).first();

      if (!existingUser) {
        throw new AppError("Linked user account was not found", 404);
      }

      return existingUser;
    }

    // 2. Check whether an account already exists with this email.
    const existingEmailUser = await User.where((user) =>
      user.email.eq(googleUser.email),
    ).first();

    if (existingEmailUser) {
      // Automatically link Google to the existing SplitTab account.
      await Account.create({
        userId: existingEmailUser.id,
        provider: "google",
        providerAccountId: googleUser.providerAccountId,
      });

      return existingEmailUser;
    }

    // 3. Create a username for a new Google user.
    const username = await generateUsername(tx, googleUser.email);

    // 4. Create a new SplitTab user.
    const newUser = await User.create({
      email: googleUser.email,
      username,
      name: googleUser.name || googleUser.email.split("@")[0],
      passwordHash: null,
    });

    // 5. Link the new user to Google.
    await Account.create({
      userId: newUser.id,
      provider: "google",
      providerAccountId: googleUser.providerAccountId,
    });

    return newUser;
  });

  // 6. Create the existing Redis-backed session.
  const sessionToken = await createSession(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
    },
    sessionToken,
  };
}

export { googleLogin };
