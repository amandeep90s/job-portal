import { TRPCError } from "@trpc/server";

import { authService } from "@/features/auth/services/auth.service";
import { authRateLimitedProcedure, createTRPCRouter } from "@/trpc/init";
import { authValidators } from "@/validators";

export const authRouter = createTRPCRouter({
  /**
   * Signup new user endpoint
   * Rate limited: 5 attempts per 15 minutes
   */
  signup: authRateLimitedProcedure.input(authValidators.signUp).mutation(async ({ input }) => {
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
   * Rate limited: 5 attempts per 15 minutes
   */
  verifyEmail: authRateLimitedProcedure.input(authValidators.verifyEmail).mutation(async ({ input }) => {
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
   * Rate limited: 5 attempts per 15 minutes
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
});
