export type AppErrorDetails = Record<string, any> | string[] | null;

export class AppError extends Error {
  public code: string;
  public status: number;
  public details?: AppErrorDetails;

  constructor(
    code: string,
    message: string,
    status: number = 500,
    details?: AppErrorDetails
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const base: any = {
      code: this.code,
      message: this.message,
    };
    if (this.details) base.details = this.details;
    return base;
  }
}

export default AppError;
export class AppError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation error", details?: any) {
    super(message, 400, "validation_error", details);
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication error", details?: any) {
    super(message, 401, "auth_error", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found", details?: any) {
    super(message, 404, "not_found", details);
  }
}

export class BlockchainError extends AppError {
  constructor(message = "Blockchain error", details?: any) {
    super(message, 502, "blockchain_error", details);
  }
}

export default AppError;
