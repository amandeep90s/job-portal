import { checkRateLimit, RateLimitPresets } from "@/lib/services/rate-limit.service";
import { baseProcedure, middleware } from "@/trpc/init";

// Generic rate limiting middleware
export const rateLimitMiddleware = (config: { max: number; windowMs: number; message?: string }) => {
  return middleware(async ({ ctx, next }) => {
    // Use IP address as base identifier
    const identifier = `ip:${ctx.ip}`;

    // TODO: If you have user authentication, you can use user ID instead
    // if (ctx.user?.id) {
    //   identifier = `user:${ctx.user.id}`;
    // }

    await checkRateLimit({
      ...config,
      identifier: `${identifier}:${config.windowMs}:${config.max}`,
    });

    return next();
  });
};

// Pre-configured rate limited resources
export const authRateLimited = baseProcedure.use(rateLimitMiddleware(RateLimitPresets.AUTH));

export const apiRateLimited = baseProcedure.use(rateLimitMiddleware(RateLimitPresets.API));

export const uploadRateLimited = baseProcedure.use(rateLimitMiddleware(RateLimitPresets.UPLOAD));

export const contactRateLimited = baseProcedure.use(rateLimitMiddleware(RateLimitPresets.CONTACT));

// Custom rate limited procedure factory
export const createRateLimitedProcedure = (max: number, windowMs: number, message?: string) =>
  baseProcedure.use(rateLimitMiddleware({ max, windowMs, message }));
