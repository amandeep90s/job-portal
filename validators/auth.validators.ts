import { z } from "zod";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength validation - at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.{8,})/;

export const authValidators = {
  // Signup/Register validation
  signup: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .trim(),
    email: z
      .string()
      .email("Invalid email address")
      .min(5, "Email must be at least 5 characters")
      .max(255, "Email must not exceed 255 characters")
      .toLowerCase()
      .refine((email) => EMAIL_REGEX.test(email), "Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, and numeric characters"),
    confirmPassword: z.string(),
    role: z.enum(["employer", "job_seeker"]).catch("job_seeker"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  }),

  // Login validation
  login: z.object({
    email: z.string().email("Invalid email address").min(5, "Email must be at least 5 characters").toLowerCase(),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional().default(false),
  }),

  // Password reset request validation
  resetPasswordRequest: z.object({
    email: z.string().email("Invalid email address").min(5, "Email must be at least 5 characters").toLowerCase(),
  }),

  // Password reset validation
  resetPassword: z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, and numeric characters"),
    confirmPassword: z.string(),
  }),

  // Email verification validation
  verifyEmail: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),

  // Change password validation
  changePassword: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, and numeric characters"),
    confirmPassword: z.string(),
  }),
};

// Derived types from validators
export type SignupInput = z.infer<typeof authValidators.signup>;
export type LoginInput = z.infer<typeof authValidators.login>;
export type ResetPasswordRequestInput = z.infer<typeof authValidators.resetPasswordRequest>;
export type ResetPasswordInput = z.infer<typeof authValidators.resetPassword>;
export type VerifyEmailInput = z.infer<typeof authValidators.verifyEmail>;
export type ChangePasswordInput = z.infer<typeof authValidators.changePassword>;
