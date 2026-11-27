import db from "../../../prisma/db.ts";
import AppError from "../../../utils/AppError.js";
import { and } from "@prisma/orm-postgres/orm-client";

const { User } = db.orm.public;

async function linkOAuthAccount(userId, { provider, providerAccountId } = {}) {
  const { Account } = db.orm.public;

  // Validate provider
  const allowedProviders = ["google", "instagram", "linkedin"];

  if (!allowedProviders.includes(provider)) {
    throw new AppError("Unsupported OAuth provider", 400);
  }

  // Validate provider account ID
  if (typeof providerAccountId !== "string" || !providerAccountId.trim()) {
    throw new AppError("Invalid provider account ID", 400);
  }

  // Validate user ID
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AppError("Invalid user ID", 400);
  }

  // Verify that the SplitTab user exists
  const user = await User.where((u) => u.id.eq(userId)).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check whether this provider account is already linked
  const existingAccount = await Account.where((a) =>
    and(a.provider.eq(provider), a.providerAccountId.eq(providerAccountId)),
  ).first();

  if (existingAccount) {
    // Already linked to this user
    if (existingAccount.userId === userId) {
      return {
        success: true,
        message: "Account already linked",
      };
    }

    // Linked to another SplitTab user
    throw new AppError(
      "This provider account is already linked to another user",
      409,
    );
  }

  // Link provider account to the existing SplitTab user
  await Account.create({
    userId,
    provider,
    providerAccountId,
  });

  return {
    success: true,
    message: `${provider} account linked successfully`,
  };
}

export { linkOAuthAccount };
