/**
 * Session Management
 * Enterprise-grade secure session handling for authenticated users
 *
 * Features:
 * - HttpOnly, Secure, SameSite cookies for XSS/CSRF protection
 * - JWT tokens with expiration
 * - Session refresh mechanism
 * - Redis-backed session store
 * - Secure token generation
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { jwtVerify, SignJWT } from "jose";

import { redis } from "@/lib/services/redis";

/**
 * JWT secret key
 * In production, should be in environment variable (minimum 32 bytes)
 */
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is not set. Please set a secure, random secret of at least 32 bytes."
  );
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Session data stored in JWT and Redis
 */
export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: "employer" | "job_seeker" | "admin";
  verified: boolean;
  type?: "access" | "refresh";
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Generate access token (short-lived)
 * Used for API authentication
 */
export async function generateAccessToken(sessionData: SessionData): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 24 * 60 * 60; // 1 day in seconds

  const token = await new SignJWT({ ...sessionData, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Generate refresh token (long-lived)
 * Used to obtain new access tokens without re-authentication
 */
export async function generateRefreshToken(sessionData: SessionData): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

  const token = await new SignJWT({ userId: sessionData.userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as SessionData;
  } catch {
    return null;
  }
}

/**
 * Store session in Redis for server-side validation
 * Provides ability to invalidate sessions server-side
 * Also stores hash of refresh token for revocation tracking
 *
 * SECURITY: Only the tokenHash is stored, never the plaintext refresh token.
 * The refresh token itself remains secure in the HttpOnly cookie only.
 */
export async function storeSession(sessionData: SessionData, refreshToken: string): Promise<void> {
  const sessionKey = `session:${sessionData.userId}`;
  const expirySeconds = 7 * 24 * 60 * 60; // 7 days
  // Create a hash of the refresh token for revocation tracking
  // Never store the plaintext token in Redis - only the hash is stored
  const tokenHash = await hashToken(refreshToken);

  // Store session data in Redis with expiry
  // NOTE: refreshToken is NOT stored here - only its hash is stored for revocation tracking
  await redis.setex(
    sessionKey,
    expirySeconds,
    JSON.stringify({
      ...sessionData,
      tokenHash, // Store only the hash for revocation validation
      createdAt: new Date().toISOString(),
    })
  );
}

/**
 * Retrieve session from Redis
 */
export async function getSession(userId: string): Promise<SessionData | null> {
  const sessionKey = `session:${userId}`;
  const sessionData = await redis.get(sessionKey);

  if (!sessionData) {
    return null;
  }

  return JSON.parse(sessionData as string) as SessionData;
}

/**
 * Hash a refresh token for secure storage and comparison
 * Uses SHA-256 to avoid storing tokens in plaintext
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Revoke a refresh token by adding it to a blacklist
 * Old tokens are invalidated immediately after rotation
 */
async function revokeRefreshToken(userId: string, tokenHash: string): Promise<void> {
  const revokedKey = `revoked:${userId}:${tokenHash}`;
  const expirySeconds = 7 * 24 * 60 * 60; // 7 days (match refresh token expiry)

  // Add to revocation list with expiry matching the token's original lifespan
  await redis.setex(revokedKey, expirySeconds, "true");
}

/**
 * Check if a refresh token has been revoked
 * Returns true if token is in revocation list
 */
async function isTokenRevoked(userId: string, tokenHash: string): Promise<boolean> {
  const revokedKey = `revoked:${userId}:${tokenHash}`;
  const exists = await redis.get(revokedKey);
  return exists !== null;
}

/**
 * Validate refresh token against stored session state
 * Detects token mismatch (reuse attack) and revocation
 * Returns true if token is valid and not revoked
 * Invalidates session if attack is detected
 */
async function validateRefreshToken(userId: string, currentToken: string, storedTokenHash: string): Promise<boolean> {
  // Hash the current refresh token to verify it matches the stored hash
  const currentTokenHash = await hashToken(currentToken);

  // Verify the provided token matches the stored token
  if (currentTokenHash !== storedTokenHash) {
    // Token mismatch - this is not the current valid token (reuse attack)
    console.warn(
      `[SECURITY] Token mismatch detected for user ${userId}. Possible token reuse attack. Session invalidated.`
    );
    await invalidateSession(userId);
    return false;
  }

  // Check if this valid current token has been revoked
  const isRevoked = await isTokenRevoked(userId, storedTokenHash);
  if (isRevoked) {
    // Token reuse detected - invalidate entire session immediately
    console.warn(`[SECURITY] Token reuse detected for user ${userId}. Session invalidated.`);
    await invalidateSession(userId);
    return false;
  }

  return true;
}

/**
 * Create secure HTTP-only cookies for access and refresh tokens
 */
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const forceSecure = process.env.FORCE_SECURE_COOKIES === "true";
  const secure = isProduction || forceSecure;

  // Access token cookie (1 day)
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true, // Prevents XSS attacks (not accessible via JavaScript)
    secure, // Only sent over HTTPS in production or with FORCE_SECURE_COOKIES
    sameSite: "strict", // CSRF protection
    maxAge: 24 * 60 * 60, // 1 day
    path: "/",
  });

  // Refresh token cookie (7 days)
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

/**
 * Get current session from cookies
 * Returns null if no valid session found
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return null;
    }

    const sessionData = await verifyToken(accessToken);
    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Require authentication
 * Use in server components or middleware to enforce authentication
 * Redirects to sign-in if no valid session
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

/**
 * Refresh access token using refresh token
 * Call this when access token expires
 * Implements refresh token rotation with revocation for enhanced security
 * Detects and prevents token reuse attacks
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const oldRefreshToken = cookieStore.get("refreshToken")?.value;

    if (!oldRefreshToken) {
      return null;
    }

    const sessionData = await verifyToken(oldRefreshToken);
    if (!sessionData || sessionData.type !== "refresh") {
      return null;
    }

    // Retrieve full session data from Redis
    const fullSessionData = await getSession(sessionData.userId);
    if (!fullSessionData) {
      return null;
    }

    // Validate refresh token (checks for mismatch and revocation)
    const storedTokenHash = (fullSessionData as unknown as { tokenHash?: string }).tokenHash;
    if (!storedTokenHash) {
      return null;
    }

    // Check if token is valid and not revoked
    const isTokenValid = await validateRefreshToken(sessionData.userId, oldRefreshToken, storedTokenHash);
    if (!isTokenValid) {
      return null;
    }

    // BEFORE issuing new tokens, revoke the old refresh token
    // This prevents the compromised token from being used again
    if (storedTokenHash) {
      await revokeRefreshToken(sessionData.userId, storedTokenHash);
    }

    // Generate new access token
    const newAccessToken = await generateAccessToken(fullSessionData);

    // Generate NEW refresh token (rotation) - enhanced security
    const newRefreshToken = await generateRefreshToken(fullSessionData);

    // Update session with new refresh token hash
    await storeSession(fullSessionData, newRefreshToken);

    // Update both cookies
    const newCookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";
    const forceSecure = process.env.FORCE_SECURE_COOKIES === "true";
    const secure = isProduction || forceSecure;

    newCookieStore.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 1 day
      path: "/",
    });

    // Set rotated refresh token
    newCookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return newAccessToken;
  } catch {
    return null;
  }
}

/**
 * Invalidate session (logout)
 */
export async function invalidateSession(userId: string): Promise<void> {
  const sessionKey = `session:${userId}`;
  await redis.del(sessionKey);
  await clearAuthCookies();
}
