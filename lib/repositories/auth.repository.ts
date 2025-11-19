import { prisma } from "@/lib/prisma";
import { UserStatus } from "@/types";

export const authRepository = {
  /**
   * Create a new user account
   */
  createUser: async (data: { name: string; email: string; passwordHash: string; role: "employer" | "job_seeker" }) => {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
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
   * Find by user email
   */
  findByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        verified: true,
        status: true,
        createdAt: true,
      },
    });
  },

  /**
   * Check if email exists
   */
  emailExists: async (email: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return Boolean(user);
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
  updateUserStatus: async (userId: string, status: UserStatus) => {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
      },
    });
  },

  /**
   * Update user password
   */
  updatePasswordHash: async (userId: string, passwordHash: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: {
        id: true,
        email: true,
      },
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
