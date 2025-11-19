export type ApiError = {
  code: string;
  message: string;
  statusCode: number;
};

// Common type definitions used across the application
export type ApiResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

export type UserSession = {
  id: string;
  email: string;
  role: "admin" | "employer" | "job_seeker";
  verified: boolean;
};

// =====================================================
// ENUMS - Aligned with Prisma Schema
// =====================================================

export enum UserRole {
  ADMIN = "admin",
  EMPLOYER = "employer",
  JOB_SEEKER = "job_seeker",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  DEACTIVATED = "deactivated",
}

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
  INTERNSHIP = "internship",
  TEMPORARY = "temporary",
  FREELANCE = "freelance",
}

export enum JobStatus {
  DRAFT = "draft",
  OPEN = "open",
  CLOSED = "closed",
  ARCHIVED = "archived",
}

export enum ApplicationStatus {
  APPLIED = "applied",
  UNDER_REVIEW = "under_review",
  SHORTLISTED = "shortlisted",
  INTERVIEW = "interview",
  REJECTED = "rejected",
  HIRED = "hired",
  WITHDRAWN = "withdrawn",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  TRIAL = "trial",
  PENDING = "pending",
}

export enum ExperienceLevel {
  ENTRY = "entry",
  JUNIOR = "junior",
  MID = "mid",
  SENIOR = "senior",
  LEAD = "lead",
  EXECUTIVE = "executive",
}

export enum CompanySize {
  STARTUP_1_10 = "startup_1_10",
  SMALL_11_50 = "small_11_50",
  MEDIUM_51_200 = "medium_51_200",
  LARGE_201_1000 = "large_201_1000",
  ENTERPRISE_1000_PLUS = "enterprise_1000_plus",
}

export enum ReviewType {
  EMPLOYER_REVIEW = "employer_review",
  CANDIDATE_REVIEW = "candidate_review",
  COMPANY_REVIEW = "company_review",
}

export enum WorkLocationType {
  REMOTE = "remote",
  HYBRID = "hybrid",
  ON_SITE = "on_site",
}

export enum InterviewStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
  RESCHEDULED = "rescheduled",
}

export enum InterviewType {
  PHONE = "phone",
  VIDEO = "video",
  IN_PERSON = "in_person",
}

export enum ProficiencyLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  EXPERT = "expert",
}

export enum NotificationType {
  APPLICATION_UPDATE = "application_update",
  INTERVIEW_INVITE = "interview_invite",
  JOB_RECOMMENDATION = "job_recommendation",
  SYSTEM_ALERT = "system_alert",
  MESSAGE = "message",
}

export enum CommunicationType {
  EMAIL = "email",
  NOTIFICATION = "notification",
  MESSAGE = "message",
}
