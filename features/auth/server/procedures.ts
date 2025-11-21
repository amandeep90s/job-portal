import { TRPCError } from "@trpc/server";

import { authService } from "@/features/auth/services/auth.service";
import { createTRPCRouter } from "@/trpc/init";
import { authRateLimited } from "@/trpc/middleware/rate-limit";
import { authValidators } from "@/validators";

export const authRouter = createTRPCRouter({
  /**
   * Signup new user endpoint
   */
  signup: authRateLimited.input(authValidators.signup).mutation(async ({ input }) => {
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
   */
  verifyEmail: authRateLimited.input(authValidators.verifyEmail).mutation(async ({ input }) => {
    try {
      const result = await authService.verifyEmail(input);
      return result;
    } catch (error) {
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
   */
  resendVerificationEmail: authRateLimited.input(authValidators.resendVerificationEmail).mutation(async ({ input }) => {
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
});
