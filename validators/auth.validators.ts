import { z } from "zod";

// Password strength validation - at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const authValidators = {
  // User signup validation
  signup: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters")
        .trim(),
      email: z.email().max(50, "Email must not exceed 50 characters").toLowerCase(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must not exceed 128 characters")
        .regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, and numeric characters"),
      confirmPassword: z
        .string()
        .min(8, "Confirm Password must be at least 8 characters")
        .max(128, "Confirm Password must not exceed 128 characters"),
      role: z.enum(["employer", "job_seeker"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),

  // Email verification validation
  verifyEmail: z.object({
    email: z.email().max(50, "Email must not exceed 50 characters").toLowerCase(),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only digits"),
  }),

  // Resend verification email validation
  resendVerificationEmail: z.object({
    email: z.email().max(50, "Email must not exceed 50 characters").toLowerCase(),
  }),

  // User sign in validation
  signIn: z.object({
    email: z.email().max(50, "Email must not exceed 50 characters").toLowerCase(),
    password: z.string().min(1, "Password is required").max(128, "Password must not exceed 128 characters"),
  }),
};

// Derived types from validators
export type SignUpInput = z.infer<typeof authValidators.signup>;
export type VerifyEmailInput = z.infer<typeof authValidators.verifyEmail>;
export type ResendVerificationEmailInput = z.infer<typeof authValidators.resendVerificationEmail>;
export type SignInInput = z.infer<typeof authValidators.signIn>;
