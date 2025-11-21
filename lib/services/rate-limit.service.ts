import { TRPCError } from "@trpc/server";

import { redis } from "@/lib/services/redis.service";

export interface RateLimitConfig {
  max: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
  identifier: string; // Unique identifier for the client (e.g., IP address or user ID)
  message?: string; // Optional custom error message
}

export class RateLimitError extends TRPCError {
  constructor(message: string = "Rate limit exceeded") {
    super({ code: "TOO_MANY_REQUESTS", message });
  }
}

export async function checkRateLimit(config: RateLimitConfig): Promise<void> {
  const { max, windowMs, identifier, message } = config;
  const key = `rate-limit:${identifier}`;

  try {
    const current = await redis.incr(key);

    // Set expiration if this is the first request in the window
    if (current === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    if (current > max) {
      throw new RateLimitError(message);
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    // If Redis is down, log but don't block requests
    console.error("Rate limit error:", error);
  }
}

// Pre-configured rate limiters
export const RateLimitPresets = {
  // Authentication endpoints
  AUTH: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many authentication attempts, please try again later.",
  },

  // General API endpoints
  API: {
    max: 100,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests. Please slow down.",
  },

  // File uploads
  UPLOAD: {
    max: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: "Too many uploads. Please wait before uploading more files.",
  },

  // Contact forms
  CONTACT: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many contact form submissions. Please try again later.",
  },
} as const;
