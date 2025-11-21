import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/services/redis";

/**
 * Auth-specific rate limiter
 * Allows maximum 5 requests per 15 minutes (900 seconds)
 * Uses sliding window algorithm for better rate limiting accuracy
 */
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15m"),
  analytics: true,
});
