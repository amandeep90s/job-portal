/**
 * Utility functions for accessing session and user data
 *
 * These functions extract user information from various sources:
 * - Server-side: From middleware headers or session tokens
 * - Client-side: From localStorage or cookies
 */

import { headers } from "next/headers";

export interface UserData {
  userId: string;
  email: string;
  verified: boolean;
  role: "employer" | "job_seeker" | "admin";
}

/**
 * Get user from middleware headers (server-side)
 * Returns user data if available in request headers
 *
 * Usage in Server Components:
 * ```typescript
 * const user = await getUserFromHeaders();
 * ```
 */
export async function getUserFromHeaders(): Promise<UserData | null> {
  try {
    const headersList = await headers();

    const userId = headersList.get("X-User-Id");
    const email = headersList.get("X-User-Email");
    const verified = headersList.get("X-User-Verified");
    const role = headersList.get("X-User-Role");

    if (!userId || !email || verified === null || !role) {
      return null;
    }

    return {
      userId,
      email,
      verified: verified === "true",
      role: role as "employer" | "job_seeker" | "admin",
    };
  } catch (error) {
    console.error("[getUserFromHeaders] Error:", error);
    return null;
  }
}

/**
 * Get user from localStorage (client-side)
 * Returns user data stored during sign-in
 *
 * Usage in Client Components:
 * ```typescript
 * const user = getUserFromStorage();
 * ```
 */
export function getUserFromStorage(): UserData | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const userJson = localStorage.getItem("user");
    if (!userJson) {
      return null;
    }

    const user = JSON.parse(userJson);
    return {
      userId: user.id,
      email: user.email,
      verified: user.verified,
      role: user.role,
    };
  } catch (error) {
    console.error("[getUserFromStorage] Error:", error);
    return null;
  }
}

/**
 * Check if current user is verified
 * Works on both server and client side
 */
export function isUserVerified(user: UserData | null): boolean {
  return user ? user.verified : false;
}

/**
 * Check if current user is employer
 */
export function isEmployer(user: UserData | null): boolean {
  return user ? user.role === "employer" : false;
}

/**
 * Check if current user is job seeker
 */
export function isJobSeeker(user: UserData | null): boolean {
  return user ? user.role === "job_seeker" : false;
}
