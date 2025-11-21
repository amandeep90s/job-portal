import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/services/redis";

/**
 * Auth-specific rate limiters with different strategies for various operations
 *
 * Security Strategy:
 * - All auth routes: 10 requests per 1 minute to balance security and usability
 * - Uses sliding window algorithm for better accuracy and security
 * - Combines IP + email for better tracking of abuse patterns
 *
 * @see https://upstash.com/docs/redis/features/ratelimiting
 */

/**
 * Sign-in rate limiter
 * 10 requests per 1 minute (60 seconds)
 */
export const signInRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1m"),
  analytics: true,
});

/**
 * General auth rate limiter
 * Used for signup, email verification, and resend operations
 * 10 requests per 1 minute (60 seconds)
 */
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1m"),
  analytics: true,
});

/**
 * Create operation-specific rate limit key
 * Combines operation type, IP address, and email for better tracking
 *
 * @param operation - The auth operation (signin, signup, verify, resend)
 * @param ipAddress - User's IP address
 * @param email - User's email address
 * @returns Rate limit key string
 */
export const createAuthRateLimitKey = (
  operation: "signin" | "signup" | "verify" | "resend",
  ipAddress: string,
  email: string
): string => {
  return `auth:${operation}:${ipAddress}:${email}`;
};
