import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { register, login, logout } from "./auth.service.js";
import db from "../../prisma/db.ts";
import redis from "../../config/redis.js";

const { User } = db.orm.public;

describe("Auth Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Registration
  it("should hash password and register a user", async () => {
    bcrypt.hash = vi.fn().mockResolvedValue("hashed_password");

    User.create = vi.fn().mockResolvedValue({
      id: 1,
      username: "testuser",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "hashed_password",
    });

    redis.set = vi.fn().mockResolvedValue("OK");

    const sessionToken = await register({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

    expect(User.create).toHaveBeenCalledWith({
      username: "testuser",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "hashed_password",
    });

    expect(sessionToken).toMatch(/^[a-f0-9]{64}$/);

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^session:/),
      "1",
      "EX",
      604800
    );
  });

  // 2. Login with email
  it("should login user with valid email and password", async () => {
    const user = {
      id: 1,
      email: "test@example.com",
      username: "testuser",
      passwordHash: "hashed_password",
    };

    User.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(user),
    });

    bcrypt.compare = vi.fn().mockResolvedValue(true);

    redis.set = vi.fn().mockResolvedValue("OK");

    const sessionToken = await login({
      identifier: "test@example.com",
      password: "password123",
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "hashed_password"
    );

    expect(sessionToken).toMatch(/^[a-f0-9]{64}$/);

    expect(redis.set).toHaveBeenCalled();
  });

  // 3. Login with username
  it("should login user with username", async () => {
    const user = {
      id: 1,
      username: "testuser",
      passwordHash: "hashed_password",
    };

    User.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(user),
    });

    bcrypt.compare = vi.fn().mockResolvedValue(true);

    redis.set = vi.fn().mockResolvedValue("OK");

    const sessionToken = await login({
      identifier: "testuser",
      password: "password123",
    });

    expect(sessionToken).toMatch(/^[a-f0-9]{64}$/);
  });

  // 4. User not found
  it("should reject login if user does not exist", async () => {
    User.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    });

    await expect(
      login({
        identifier: "unknown@example.com",
        password: "password123",
      })
    ).rejects.toThrow("User Not Found");
  });

  // 5. Incorrect password
  it("should reject login with incorrect password", async () => {
    const user = {
      id: 1,
      passwordHash: "hashed_password",
    };

    User.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(user),
    });

    bcrypt.compare = vi.fn().mockResolvedValue(false);

    await expect(
      login({
        identifier: "testuser",
        password: "wrongpassword",
      })
    ).rejects.toThrow("Wrong Password");

    expect(redis.set).not.toHaveBeenCalled();
  });

  // 6. Logout
  it("should delete the user's Redis session during logout", async () => {
    redis.del = vi.fn().mockResolvedValue(1);

    const sessionToken = "test-session-token";

    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    await logout(sessionToken);

    expect(redis.del).toHaveBeenCalledWith(
      `session:${tokenHash}`
    );
  });
});