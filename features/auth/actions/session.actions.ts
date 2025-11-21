/**
 * Authentication Server Actions
 * Handles server-side session creation after successful sign-in
 * Uses Server Components for secure token generation
 */

"use server";

import type { SessionData } from "@/lib/auth/session";
import { generateAccessToken, generateRefreshToken, setAuthCookies, storeSession } from "@/lib/auth/session";

/**
 * Create secure session after successful sign-in
 * Called from client-side after TRPC sign-in mutation succeeds
 *
 * This is a Server Action that:
 * 1. Generates JWT tokens (access + refresh)
 * 2. Stores session in Redis for validation
 * 3. Sets secure HTTP-only cookies
 * 4. Returns confirmation to client
 */
export async function createSessionAfterSignIn(user: SessionData) {
  try {
    // Generate tokens
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Store session in Redis
    await storeSession(user, refreshToken);

    // Set secure HTTP-only cookies
    await setAuthCookies(accessToken, refreshToken);

    return {
      success: true,
      message: "Session created successfully",
    };
  } catch (error) {
    console.error("Failed to create session:", error);
    return {
      success: false,
      message: "Failed to create secure session",
    };
  }
}

/**
 * Clear session on logout
 */
export async function clearSessionOnLogout(userId: string) {
  try {
    const { invalidateSession } = await import("@/lib/auth/session");
    await invalidateSession(userId);

    return {
      success: true,
      message: "Session cleared successfully",
    };
  } catch (error) {
    console.error("Failed to clear session:", error);
    return {
      success: false,
      message: "Failed to clear session",
    };
  }
}
