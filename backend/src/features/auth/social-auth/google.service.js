import { OAuth2Client } from "google-auth-library";
import AppError from "../../../utils/AppError.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new AppError("Google ID token is required", 400);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  try {
    // Verify token signature, issuer, audience and expiration.
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError("Invalid Google ID token", 401);
    }

    // Google email must be verified.
    if (payload.email_verified !== true) {
      throw new AppError("Google email is not verified", 401);
    }

    if (!payload.sub || !payload.email) {
      throw new AppError("Google account information is incomplete", 401);
    }

    return {
      provider: "google",
      providerAccountId: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: payload.email_verified,
      name: payload.name || null,
      picture: payload.picture || null,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Google authentication failed", 401);
  }
}

export { verifyGoogleToken };
