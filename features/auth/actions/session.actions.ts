/**
 * Authentication Server Actions
 * Handles session management (logout)
 */

"use server";

/**
 * Clear session on logout
 */
export async function clearSessionOnLogout(userId: string) {
  try {
    const { invalidateSession } = await import("@/lib/auth/session");
    await invalidateSession(userId);

    return {
      success: true,
      message: "Session cleared successfully",
    };
  } catch (error) {
    console.error("Failed to clear session:", error);
    return {
      success: false,
      message: "Failed to clear session",
    };
  }
}
