import { TRPCError } from "@trpc/server";

import { authService } from "@/features/auth/services/auth.service";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { authValidators } from "@/validators";

export const authRouter = createTRPCRouter({
  /**
   * Signup new user endpoint
   */
  signup: baseProcedure.input(authValidators.signup).mutation(async ({ input }) => {
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
});
