import { randomInt } from "crypto";

import bcryptjs from "bcryptjs";

import { AccountDisabledError, AccountLockedError, OTPLockedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { authRepository } from "@/lib/repositories/auth.repository";
import { emailService } from "@/lib/services/email";
import { UserStatus } from "@/types";
import { ResendVerificationEmailInput, SignInInput, SignUpInput, VerifyEmailInput } from "@/validators";

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
    const email = input.email.toLowerCase();

    // Check if OTP verification is locked due to too many failed attempts
    const isLocked = await authRepository.isOTPLocked(email);
    if (isLocked) {
      throw new OTPLockedError(15, "Too many failed OTP attempts. Please try again in 15 minutes.");
    }

    // Find the verification OTP record
    const otp = await authRepository.findVerificationOTP(email, input.otp);
    if (!otp) {
      // Get current attempt count from any token for this email
      const anyToken = await prisma.verificationToken.findFirst({
        where: { identifier: email },
        select: { attempts: true },
      });
      const currentAttempts = anyToken?.attempts ?? 0;
      const newAttempts = currentAttempts + 1;

      // Increment attempts for security logging
      await authRepository.incrementOTPAttempts(email);

      // Lock after 3 failed attempts
      if (newAttempts >= 3) {
        await authRepository.lockOTPVerification(email, 15 * 60 * 1000); // 15 minute lockout
        console.warn(`[SECURITY] OTP verification locked for ${email} after ${newAttempts} failed attempts`);
        throw new OTPLockedError(15, "Too many failed OTP attempts. Please try again in 15 minutes.");
      }

      // Log for debugging (don't expose to user)
      if (anyToken) {
        const tokenWithExpiry = await prisma.verificationToken.findFirst({
          where: { identifier: email },
          select: { expires: true },
        });
        if (tokenWithExpiry && tokenWithExpiry.expires < new Date()) {
          console.warn(`[SECURITY] Expired OTP attempt for ${email}`);
        } else {
          console.warn(`[SECURITY] Invalid OTP attempt for ${email}`);
        }
      }

      throw new Error("Invalid or expired OTP");
    }

    // Check if user exists
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user verification status
    const updatedUser = await authRepository.updateVerificationStatus(user.id, true);

    // Delete used OTP(s) and reset attempt counter
    await authRepository.deleteVerificationOTPsByEmail(email);

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

    // Check if user is already verified
    if (user && user.verified) {
      throw new Error("Email is already verified");
    }

    if (user) {
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
    } else {
      // User not found - log for security but don't reveal to client
      console.warn(`[SECURITY] Resend verification attempt for non-existent email: ${input.email}`);
    }

    // Always return success to prevent user enumeration
    return {
      message: "If an account exists with this email, verification email has been sent",
      success: true,
    };
  },

  /**
   * Sign in user with email and password
   * Validates credentials and returns user info without sensitive data
   * Allows unverified users to sign in but flags them for email verification
   * Updates last login timestamp on successful authentication
   * Implements account lockout after 5 failed attempts
   */
  signIn: async (input: SignInInput) => {
    const email = input.email.toLowerCase();

    // Find user by email
    const user = await authRepository.findByEmail(email);

    // Check if account is locked
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new AccountLockedError(minutesRemaining);
    }

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      throw new Error("Invalid email or password");
    }

    // Compare password
    const isPasswordValid = await authService.comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const updated = await authRepository.incrementFailedLoginAttempts(email);

      // Lock account after 5 failed attempts
      if (updated && updated.failedLoginAttempts >= 5) {
        await authRepository.lockAccount(user.id, 15 * 60 * 1000); // 15 minute lockout
        console.warn(`[SECURITY] Account locked for ${email} after 5 failed login attempts`);
        throw new AccountLockedError(15, "Account temporarily locked due to too many failed login attempts.");
      }

      throw new Error("Invalid email or password");
    }

    // Reset failed login attempts on successful login
    await authRepository.resetFailedLoginAttempts(user.id);

    // Check user status (only if verified)
    if (user.verified && user.status !== UserStatus.ACTIVE) {
      throw new AccountDisabledError(user.status);
    }

    // Update last login timestamp
    await authRepository.updateLastLogin(user.id);

    // Return response with verification status
    // Frontend will handle redirect to verify-email if not verified
    return {
      message: user.verified ? "Sign in successful" : "Please verify your email to access all features",
      success: true,
      verified: user.verified,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
      },
    };
  },
};
