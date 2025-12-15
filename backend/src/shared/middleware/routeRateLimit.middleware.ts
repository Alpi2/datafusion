import rateLimit from "express-rate-limit";
import { Request } from "express";
import type { AuthenticatedRequest } from "../../services/auth/types/auth.types";

export function createRouteRateLimiter(options?: {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}) {
  const windowMs = options?.windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000");
  const max = options?.max ?? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");
  const prefix = options?.keyPrefix || "rl:";
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req: Request) => {
      // Prefer authenticated user id when available to bind limits per user
      const user = (req as AuthenticatedRequest).user;
      if (user && user.id) return `${prefix}user:${user.id}`;
      // fallback to IP
      return `${prefix}ip:${req.ip}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
