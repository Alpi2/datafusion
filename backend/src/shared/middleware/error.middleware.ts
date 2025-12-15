import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { formatErrorForResponse } from "../errors/format-error";

export const errorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error with contextual request info
  logger.error({ message: (err as any)?.message, stack: (err as any)?.stack, path: req.path, body: req.body });

  // If available, report to Sentry (optional)
  try {
    if (process.env.SENTRY_DSN) {
      const Sentry = await import("@sentry/node").catch(() => null);
      if (Sentry && Sentry.captureException) {
        Sentry.captureException(err);
      }
    }
  } catch (reportErr) {
    logger.warn("Failed to report to Sentry", reportErr);
  }

  const status = (err as any)?.status || 500;

  // Use helper to create the standardized error payload
  const payload = formatErrorForResponse(err);

  res.status(status).json(payload);
};
