import { randomInt } from "crypto";

import bcryptjs from "bcryptjs";

import { authRepository } from "@/lib/repositories/auth.repository";
import { emailService } from "@/lib/services/email.service";
import { ResendVerificationEmailInput, SignUpInput, VerifyEmailInput } from "@/validators";

export const authService = {
  /**
   * Hash a password using bcryptjs
   */
  hashPassword: async (password: string): Promise<string> => {
    const saltRounds = 10;
    return bcryptjs.hash(password, saltRounds);
  },

  /**
   * Compare a plain password with a hashed password
   */
  comparePassword: async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcryptjs.compare(password, hashedPassword);
  },

  /**
   * Generate a 6-digit OTP code
   */
  generateVerificationOTP: (): string => {
    return randomInt(100000, 1000000).toString();
  },

  /**
   * Register a new user
   */
  signup: async (input: SignUpInput) => {
    // Check if email already exists
    const emailExists = await authRepository.emailExists(input.email);
    if (emailExists) {
      throw new Error("Email is already registered");
    }

    // Hash the password
    const passwordHash = await authService.hashPassword(input.password);

    // Create user
    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    // Generate verification OTP
    const otp = authService.generateVerificationOTP();
    await authRepository.createVerificationOTP(user.email, otp);

    // Send verification email
    try {
      await emailService.sendVerificationEmail({ email: user.email, username: user.name, otp });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Don't fail signup if email fails, but log it
      // In production, you might want to handle this differently
    }

    return {
      message: "Account created successfully. Please verify your email",
      success: true,
      user,
    };
  },

  /**
   * Verify user email with OTP
   */
  verifyEmail: async (input: VerifyEmailInput) => {
    // Find the verification OTP record
    const otp = await authRepository.findVerificationOTP(input.email, input.otp);
    if (!otp) {
      throw new Error("Invalid or expired OTP");
    }

    // Check if user exists
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user verification status
    const updatedUser = await authRepository.updateVerificationStatus(user.id, true);

    // Delete used OTP(s)
    await authRepository.deleteVerificationOTPsByEmail(input.email);

    return {
      message: "Email verified successfully",
      success: true,
      user: updatedUser,
    };
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: async (input: ResendVerificationEmailInput) => {
    // Check if user exists
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already verified
    if (user.verified) {
      throw new Error("Email is already verified");
    }

    // Delete old OTPs
    await authRepository.deleteVerificationOTPsByEmail(input.email);

    // Generate new verification OTP
    const otp = authService.generateVerificationOTP();
    await authRepository.createVerificationOTP(user.email, otp);

    // Send verification email
    try {
      await emailService.sendVerificationEmail({
        email: user.email,
        username: user.name,
        otp,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new Error("Failed to send verification email. Please try again later.");
    }

    return {
      message: "Verification email sent successfully",
      success: true,
    };
  },
};
