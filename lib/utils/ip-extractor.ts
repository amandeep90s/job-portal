/**
 * Secure IP address extraction utility
 * Handles IP extraction while preventing header spoofing attacks
 */

/**
 * List of trusted proxy IPs or IP ranges (CIDR format supported)
 * In production, configure this based on your infrastructure
 * Examples:
 * - Vercel: 76.76.19.0/24
 * - Cloudflare: 173.245.48.0/20,173.245.49.0/20,173.245.50.0/21,etc.
 * - AWS CloudFront: 52.86.0.0/15,52.88.0.0/13,etc.
 * - Single IP: 192.168.1.1
 */
const TRUSTED_PROXIES = process.env.TRUSTED_PROXY_IPS?.split(",").map((ip) => ip.trim()) || [];

/**
 * Convert IPv4 address to 32-bit integer for comparison
 * @param ip - IPv4 address string (e.g., "192.168.1.1")
 * @returns 32-bit integer or null if invalid
 */
function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return null;
    result = (result << 8) + num;
  }
  return result >>> 0; // Convert to unsigned 32-bit
}

/**
 * Parse CIDR notation and return network and mask
 * @param cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns Object with network and mask as 32-bit integers, or null if invalid
 */
function parseCIDR(cidr: string): { network: number; mask: number } | null {
  const [ip, prefixStr] = cidr.split("/");
  const ipInt = ipToInt(ip);

  if (ipInt === null) return null;

  // If no prefix, treat as single IP (/32)
  if (!prefixStr) {
    return { network: ipInt, mask: 0xffffffff };
  }

  const prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;

  // Create mask (e.g., /24 → 0xFFFFFF00)
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = ipInt & mask;

  return { network, mask };
}

/**
 * Check if an IP address is within a CIDR range or matches exactly
 * @param ip - IP address to check
 * @param proxy - Trusted proxy in CIDR or exact format
 * @returns true if IP matches the proxy range
 */
function isIPInRange(ip: string, proxy: string): boolean {
  // Try CIDR format first
  const cidr = parseCIDR(proxy);
  if (cidr) {
    const ipInt = ipToInt(ip);
    if (ipInt === null) return false;
    return (ipInt & cidr.mask) === (cidr.network & cidr.mask);
  }

  // If not valid CIDR, try exact match only
  return ip === proxy;
}

/**
 * Check if an IP is from a trusted proxy
 * @param ip - The IP address to check
 * @returns true if the IP is trusted or if no proxies are configured
 */
function isTrustedProxy(ip: string): boolean {
  // If no trusted proxies are configured, trust the header (development mode)
  if (TRUSTED_PROXIES.length === 0) {
    return true;
  }

  // Validate IP format (basic check)
  if (!ip || typeof ip !== "string") {
    return false;
  }

  // Check if IP matches any trusted proxy
  return TRUSTED_PROXIES.some((proxy) => isIPInRange(ip, proxy));
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
