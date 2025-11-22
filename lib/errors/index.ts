// Custom error classes

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error") {
    super(500, "INTERNAL_SERVER_ERROR", message);
    this.name = "InternalServerError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

/**
 * Account specific error classes for authentication
 */
export class AccountLockedError extends AppError {
  constructor(
    public minutesUntilUnlock: number,
    message?: string
  ) {
    super(429, "ACCOUNT_LOCKED", message || `Account locked. Try again in ${minutesUntilUnlock} minutes.`);
    this.name = "AccountLockedError";
  }
}

export class OTPLockedError extends AppError {
  constructor(
    public minutesUntilUnlock: number,
    message?: string
  ) {
    super(429, "OTP_LOCKED", message || `Too many failed OTP attempts. Try again in ${minutesUntilUnlock} minutes.`);
    this.name = "OTPLockedError";
  }
}

export class AccountDisabledError extends AppError {
  constructor(reason: string) {
    super(402, "ACCOUNT_DISABLED", `Your account is currently ${reason}`);
    this.name = "AccountDisabledError";
  }
}
