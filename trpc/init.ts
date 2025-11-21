import { cache } from "react";

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { prisma } from "@/lib/prisma";
import { authRatelimit } from "@/lib/services/auth-ratelimit";
import { ratelimit } from "@/lib/services/ratelimit";

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
// Allows 5 requests per 15 minutes per identifier (IP + email combination)
export const authRateLimitedProcedure = t.procedure.use(async function authRateLimit(opts) {
  const { input, ctx } = opts;

  /**
   * Extract identifiers from request for rate limiting
   * Priority order:
   * 1. IP address (primary identifier for unauthenticated requests)
   * 2. Email from input (for most auth operations)
   * 3. userId (fallback for authenticated requests)
   * 4. "anonymous" (last resort)
   */

  // Get IP address from headers
  let ipAddress = "unknown";
  if (ctx.headers) {
    // Check various headers that might contain IP address
    ipAddress =
      (ctx.headers.get("x-forwarded-for")?.split(",")[0].trim() as string) ||
      (ctx.headers.get("x-real-ip") as string) ||
      (ctx.headers.get("cf-connecting-ip") as string) ||
      (ctx.headers.get("x-client-ip") as string) ||
      "unknown";
  }

  // Get email from input if available
  let email = "";
  if (input && typeof input === "object" && "email" in input) {
    email = (input as { email: string }).email.toLowerCase();
  }

  // Build identifier: combination of IP and email (or just IP if no email)
  const identifier = email ? `${ipAddress}:${email}` : ipAddress;
  const rateLimitKey = `auth:${identifier}`;

  const { success, reset } = await authRatelimit.limit(rateLimitKey);

  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many auth attempts. Please try again after ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
    });
  }

  return opts.next(opts);
});
