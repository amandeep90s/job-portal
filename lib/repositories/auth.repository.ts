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
        failedLoginAttempts: true,
        lockedUntil: true,
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
      data: {
        verified,
        verifiedAt: verified ? new Date() : null,
        status: verified ? UserStatus.ACTIVE : UserStatus.INACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
        verifiedAt: true,
        status: true,
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

  /**
   * Create a verification OTP
   */
  createVerificationOTP: async (email: string, otp: string, expiresIn: number = 5 * 60 * 1000) => {
    const expires = new Date(Date.now() + expiresIn);

    return prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        otp,
        expires,
      },
      select: {
        id: true,
        identifier: true,
        otp: true,
        expires: true,
      },
    });
  },

  /**
   * Find verification token by email and OTP
   */
  findVerificationOTP: async (email: string, otp: string) => {
    return prisma.verificationToken.findFirst({
      where: { identifier: email.toLowerCase(), otp, expires: { gt: new Date() } },
      select: {
        id: true,
        identifier: true,
        otp: true,
        expires: true,
        attempts: true,
      },
    });
  },

  /**
   * Delete verification OTP
   */
  deleteVerificationOTP: async (tokenId: string) => {
    return prisma.verificationToken.delete({
      where: { id: tokenId },
      select: { id: true },
    });
  },

  /**
   * Delete all verification tokens for an email
   */
  deleteVerificationOTPsByEmail: async (email: string) => {
    return prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    });
  },

  /**
   * Increment OTP attempt counter
   */
  incrementOTPAttempts: async (email: string) => {
    return prisma.verificationToken.updateMany({
      where: { identifier: email.toLowerCase() },
      data: { attempts: { increment: 1 } },
    });
  },

  /**
   * Lock OTP verification for an email
   */
  lockOTPVerification: async (email: string, durationMs: number) => {
    const lockedUntil = new Date(Date.now() + durationMs);
    return prisma.verificationToken.updateMany({
      where: { identifier: email.toLowerCase() },
      data: { lockedUntil },
    });
  },

  /**
   * Check if OTP verification is locked for an email
   */
  isOTPLocked: async (email: string) => {
    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase(),
        lockedUntil: { gt: new Date() },
      },
    });
    return Boolean(token);
  },

  /**
   * Increment failed login attempts
   */
  incrementFailedLoginAttempts: async (email: string) => {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    return prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { id: true, failedLoginAttempts: true },
    });
  },

  /**
   * Lock user account
   */
  lockAccount: async (userId: string, durationMs: number) => {
    const lockedUntil = new Date(Date.now() + durationMs);
    return prisma.user.update({
      where: { id: userId },
      data: { lockedUntil },
      select: { id: true, lockedUntil: true },
    });
  },

  /**
   * Reset failed login attempts
   */
  resetFailedLoginAttempts: async (userId: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0 },
      select: { id: true, failedLoginAttempts: true },
    });
  },
};
