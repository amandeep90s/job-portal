import bcryptjs from "bcryptjs";

import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { authRepository } from "@/lib/repositories/auth.repository";
import type { LoginInput, SignupInput } from "@/validators/auth.validators";

export const authService = {
  /**
   * Hash a password using bcryptjs
   */
  hashPassword: async (password: string): Promise<string> => {
    const saltRounds = 10;
    return bcryptjs.hash(password, saltRounds);
  },

  /**
   * Compare password with hash
   */
  verifyPassword: async (password: string, passwordHash: string): Promise<boolean> => {
    return bcryptjs.compare(password, passwordHash);
  },

  /**
   * Register a new user (signup)
   */
  signup: async (input: SignupInput) => {
    // Check if passwords match
    if (input.password !== input.confirmPassword) {
      throw new ValidationError("Passwords do not match");
    }

    // Check if email already exists
    const emailExists = await authRepository.emailExists(input.email);
    if (emailExists) {
      throw new ValidationError("Email is already registered");
    }

    // Hash password
    const passwordHash = await authService.hashPassword(input.password);

    // Create user
    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    return {
      success: true,
      user,
      message: "Account created successfully. Please verify your email.",
    };
  },

  /**
   * Login user
   */
  login: async (input: LoginInput) => {
    // Find user by email
    const user = await authRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    const passwordValid = await authService.verifyPassword(input.password, user.passwordHash || "");

    if (!passwordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Update last login
    await authRepository.updateLastLogin(user.id);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      success: true,
      user: userWithoutPassword,
      message: "Login successful",
    };
  },

  /**
   * Verify email token (placeholder)
   */
  verifyEmail: async (userId: string) => {
    const user = await authRepository.updateVerificationStatus(userId, true);

    return {
      success: true,
      user,
      message: "Email verified successfully",
    };
  },

  /**
   * Change user password
   */
  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    // Get user with password hash
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Get user with password hash for verification
    const userWithPassword = await authRepository.findByEmail(user.email);

    if (!userWithPassword?.passwordHash) {
      throw new UnauthorizedError("User has no password set");
    }

    // Verify current password
    const passwordValid = await authService.verifyPassword(currentPassword, userWithPassword.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await authService.hashPassword(newPassword);

    // Update password
    const updatedUser = await authRepository.updatePasswordHash(userId, newPasswordHash);

    return {
      success: true,
      user: updatedUser,
      message: "Password changed successfully",
    };
  },
};
