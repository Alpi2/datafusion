import { Request, Response, NextFunction } from "express";
import AppError from "../../../shared/errors/app-error";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import prisma from "../../../config/database";
import { z } from "zod";
import { logger } from "../../../shared/utils/logger";

const registerSchema = z.object({
  address: z.string().min(1),
  provider: z.string().optional(),
  metadata: z.any().optional(),
});

export class WalletController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const wallets = await (prisma as any).userWallet.findMany({
        where: { userId },
      });
      // include primary wallet address
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const primary = user?.walletAddress
        ? [
            {
              id: "primary",
              address: user!.walletAddress,
              provider: "injected",
              isActive: true,
            },
          ]
        : [];
      res.json({ success: true, wallets: [...primary, ...wallets] });
    } catch (e) {
      logger.error("WalletController.list error", e);
      return next(new AppError("wallet_list_failed", "Could not list wallets", 500, { originalMessage: (e as any)?.message }));
    }
  }

  async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const { address, provider, metadata } = registerSchema.parse(req.body);
      // Create or upsert
      const existing = await (prisma as any).userWallet.findFirst({
        where: { userId, address },
      });
      if (existing) {
        return res.json({ success: true, wallet: existing });
      }
      const wallet = await (prisma as any).userWallet.create({
        data: {
          userId,
          address,
          provider: provider || "walletconnect",
          metadata: metadata || {},
        },
      });
      res.json({ success: true, wallet });
    } catch (e) {
      logger.error("WalletController.register error", e);
      return next(new AppError("wallet_register_failed", "Could not register wallet", 400, { originalMessage: (e as any)?.message }));
    }
  }

  async activate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: "Missing wallet id" });

      // If id === 'primary', toggle primary as active (no-op)
      if (id === "primary") {
        // nothing to do server-side, client can use primary
        return res.json({ success: true, active: { id: "primary" } });
      }

      // Deactivate other wallets and activate target
      await (prisma as any).userWallet.updateMany({
        where: { userId },
        data: { isActive: false },
      });
      const updated = await (prisma as any).userWallet.update({
        where: { id },
        data: { isActive: true },
      });
      res.json({ success: true, wallet: updated });
    } catch (e) {
      logger.error("WalletController.activate error", e);
      return next(new AppError("wallet_activate_failed", "Could not activate wallet", 500, { originalMessage: (e as any)?.message }));
    }
  }
}

export default new WalletController();
