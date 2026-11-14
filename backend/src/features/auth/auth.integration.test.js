import { describe, it, expect } from "vitest";
import crypto from "crypto";

import { register, login, logout } from "./auth.service.js";
import redis from "../../config/redis.js";

describe("Auth Integration Tests", () => {

  // Generate unique user details for every test run
  const uniqueId = crypto.randomUUID();

  const testUser = {
    username: `test_${uniqueId}`,
    email: `test_${uniqueId}@example.com`,
    password: "Password123!",
    name: "Integration Test User",
  };

  let sessionToken;

  // 1. Registration
  it("should register a user and create a Redis session", async () => {
    sessionToken = await register(testUser);

    expect(sessionToken).toBeDefined();
    expect(sessionToken).toMatch(/^[a-f0-9]{64}$/);

    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const storedUserId = await redis.get(`session:${tokenHash}`);

    expect(storedUserId).toBeDefined();
  });

  // 2. Login
  it("should login using registered email and password", async () => {
    const token = await login({
      identifier: testUser.email,
      password: testUser.password,
    });

    expect(token).toBeDefined();
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const storedUserId = await redis.get(`session:${tokenHash}`);

    expect(storedUserId).toBeDefined();

    // Clean up login session
    await logout(token);
  });

  // 3. Login using username
  it("should login using registered username", async () => {
    const token = await login({
      identifier: testUser.username,
      password: testUser.password,
    });

    expect(token).toBeDefined();

    await logout(token);
  });

  // 4. Incorrect password
  it("should reject incorrect password", async () => {
    await expect(
      login({
        identifier: testUser.email,
        password: "WrongPassword123",
      })
    ).rejects.toThrow("Wrong Password");
  });

  // 5. Logout
  it("should remove the Redis session during logout", async () => {
    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    await logout(sessionToken);

    const storedSession = await redis.get(`session:${tokenHash}`);

    expect(storedSession).toBeNull();
  });
});