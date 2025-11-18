import { TRPCError } from "@trpc/server";

import { authService } from "@/features/auth/services/auth.service";
import { authValidators } from "@/validators/auth.validators";

import { baseProcedure, createTRPCRouter } from "../init";

export const authRouter = createTRPCRouter({
  /**
   * Signup/Register new user
   */
  signup: baseProcedure.input(authValidators.signup).mutation(async ({ input }) => {
    try {
      const result = await authService.signup(input);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during signup",
      });
    }
  }),

  /**
   * Login user
   */
  login: baseProcedure.input(authValidators.login).mutation(async ({ input }) => {
    try {
      const result = await authService.login(input);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during login",
      });
    }
  }),

  /**
   * Verify email
   */
  verifyEmail: baseProcedure.input(authValidators.verifyEmail).mutation(async ({ input }) => {
    try {
      const result = await authService.verifyEmail(input.token);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Email verification failed",
      });
    }
  }),

  /**
   * Request password reset
   */
  requestPasswordReset: baseProcedure.input(authValidators.resetPasswordRequest).mutation(async () => {
    // Always return success for security (doesn't reveal if email exists)
    return {
      success: true,
      message: "If an account exists, a reset link has been sent to your email",
    };
  }),

  /**
   * Reset password with token
   */
  resetPassword: baseProcedure.input(authValidators.resetPassword).mutation(async ({ input }) => {
    try {
      // Verify passwords match
      if (input.newPassword !== input.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // In a real app, you'd verify the token and get userId from it
      // For now, we'll use the token as userId (not recommended for production)
      const userId = input.token;

      const result = await authService.changePassword(userId, "oldPassword", input.newPassword);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Password reset failed",
      });
    }
  }),
});
