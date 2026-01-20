import { ErrorCode } from "@/types/api";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Authentication Errors
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(ErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(ErrorCode.FORBIDDEN, message, 403);
  }
}

// Validation Errors
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.INVALID_INPUT, message, 400, details);
  }
}

// Resource Errors
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
  }
}

export class AlreadyExistsError extends AppError {
  constructor(resource: string = "Resource") {
    super(ErrorCode.ALREADY_EXISTS, `${resource} already exists`, 409);
  }
}

// Limit Errors
export class LimitExceededError extends AppError {
  constructor(limitType: string, limit: number) {
    super(
      ErrorCode.LIMIT_EXCEEDED,
      `${limitType} limit of ${limit} exceeded`,
      429,
    );
  }
}

export class SubjectsLimitExceededError extends AppError {
  constructor(limit: number) {
    super(
      ErrorCode.SUBJECTS_LIMIT_EXCEEDED,
      `Subjects limit of ${limit} exceeded. Please upgrade your plan.`,
      429,
    );
  }
}

export class NotesLimitExceededError extends AppError {
  constructor(limit: number) {
    super(
      ErrorCode.NOTES_LIMIT_EXCEEDED,
      `Notes limit of ${limit} exceeded. Please upgrade your plan.`,
      429,
    );
  }
}

export class AIUsageLimitExceededError extends AppError {
  constructor(limit: number) {
    super(
      ErrorCode.AI_USAGE_LIMIT_EXCEEDED,
      `AI usage limit of ${limit} exceeded. Please upgrade your plan or wait for the next cycle.`,
      429,
    );
  }
}

// Server Errors
export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed", details?: any) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details);
  }
}

export class AIProcessingError extends AppError {
  constructor(message: string = "AI processing failed", details?: any) {
    super(ErrorCode.AI_PROCESSING_ERROR, message, 500, details);
  }
}
