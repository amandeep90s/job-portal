import { z } from "zod";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      email: z
        .email()
        .max(50, "Email must not exceed 50 characters")
        .toLowerCase()
        .refine((email) => EMAIL_REGEX.test(email), "Invalid email format"),
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
};

// Derived types from validators
export type SignUpInput = z.infer<typeof authValidators.signup>;
