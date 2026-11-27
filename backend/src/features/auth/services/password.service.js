import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../../../prisma/db.ts";
import AppError from "../../../utils/AppError.js";

import { sendEmail } from "../../../services/email.service.js";
import { passwordResetTemplate } from "../../../services/email.templates.js";

import { and } from "@prisma/orm-postgres/orm-client";
import { invalidateUserSessions } from "./session.service.js";

import "temporal-polyfill/full/global";

const { User } = db.orm.public;

// CHANGE PASSWORD
async function changePassword(userId, { currentPassword, newPassword } = {}) {
  // Validate user ID
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AppError("Invalid user ID", 400);
  }

  // Validate password inputs
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  ) {
    throw new AppError("Both passwords are required", 400);
  }

  // Validate new password length
  if (newPassword.length < 8 || newPassword.length > 128) {
    throw new AppError(
      "Password must contain between 8 and 128 characters",
      400,
    );
  }

  // Fetch user
  const user = await User.where((u) => u.id.eq(userId)).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  // Prevent reusing current password
  if (currentPassword === newPassword) {
    throw new AppError("New password must differ from current password", 400);
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await User.where((u) => u.id.eq(userId)).update({
    passwordHash,
  });

  // Invalidate all existing sessions
  await invalidateUserSessions(userId);

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

  // Generate password reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Send password reset email
  await sendEmail({
    to: user.email,
    subject: "Reset Your SplitTab Password",
    html: passwordResetTemplate(resetLink),
  });

  return {
    success: true,
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

  // Invalidate all existing sessions
  await invalidateUserSessions(check.userId);

  return { success: true };
}

export { changePassword, forgetPassword, resetPassword };
