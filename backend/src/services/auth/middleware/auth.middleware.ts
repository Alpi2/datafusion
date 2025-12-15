import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest, AuthenticatedUser } from "../types/auth.types";
import { JWTUtil } from "../utils/jwt.util";
import { RedisUtil } from "../utils/redis.util";
import { logger } from "../../../shared/utils/logger";
const jwtUtil = new JWTUtil();
const redisUtil = new RedisUtil();

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Authorization header'ı kontrol et
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token bulunamadı" });
    }
    const token = authHeader.substring(7);
    // JWT'yi doğrula
    const payload = jwtUtil.verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: "Geçersiz token" });
    }
    // Redis'te session kontrolü (opsiyonel ama önerilen)
    const sessionUserId = await redisUtil.getSession(token);

    if (sessionUserId === null && !redisUtil.isConnected) {
      // Redis error/fallback case — log and deny access
      logger.warn("Redis unavailable while validating session; denying access");
      return res.status(401).json({ error: "Session bulunamadı" });
    }

    if (!sessionUserId || sessionUserId !== payload.userId) {
      return res.status(401).json({ error: "Session bulunamadı" });
    }
    // User bilgisini request'e ekle (compat: both userId and id)
    const userObj: AuthenticatedUser = {
      userId: payload.userId,
      id: payload.userId,
      walletAddress: payload.walletAddress,
      username: payload.username,
      roles: (payload as any).roles || [],
      scopes: (payload as any).scopes || [],
      isAdmin: Array.isArray((payload as any).roles)
        ? (payload as any).roles.includes("admin")
        : false,
    };
    (req as AuthenticatedRequest).user = userObj;

    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Kimlik doğrulama hatası" });
  }
}

// Middleware helper: require a role
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !Array.isArray(user.roles) || !user.roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden: missing role" });
    }
    next();
  };
}

// Middleware helper: require a scope
export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !Array.isArray(user.scopes) || !user.scopes.includes(scope)) {
      return res.status(403).json({ error: "Forbidden: missing scope" });
    }
    next();
  };
}

// Controller helper: ensure owner or role
export function ensureOwnerOrRole(
  authUser: AuthenticatedUser | undefined,
  ownerId: string | undefined,
  role: string
): boolean {
  if (!authUser || !authUser.id) return false;
  if (authUser.id === ownerId) return true;
  if (Array.isArray(authUser.roles) && authUser.roles.includes(role)) return true;
  return false;
}
