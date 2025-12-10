import { Request, Response } from 'express';

export const getProfile = async (req: Request, res: Response) => {
  // placeholder: return user profile
  const user = (req as any).user || null;
  return res.json({ ok: true, user });
};

export const updateProfile = async (req: Request, res: Response) => {
  // placeholder: update profile
  return res.json({ ok: true, message: 'profile updated (stub)' });
};
