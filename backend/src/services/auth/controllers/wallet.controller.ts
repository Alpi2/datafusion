import { Request, Response } from 'express';

export const connectWallet = async (req: Request, res: Response) => {
  // placeholder: connect or link wallet to user
  return res.json({ ok: true, message: 'wallet connected (stub)' });
};

export const getWalletInfo = async (req: Request, res: Response) => {
  return res.json({ ok: true, wallet: null });
};
