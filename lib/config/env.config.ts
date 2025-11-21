// Environment Configuration
// Load and validate environment variables
type EnvConfig = {
  APP_NAME: string;
  SUPPORT_EMAIL: string;
  RESEND_API_KEY: string;
  RESEND_EMAIL_FROM: string;
  NEXT_PUBLIC_APP_URL: string;
  REDIS_URL: string;
  NODE_ENV: string;
  DATABASE_URL: string;
  VERCEL_URL: string;
};

export const env: EnvConfig = {
  APP_NAME: process.env.APP_NAME || "JobSearch",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_EMAIL_FROM: process.env.RESEND_EMAIL_FROM || "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  REDIS_URL: process.env.REDIS_URL || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  VERCEL_URL: process.env.VERCEL_URL || "",
};
