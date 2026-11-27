import db from "../../../prisma/db.ts";
import AppError from "../../../utils/AppError.js";

const { User } = db.orm.public;

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

export { updateProfile };
