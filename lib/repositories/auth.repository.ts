import { prisma } from "@/lib/prisma";

// Authentication Repository
// Handles all auth-related database operations

export const authRepository = {
  /**
   * Create a new user account
   */
  createUser: async (data: {
    name: string;
    email: string;
    passwordHash: string;
    role: "admin" | "employer" | "job_seeker";
  }) => {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        status: "inactive",
        verified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
      },
    });
  },

  /**
   * Find user by email
   */
  findByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        passwordHash: true,
      },
    });
  },

  /**
   * Find user by ID
   */
  findById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        profileComplete: true,
      },
    });
  },

  /**
   * Check if email exists
   */
  emailExists: async (email: string) => {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return !!user;
  },

  /**
   * Update user verification status
   */
  updateVerificationStatus: async (userId: string, verified: boolean) => {
    return prisma.user.update({
      where: { id: userId },
      data: { verified },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
      },
    });
  },

  /**
   * Update user status
   */
  updateUserStatus: async (userId: string, status: "active" | "inactive" | "suspended" | "deactivated") => {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
  },

  /**
   * Update user password hash
   */
  updatePasswordHash: async (userId: string, passwordHash: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true, email: true },
    });
  },

  /**
   * Update user last login time
   */
  updateLastLogin: async (userId: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
      select: { id: true, lastLogin: true },
    });
  },
};
