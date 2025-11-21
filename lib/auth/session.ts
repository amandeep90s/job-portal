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
 */
export async function storeSession(sessionData: SessionData, refreshToken: string): Promise<void> {
  const sessionKey = `session:${sessionData.userId}`;
  const expirySeconds = 7 * 24 * 60 * 60; // 7 days

  // Store session data in Redis with expiry
  await redis.setex(
    sessionKey,
    expirySeconds,
    JSON.stringify({
      ...sessionData,
      refreshToken,
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
 * Implements refresh token rotation for enhanced security
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return null;
    }

    const sessionData = await verifyToken(refreshToken);
    if (!sessionData || sessionData.type !== "refresh") {
      return null;
    }

    // Retrieve full session data from Redis
    const fullSessionData = await getSession(sessionData.userId);
    if (!fullSessionData) {
      return null;
    }

    // Generate new access token
    const newAccessToken = await generateAccessToken(fullSessionData);

    // Generate NEW refresh token (rotation) - enhanced security
    const newRefreshToken = await generateRefreshToken(fullSessionData);

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
