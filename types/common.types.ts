// Common type definitions used across the application

export type ApiResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type ApiError = {
  code: string;
  message: string;
  statusCode: number;
};

export type UserSession = {
  id: string;
  email: string;
  role: "admin" | "employer" | "job_seeker";
  verified: boolean;
};
