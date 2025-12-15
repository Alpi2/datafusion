import AppError from "./app-error";

export function formatErrorForResponse(err: any) {
  // Normalize to { error: { code, message } }
  const isAppError = err instanceof AppError;
  const code = isAppError ? err.code || err.name : "internal_error";
  const message = err?.message || "Internal Server Error";
  const payload: any = { error: { code, message } };

  // In non-production, include details for debugging (not required by API clients)
  if (process.env.NODE_ENV !== "production") {
    if (err?.details) payload.error.details = err.details;
    if (err?.stack) payload.error.stack = err.stack;
  }
  return payload;
}

export default formatErrorForResponse;
