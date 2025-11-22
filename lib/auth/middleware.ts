/**
 * Authentication Middleware
 * Integrates session management with TRPC context
 * Validates tokens and enriches context with user data
 */

import type { NextRequest } from "next/server";

import { TRPCError } from "@trpc/server";

import { getCurrentSession, refreshAccessToken, verifyToken } from "@/lib/auth/session";

/**
 * Extract and validate token from request
 * Supports both Authorization header (Bearer token) and cookies
 *
 * @param req - NextRequest object containing headers and cookies
 * @returns Token string if found, null otherwise
 *
 * Note: This function is designed for API route handlers and edge middleware
 * where NextRequest is available. For TRPC procedures, use getCurrentSession()
 * which automatically handles cookie extraction from the async context.
 */
export async function extractAndValidateToken(req: NextRequest): Promise<string | null> {
  // Try Authorization header first (for API calls from client or external services)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Fall back to cookies (for browser-based requests)
  const accessToken = req.cookies.get("accessToken")?.value;
  return accessToken || null;
}

/**
 * Verify authentication and get user session
 * Attempts to verify provided token, or refresh if expired
 *
 * @param token - Optional JWT token to verify. If not provided or invalid,
 *                attempts to use refresh token to obtain new session
 * @returns Session data containing user information
 * @throws TRPCError with UNAUTHORIZED code if session cannot be verified or refreshed
 *
 * Usage in TRPC procedures:
 * const sessionData = await verifyAuthentication(token);
 */
export async function verifyAuthentication(token?: string) {
  let sessionData = null;

  if (token) {
    sessionData = await verifyToken(token);
  }

  // If no valid session, try to refresh using refresh token from cookies
  if (!sessionData) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      sessionData = await verifyToken(newAccessToken);
    }
  }

  if (!sessionData) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session. Please sign in again.",
    });
  }

  return sessionData;
}

/**
 * TRPC middleware for authentication
 * Add this to any TRPC procedure that requires authentication
 */
export function createAuthMiddleware() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async function authMiddleware(opts: any) {
    const { ctx } = opts;

    try {
      // Try to get session from current context
      const sessionData = await getCurrentSession();

      if (!sessionData) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }

      // Enrich context with user data
      return opts.next({
        ctx: {
          ...ctx,
          user: sessionData,
          userId: sessionData.userId,
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Authentication verification failed",
      });
    }
  };
}

/**
 * Validate user role
 * Use for role-based access control
 */
export function validateUserRole(allowedRoles: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async function roleValidationMiddleware(opts: any) {
    const { ctx } = opts;

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires one of these roles: ${allowedRoles.join(", ")}`,
      });
    }

    return opts.next(opts);
  };
}
