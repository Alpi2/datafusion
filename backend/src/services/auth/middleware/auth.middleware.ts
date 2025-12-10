import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const payload = await verifyToken(token);
    (req as any).user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
