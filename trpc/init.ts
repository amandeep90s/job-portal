import { cache } from "react";

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { prisma } from "@/lib/prisma";
import { authRatelimit, createAuthRateLimitKey, signInRatelimit } from "@/lib/services/auth-ratelimit";
import { ratelimit } from "@/lib/services/ratelimit";
import { generateRateLimitIdentifier } from "@/lib/utils/ip-extractor";

export const createTRPCContext = cache(async () => {
  const userId = "user_123";
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>> & {
  req?: Request;
  headers?: Headers;
  clientIP?: string;
};

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

export const createCallerFactory = t.createCallerFactory;

export const baseProcedure = t.procedure;

// Base router and procedure helpers
export const createTRPCRouter = t.router;

// Protected procedure (requires authentication)
export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
  const { ctx } = opts;
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User is not authenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, email: true, name: true, role: true, verified: true },
  });
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  }

  const { success } = await ratelimit.limit(user.id);
  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" });
  }

  return opts.next({ ctx: { ...ctx, user } });
});

// Auth rate limited procedure (for auth routes: signup, login, verify email, etc.)
// Allows 10 requests per 1 minute per identifier (IP + email combination)
// Uses secure IP extraction to prevent header spoofing attacks
export const authRateLimitedProcedure = t.procedure.use(async function authRateLimit(opts) {
  const { input, ctx } = opts;

  /**
   * Extract identifiers from request for rate limiting
   * - IP address: Extracted securely from context (trusted proxy aware)
   * - Email: From input for most auth operations
   * - Fallback: "unknown" if IP cannot be determined
   *
   * Security: Uses secure IP extraction that validates proxy headers
   * to prevent header spoofing attacks
   */

  const ipAddress = ctx.clientIP || "unknown";

  // Get email from input if available
  let email = "";
  if (input && typeof input === "object" && "email" in input) {
    email = (input as { email: string }).email.toLowerCase();
  }

  // Generate secure rate limit key
  const rateLimitKey = generateRateLimitIdentifier(ipAddress, email);

  const { success, reset } = await authRatelimit.limit(rateLimitKey);

  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many auth attempts. Please try again after ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
    });
  }

  return opts.next(opts);
});

/**
 * Sign-in rate limited procedure
 * 10 requests per 1 minute per identifier (IP + email combination)
 * Specifically designed to prevent brute force attacks on login
 * Uses IP + email combination for better abuse tracking
 */
export const signInRateLimitedProcedure = t.procedure.use(async function signInRateLimit(opts) {
  const { input, ctx } = opts;

  const ipAddress = ctx.clientIP || "unknown";

  // Get email from input
  let email = "";
  if (input && typeof input === "object" && "email" in input) {
    email = (input as { email: string }).email.toLowerCase();
  }

  // Create operation-specific rate limit key for sign-in
  const rateLimitKey = createAuthRateLimitKey("signin", ipAddress, email);

  const { success, reset } = await signInRatelimit.limit(rateLimitKey);

  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many sign-in attempts. Please try again after ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
    });
  }

  return opts.next(opts);
});

/**
 * Verified protected procedure
 * Extends protectedProcedure with additional verification check
 * Only allows authenticated and verified users
 * Redirects unverified users to email verification page
 *
 * Use this for routes that require full account verification
 * Examples: posting jobs, applying to jobs, viewing analytics
 */
export const verifiedProtectedProcedure = t.procedure.use(async function verifiedAuth(opts) {
  const { ctx } = opts;
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User is not authenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, email: true, name: true, role: true, verified: true, status: true },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  }

  // Check if user is verified
  if (!user.verified) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Email verification required. Please verify your email to access this feature.",
      cause: "UNVERIFIED_EMAIL",
    });
  }

  // Check user status
  if (user.status !== "active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your account is currently ${user.status}. Please contact support.`,
    });
  }

  const { success } = await ratelimit.limit(user.id);
  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" });
  }

  return opts.next({ ctx: { ...ctx, user } });
});
