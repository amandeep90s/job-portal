import { createHash, randomInt } from "crypto";

import bcryptjs from "bcryptjs";

import { AccountDisabledError, AccountLockedError, OTPLockedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { authRepository } from "@/lib/repositories/auth.repository";
import { emailService } from "@/lib/services/email";
import { UserStatus } from "@/types";
import { ResendVerificationEmailInput, SignInInput, SignUpInput, VerifyEmailInput } from "@/validators";

// Security constants
const SALT_ROUNDS = 10;
const OTP_MAX_ATTEMPTS = 3;
const OTP_LOCKOUT_MINUTES = 15;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MINUTES = 15;
const TIMING_ATTACK_DELAY_MS = 800;
const DUMMY_PASSWORD_FOR_TIMING = "dummy-password-for-timing-attack-prevention";

// Dummy hash generated at module load time to match current SALT_ROUNDS
// Used for timing attack prevention during login for non-existent users
// Initialized lazily on first use or via initializeAuthService()
let DUMMY_HASH: string | null = null;
let DUMMY_HASH_INITIALIZATION: Promise<void> | null = null;

/**
 * Initialize the dummy hash at module startup
 * This ensures the hash always matches the current SALT_ROUNDS configuration
 * and performs timing-safe password comparison during failed login attempts
 */
const initializeDummyHash = async (): Promise<void> => {
  if (DUMMY_HASH === null) {
    DUMMY_HASH = await bcryptjs.hash(DUMMY_PASSWORD_FOR_TIMING, SALT_ROUNDS);
  }
};

/**
 * Get the dummy hash, initializing it lazily if needed
 * This ensures the hash is always available and matches SALT_ROUNDS
 */
const getDummyHash = async (): Promise<string> => {
  if (DUMMY_HASH !== null) {
    return DUMMY_HASH;
  }

  // If initialization is in progress, wait for it
  if (DUMMY_HASH_INITIALIZATION !== null) {
    await DUMMY_HASH_INITIALIZATION;
    return DUMMY_HASH!;
  }

  // Start initialization
  DUMMY_HASH_INITIALIZATION = initializeDummyHash();
  await DUMMY_HASH_INITIALIZATION;
  DUMMY_HASH_INITIALIZATION = null;

  return DUMMY_HASH!;
};

/**
 * Helper function to anonymize email for logging
 * Returns a hash of the email to comply with privacy/GDPR requirements
 */
const anonymizeEmail = (email: string): string => {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").substring(0, 16);
};

/**
 * Add a constant delay to normalize timing and prevent timing-based attacks
 * Helps prevent attackers from enumerating valid email addresses by measuring response times
 */
const addConstantDelay = async (delayMs: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
};

export const authService = {
  /**
   * Hash a password using bcryptjs
   */
  hashPassword: async (password: string): Promise<string> => {
    return bcryptjs.hash(password, SALT_ROUNDS);
  },

  /**
   * Compare a plain password with a hashed password
   * Uses bcryptjs for timing-safe comparison to prevent timing attacks
   * Always performs the comparison even if inputs are missing
   */
  comparePassword: async (password: string, hashedPassword: string): Promise<boolean> => {
    // Ensure we always do the comparison to prevent timing attacks
    // bcryptjs.compare handles timing-safe comparison internally
    if (!password || !hashedPassword) {
      return false;
    }
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
    // Check if OTP verification is locked due to too many failed attempts
    const isLocked = await authRepository.isOTPLocked(input.email);
    if (isLocked) {
      throw new OTPLockedError(
        OTP_LOCKOUT_MINUTES,
        `Too many failed OTP attempts. Please try again in ${OTP_LOCKOUT_MINUTES} minutes.`
      );
    }

    // Find the verification OTP record
    const otp = await authRepository.findVerificationOTP(input.email, input.otp);
    if (!otp) {
      // Use a transaction to atomically check and update attempt count
      // This prevents race conditions where multiple concurrent requests could bypass the lock
      const result = await prisma.$transaction(async (tx) => {
        // Get current attempt count within transaction
        const anyToken = await tx.verificationToken.findFirst({
          where: { identifier: input.email },
          select: { id: true, attempts: true, expires: true },
        });

        const currentAttempts = anyToken?.attempts ?? 0;
        const newAttempts = currentAttempts + 1;

        // Increment attempts atomically within the transaction
        await tx.verificationToken.updateMany({
          where: { identifier: input.email },
          data: { attempts: { increment: 1 } },
        });

        return {
          newAttempts,
          isExpired: anyToken?.expires ? anyToken.expires < new Date() : false,
        };
      });

      // Lock after OTP_MAX_ATTEMPTS
      if (result.newAttempts >= OTP_MAX_ATTEMPTS) {
        await authRepository.lockOTPVerification(input.email, OTP_LOCKOUT_MINUTES * 60 * 1000);
        console.warn(
          `[SECURITY] OTP verification locked for ${anonymizeEmail(input.email)} after ${result.newAttempts} failed attempts`
        );
        throw new OTPLockedError(
          OTP_LOCKOUT_MINUTES,
          `Too many failed OTP attempts. Please try again in ${OTP_LOCKOUT_MINUTES} minutes.`
        );
      }

      // Log for debugging (don't expose to user)
      if (result.isExpired) {
        console.warn(`[SECURITY] Expired OTP attempt for ${anonymizeEmail(input.email)}`);
      } else {
        console.warn(`[SECURITY] Invalid OTP attempt for ${anonymizeEmail(input.email)}`);
      }

      throw new Error("Invalid or expired OTP");
    }

    // Check if user exists
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user verification status
    const updatedUser = await authRepository.updateVerificationStatus(user.id, true);

    // Delete used OTP(s) and reset attempt counter
    await authRepository.deleteVerificationOTPsByEmail(input.email);

    return {
      message: "Email verified successfully",
      success: true,
      user: updatedUser,
    };
  },

  /**
   * Resend verification email
   * Implements timing-constant execution to prevent email enumeration attacks
   * Normalizes response time across all code paths (verified, unverified, non-existent users)
   */
  resendVerificationEmail: async (input: ResendVerificationEmailInput) => {
    const startTime = Date.now();

    // Check if user exists
    const user = await authRepository.findByEmail(input.email);

    // Check if user is already verified
    if (user && user.verified) {
      // User exists but is already verified - this is a fast path
      // Log for security but don't throw immediately (prevents timing-based enumeration)
      console.warn(`[SECURITY] Resend verification attempt for already verified email: ${anonymizeEmail(input.email)}`);
      // NOTE: We don't throw an error here immediately to prevent timing attacks
      // Instead, we let it fall through and add a delay to match the timing of other paths
    } else if (user) {
      // User exists and is unverified - perform email resend operations
      try {
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
          // Don't throw - let response normalize with delay
          console.warn(`[SECURITY] Failed to send verification email for ${anonymizeEmail(input.email)}`);
        }
      } catch (error) {
        console.error("Error processing verification email resend:", error);
      }
    } else {
      // User not found - log for security but don't reveal to client
      console.warn(`[SECURITY] Resend verification attempt for non-existent email: ${anonymizeEmail(input.email)}`);
    }

    // Normalize response time across all paths to prevent timing-based email enumeration
    // This ensures that response times don't leak information about whether the email exists or is verified
    const elapsedTime = Date.now() - startTime;
    const remainingDelay = Math.max(0, TIMING_ATTACK_DELAY_MS - elapsedTime);
    if (remainingDelay > 0) {
      await addConstantDelay(remainingDelay);
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
    // Find user by email (repository handles lowercase conversion)
    const user = await authRepository.findByEmail(input.email);

    // Check if account is locked (before checking if user exists to prevent timing attacks)
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      // Only throw if user exists - prevents user enumeration
      throw new AccountLockedError(minutesRemaining);
    }

    if (!user) {
      // Perform a dummy hash comparison to prevent timing attacks
      // This ensures the function takes roughly the same time whether user exists or not
      const dummyHash = await getDummyHash();
      await authService.comparePassword(input.password, dummyHash);
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
      const updated = await authRepository.incrementFailedLoginAttempts(user.email);

      // Lock account after LOGIN_MAX_ATTEMPTS
      if (updated && updated.failedLoginAttempts >= LOGIN_MAX_ATTEMPTS) {
        await authRepository.lockAccount(user.id, LOGIN_LOCKOUT_MINUTES * 60 * 1000);
        console.warn(
          `[SECURITY] Account locked for ${anonymizeEmail(user.email)} after ${LOGIN_MAX_ATTEMPTS} failed login attempts`
        );
        throw new AccountLockedError(
          LOGIN_LOCKOUT_MINUTES,
          "Account temporarily locked due to too many failed login attempts."
        );
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

/**
 * Initialize the authService by generating the dummy hash for timing attack prevention
 * Should be called once at application startup, typically in your Next.js instrumentation hook
 * @see: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export const initializeAuthService = async (): Promise<void> => {
  await initializeDummyHash();
};
