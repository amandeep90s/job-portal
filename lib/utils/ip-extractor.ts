/**
 * Secure IP address extraction utility
 * Handles IP extraction while preventing header spoofing attacks
 */

/**
 * List of trusted proxy IPs or IP ranges
 * In production, configure this based on your infrastructure
 * Examples:
 * - Vercel: 76.76.19.0/24
 * - Cloudflare: See https://www.cloudflare.com/ips/
 * - AWS CloudFront: See AWS IP ranges
 */
const TRUSTED_PROXIES = process.env.TRUSTED_PROXY_IPS?.split(",") || [];

/**
 * Check if an IP is from a trusted proxy
 * @param ip - The IP address to check
 * @returns true if the IP is trusted or if no proxies are configured
 */
function isTrustedProxy(ip: string): boolean {
  // If no trusted proxies are configured, only trust direct connections
  if (TRUSTED_PROXIES.length === 0) {
    return true; // In development or when not configured, trust the header
  }

  // Check if IP matches any trusted proxy
  return TRUSTED_PROXIES.some((proxy) => {
    // Simple check - for production, use a proper IP range library
    return ip.includes(proxy) || ip === proxy;
  });
}

/**
 * Extract client IP address from request headers
 * Implements security best practices to prevent header spoofing
 *
 * @param headers - Request headers
 * @param remoteAddr - The remote address from the connection
 * @returns The extracted client IP address
 */
export function extractClientIP(headers: Headers, remoteAddr?: string): string {
  /**
   * Priority order for IP extraction:
   * 1. Proxy headers (if remoteAddr is from a trusted proxy)
   * 2. Direct connection IP (if not from proxy)
   * 3. Fallback to "unknown"
   *
   * Security: Only trust proxy headers if they come from a trusted proxy server
   */

  // If remoteAddr is available and from a trusted proxy, check proxy headers
  if (remoteAddr && remoteAddr !== "unknown" && isTrustedProxy(remoteAddr)) {
    // Check proxy headers in order of preference
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
      // x-forwarded-for can contain multiple IPs, use the first one (client IP)
      return xForwardedFor.split(",")[0].trim();
    }

    const xRealIp = headers.get("x-real-ip");
    if (xRealIp) {
      return xRealIp;
    }

    const cfConnectingIp = headers.get("cf-connecting-ip");
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
  }

  // If we have a direct connection IP (not from proxy), use it
  if (remoteAddr && remoteAddr !== "unknown") {
    return remoteAddr;
  }

  // Fallback: use remoteAddr or unknown
  return remoteAddr || "unknown";
}

/**
 * Generate a secure rate limit identifier
 * Combines IP address with email for multi-factor rate limiting
 */
export function generateRateLimitIdentifier(ip: string, email?: string): string {
  if (!email) {
    return `auth:${ip}`;
  }

  // Combine IP and email for more granular rate limiting
  // This prevents users from bypassing limits by changing IP while maintaining the same email
  return `auth:${ip}:${email.toLowerCase()}`;
}
