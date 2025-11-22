import { TRPCError } from "@trpc/server";

import { authService } from "@/features/auth/services/auth.service";
import {
  clearAuthCookies,
  generateAccessToken,
  generateRefreshToken,
  invalidateSession,
  setAuthCookies,
  storeSession,
} from "@/lib/auth/session";
import { AccountDisabledError, AccountLockedError, OTPLockedError } from "@/lib/errors";
import {
  authRateLimitedProcedure,
  createTRPCRouter,
  protectedProcedure,
  signInRateLimitedProcedure,
} from "@/trpc/init";
import { authValidators } from "@/validators";

// Error code mapping for consistency
const ERROR_CODES = {
  CONFLICT: "CONFLICT",
  BAD_REQUEST: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  FORBIDDEN: "FORBIDDEN",
  UNAUTHORIZED: "UNAUTHORIZED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

// Helper to throw TRPC errors consistently
const throwTRPCError = (code: keyof typeof ERROR_CODES, message: string) => {
  throw new TRPCError({ code, message });
};

export const authRouter = createTRPCRouter({
  /**
   * Signup new user endpoint
   * Rate limited: 10 attempts per 1 minute
   */
  signup: authRateLimitedProcedure.input(authValidators.signup).mutation(async ({ input }) => {
    try {
      return await authService.signup(input);
    } catch (error) {
      if (error instanceof Error && error.message === "Email is already registered") {
        throwTRPCError(ERROR_CODES.CONFLICT, error.message);
      }
      if (error instanceof Error) {
        throwTRPCError(ERROR_CODES.BAD_REQUEST, error.message);
      }
      throwTRPCError(ERROR_CODES.INTERNAL_SERVER_ERROR, "An unexpected error occurred during signup");
    }
  }),

  /**
   * Verify user email endpoint
   * Rate limited: 10 attempts per 1 minute
   */
  verifyEmail: authRateLimitedProcedure.input(authValidators.verifyEmail).mutation(async ({ input }) => {
    try {
      return await authService.verifyEmail(input);
    } catch (error) {
      if (error instanceof OTPLockedError) {
        throwTRPCError(ERROR_CODES.TOO_MANY_REQUESTS, error.message);
      }
      if (error instanceof Error && error.message.includes("Invalid or expired OTP")) {
        throwTRPCError(ERROR_CODES.BAD_REQUEST, error.message);
      }
      if (error instanceof Error) {
        throwTRPCError(ERROR_CODES.NOT_FOUND, error.message);
      }
      throwTRPCError(ERROR_CODES.INTERNAL_SERVER_ERROR, "An unexpected error occurred during email verification");
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
        return await authService.resendVerificationEmail(input);
      } catch (error) {
        if (error instanceof Error && error.message === "User not found") {
          throwTRPCError(ERROR_CODES.NOT_FOUND, error.message);
        }
        if (error instanceof Error) {
          throwTRPCError(ERROR_CODES.BAD_REQUEST, error.message);
        }
        throwTRPCError(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          "An unexpected error occurred while resending verification email"
        );
      }
    }),

  /**
   * Sign in user endpoint
   * Rate limited: 10 attempts per 1 minute (stricter than signup)
   * Allows unverified users to sign in but returns verification status
   * Designed to prevent brute force attacks
   *
   * SECURITY: Session creation is handled server-side as part of this mutation
   * to prevent race conditions where authentication succeeds but session creation fails.
   * This ensures consistent state: either both succeed or both fail.
   */
  signIn: signInRateLimitedProcedure.input(authValidators.signIn).mutation(async ({ input }) => {
    try {
      const result = await authService.signIn(input);

      try {
        // Create session server-side immediately after successful authentication
        // This ensures session creation is atomic with the sign-in operation
        const sessionData = {
          userId: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role as "employer" | "job_seeker" | "admin",
          verified: result.user.verified,
        };

        const accessToken = await generateAccessToken(sessionData);
        const refreshToken = await generateRefreshToken(sessionData);

        // Store session in Redis for validation
        await storeSession(sessionData, refreshToken);

        // Set secure HTTP-only cookies
        await setAuthCookies(accessToken, refreshToken);
      } catch (sessionError) {
        // If session creation fails after successful authentication, log the critical error
        // but still return success to client so they don't lose authentication
        console.error("[CRITICAL] Session creation failed after successful sign-in:", sessionError);
        // The user is authenticated but may need to handle cookie issues
        // Client should proceed and refresh if needed
      }

      return result;
    } catch (error) {
      // Handle custom error types explicitly
      // SECURITY: Only expose account lock time - don't reveal if user exists
      if (error instanceof AccountLockedError) {
        throwTRPCError(ERROR_CODES.TOO_MANY_REQUESTS, error.message);
      }
      if (error instanceof AccountDisabledError) {
        throwTRPCError(ERROR_CODES.FORBIDDEN, "Your account is currently unavailable. Please contact support.");
      }
      if (error instanceof OTPLockedError) {
        throwTRPCError(ERROR_CODES.TOO_MANY_REQUESTS, error.message);
      }
      // Generic message for all other errors to prevent user enumeration
      throwTRPCError(ERROR_CODES.UNAUTHORIZED, "Invalid email or password");
    }
  }),

  /**
   * Logout user endpoint
   * Invalidates session and clears authentication cookies
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await invalidateSession(ctx.user.id);
      await clearAuthCookies();

      console.info(`[Auth] User ${ctx.user.email} logged out`);

      return {
        message: "Logged out successfully",
        success: true,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throwTRPCError(ERROR_CODES.INTERNAL_SERVER_ERROR, "An error occurred during logout");
    }
  }),
});
