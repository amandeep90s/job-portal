// Application constants

export const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYER: "employer",
  JOB_SEEKER: "job_seeker",
} as const;

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  DEACTIVATED: "deactivated",
} as const;

export const EMPLOYMENT_TYPES = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACT: "contract",
  INTERNSHIP: "internship",
  TEMPORARY: "temporary",
  FREELANCE: "freelance",
} as const;

export const JOB_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
  DRAFT: "draft",
} as const;

export const APPLICATION_STATUS = {
  APPLIED: "applied",
  SHORTLISTED: "shortlisted",
  INTERVIEWED: "interviewed",
  REJECTED: "rejected",
  HIRED: "hired",
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  TRIAL: "trial",
} as const;

export const EXPERIENCE_LEVELS = {
  ENTRY: "entry",
  JUNIOR: "junior",
  MID: "mid",
  SENIOR: "senior",
  LEAD: "lead",
} as const;

export const COMPANY_SIZES = {
  STARTUP: "startup",
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
  ENTERPRISE: "enterprise",
} as const;

export const REVIEW_TYPES = {
  EMPLOYER_REVIEW: "employer_review",
  CANDIDATE_REVIEW: "candidate_review",
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// API response codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Routes
export const ROUTES = {
  AUTH: "/auth",
  JOBS: "/jobs",
  APPLICATIONS: "/applications",
  USERS: "/users",
  COMPANIES: "/companies",
  SUBSCRIPTIONS: "/subscriptions",
  NOTIFICATIONS: "/notifications",
  REVIEWS: "/reviews",
  SKILLS: "/skills",
  ANALYTICS: "/analytics",
} as const;
