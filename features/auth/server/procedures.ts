import { TRPCError } from "@trpc/server";

import { authService } from "@/features/auth/services/auth.service";
import { AccountDisabledError, AccountLockedError, AppError, OTPLockedError } from "@/lib/errors";
import {
  authRateLimitedProcedure,
  createTRPCRouter,
  protectedProcedure,
  signInRateLimitedProcedure,
} from "@/trpc/init";
import { authValidators } from "@/validators";

export const authRouter = createTRPCRouter({
  /**
   * Signup new user endpoint
   * Rate limited: 10 attempts per 1 minute
   */
  signup: authRateLimitedProcedure.input(authValidators.signup).mutation(async ({ input }) => {
    try {
      const result = await authService.signup(input);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: error.message === "Email is already registered" ? "CONFLICT" : "BAD_REQUEST",
          message: error.message,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during signup",
      });
    }
  }),

  /**
   * Verify user email endpoint
   * Rate limited: 10 attempts per 1 minute
   */
  verifyEmail: authRateLimitedProcedure.input(authValidators.verifyEmail).mutation(async ({ input }) => {
    try {
      const result = await authService.verifyEmail(input);
      return result;
    } catch (error) {
      if (error instanceof OTPLockedError) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: error.message,
        });
      }
      if (error instanceof Error) {
        throw new TRPCError({
          code: error.message.includes("Invalid or expired OTP") ? "BAD_REQUEST" : "NOT_FOUND",
          message: error.message,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during email verification",
      });
    }
  }),

  /**
   * Resend verification email endpoint
   * Rate limited: 10 attempts per 1 minute
   */
  resendVerificationEmail: authRateLimitedProcedure
    .input(authValidators.resendVerificationEmail)
    .mutation(async ({ input }) => {
      try {
        const result = await authService.resendVerificationEmail(input);
        return result;
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: error.message === "User not found" ? "NOT_FOUND" : "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while resending verification email",
        });
      }
    }),

  /**
   * Sign in user endpoint
   * Rate limited: 10 attempts per 1 minute (stricter than signup)
   * Allows unverified users to sign in but returns verification status
   * Designed to prevent brute force attacks
   */
  signIn: signInRateLimitedProcedure.input(authValidators.signIn).mutation(async ({ input }) => {
    try {
      const result = await authService.signIn(input);
      return result;
    } catch (error) {
      // Handle custom error types explicitly instead of string matching
      if (error instanceof AccountLockedError) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: error.message,
        });
      }
      if (error instanceof AccountDisabledError) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: error.message,
        });
      }
      if (error instanceof OTPLockedError) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: error.message,
        });
      }
      if (error instanceof AppError) {
        // Handle other app errors
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
      if (error instanceof Error) {
        // Generic error message for security (prevent email enumeration)
        if (error.message.includes("Invalid email or password")) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during sign in",
      });
    }
  }),

  /**
   * Logout user endpoint
   * Invalidates session and clears authentication cookies
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Import here to avoid circular dependency
      const { invalidateSession, clearAuthCookies } = await import("@/lib/auth/session");

      await invalidateSession(ctx.user.id);
      await clearAuthCookies();

      console.info(`[Auth] User ${ctx.user.email} logged out`);

      return {
        message: "Logged out successfully",
        success: true,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during logout",
      });
    }
  }),
});
