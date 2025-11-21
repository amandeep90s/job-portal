// Environment Configuration
// Load and validate environment variables
export const env = {
  APP_NAME: process.env.APP_NAME || "JobSearch",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "support@jobsearch.com",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_EMAIL_FROM: process.env.RESEND_EMAIL_FROM || "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
};
