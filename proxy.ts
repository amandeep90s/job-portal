import { type NextRequest, NextResponse } from "next/server";

import { jwtVerify } from "jose";

/**
 * Proxy for Authentication and Verification Checks
 *
 * This proxy (replaces deprecated middleware):
 * 1. Checks if user session is valid
 * 2. Verifies JWT token validity
 * 3. Redirects unverified users trying to access protected routes
 * 4. Handles token refresh if needed
 *
 * Protected Routes: /employer/*, /job-seeker/*
 * Verification-Required Routes: /employer/*, /job-seeker/applications/*
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware-alternatives
 */

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is not set. Please set a secure, random secret of at least 32 bytes."
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Routes that require both authentication AND email verification
 */
const VERIFIED_REQUIRED_ROUTES = [/^\/employer\/.*/, /^\/job-seeker\/applications\/.*/, /^\/job-seeker\/profile/];

/**
 * Auth-only routes (sign-in, sign-up, forgot-password, reset-password)
 * Authenticated users trying to access these will be redirected to home
 */
const AUTH_ONLY_ROUTES = ["/sign-up", "/sign-in", "/forgot-password", "/reset-password"];

/**
 * Public routes that don't require authentication
 * These are exact matches only - no prefix matching
 */
const PUBLIC_ROUTES = ["/", "/sign-up", "/sign-in", "/forgot-password", "/verify-email", "/reset-password"];

/**
 * Helper function to safely check if a pathname matches a public route
 * Uses exact matching to prevent security issues like /sign-in matching /sign-in-test
 *
 * @param pathname - The current pathname
 * @returns true if pathname matches a public route exactly or is a query-string variant
 */
function isPublicRoute(pathname: string): boolean {
  // Exact match check
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // Allow query parameters and fragments: /verify-email?email=test is still a public route
  const basePathname = pathname.split("?")[0];
  return PUBLIC_ROUTES.includes(basePathname);
}

interface SessionData {
  userId: string;
  email: string;
  name: string;
  verified: boolean;
  role: "admin" | "employer" | "job_seeker";
  iat?: number;
  exp?: number;
  type?: string;
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as SessionData;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    // Log suspicious patterns for security events
    if (errorMsg.includes("signature")) {
      console.warn("[SECURITY] Token signature verification failed - possible tampering or use of wrong secret");
    } else if (errorMsg.includes("expired")) {
      console.debug("[Auth Proxy] Token expired - session refresh required");
    } else if (errorMsg.includes("invalid")) {
      console.warn("[SECURITY] Invalid token format detected");
    } else {
      console.error("[Auth Proxy] Token verification failed:", errorMsg);
    }

    return null;
  }
}

/**
 * Main proxy handler
 * Processes authentication and verification checks
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Get access token from cookies
  const accessToken = request.cookies.get("accessToken")?.value;

  // Check if user is authenticated
  let sessionData: SessionData | null = null;
  if (accessToken) {
    sessionData = await verifyToken(accessToken);
  }

  // If user is authenticated and trying to access auth-only routes, redirect to home
  if (sessionData && AUTH_ONLY_ROUTES.some((route) => pathname === route)) {
    console.info(
      `[Auth Proxy] Authenticated user (${sessionData.email}) trying to access ${pathname}, redirecting to home`
    );
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow public routes if user is not authenticated
  if (!sessionData && isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!accessToken) {
    // No token - redirect to sign-in
    console.warn("[Auth Proxy] No access token found, redirecting to sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (!sessionData) {
    // Invalid token - redirect to sign-in
    console.warn("[Auth Proxy] Invalid token, redirecting to sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Check if route requires verification
  const requiresVerification = VERIFIED_REQUIRED_ROUTES.some((route) => route.test(pathname));

  if (requiresVerification && !sessionData.verified) {
    // User is not verified but trying to access verified-required route
    console.warn(
      `[Auth Proxy] Unverified user (${sessionData.email}) trying to access ${pathname}, redirecting to verify-email`
    );
    return NextResponse.redirect(
      new URL(`/verify-email?email=${encodeURIComponent(sessionData.email)}&redirect=${pathname}`, request.url)
    );
  }

  // User is authenticated and verification requirements are met
  const response = NextResponse.next();

  // Add user info to response headers for later use
  response.headers.set("X-User-Id", sessionData.userId);
  response.headers.set("X-User-Email", sessionData.email);
  response.headers.set("X-User-Verified", String(sessionData.verified));
  response.headers.set("X-User-Role", sessionData.role);

  return response;
}

/**
 * Configure which routes the proxy should run on
 * Using the standard config export pattern
 *
 * Only runs on routes that actually need authentication checks:
 * - Protected routes: /employer/*, /job-seeker/*
 * - Auth-only routes: /sign-in, /sign-up, /forgot-password, /reset-password (to redirect authenticated users)
 * - Verify email routes: /verify-email (to redirect authenticated users here if unverified)
 *
 * Does NOT run on:
 * - Public content routes: /, /companies/*, /jobs/* (no auth needed)
 * - API routes: /api/* (separate auth handling)
 * - Static assets: /_next/*, /favicon.ico (no auth needed)
 */
export const config = {
  matcher: [
    // Protected routes that require authentication
    "/employer/:path*",
    "/job-seeker/:path*",
    // Auth-only routes (to redirect authenticated users away)
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    // Verification routes
    "/verify-email",
  ],
};
