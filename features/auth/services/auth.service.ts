import bcryptjs from "bcryptjs";

import { authRepository } from "@/lib/repositories/auth.repository";
import { SignUpInput } from "@/validators";

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

    return {
      message: "Account created successfully. Please verify your email",
      success: true,
      user,
    };
  },
};
