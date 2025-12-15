import { Request, Response, NextFunction } from "express";
import AppError from "../../../shared/errors/app-error";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import prisma from "../../../config/database";
import { logger } from "../../../shared/utils/logger";

export class TransactionsController {
  // GET /api/blockchain/transactions
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;

      // Collect user wallet addresses (primary + connected wallets)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const wallets = await (prisma as any).userWallet.findMany({
        where: { userId },
      });
      const addresses = [
        user?.walletAddress || "",
        ...wallets.map((w: any) => w.address),
      ].filter(Boolean);

      // Fetch trades where traderAddress in addresses
      const trades = await prisma.trade.findMany({
        where: { traderAddress: { in: addresses } },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { bondingCurve: true },
      });

      // Purchases where buyerId == userId
      const purchases = await prisma.purchase.findMany({
        where: { buyerId: userId },
        orderBy: { purchasedAt: "desc" },
        take: 100,
      });

      // Earnings with transaction hashes for user
      const earnings = await prisma.earning.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // Normalize events into unified feed
      const normalized: any[] = [];
      for (const t of trades) {
        normalized.push({
          id: t.id,
          txHash: t.transactionHash,
          type: "trade",
          datasetId: t.bondingCurve ? t.bondingCurve.datasetId : null,
          amount: t.amount.toString(),
          price: t.price.toString(),
          fee: t.fee.toString(),
          blockNumber: t.blockNumber ? t.blockNumber.toString() : null,
          createdAt: t.createdAt,
          raw: t,
        });
      }

      for (const p of purchases) {
        normalized.push({
          id: p.id,
          txHash: p.transactionHash,
          type: "purchase",
          datasetId: p.datasetId,
          amount: p.pricePaid.toString(),
          createdAt: p.purchasedAt,
          raw: p,
        });
      }

      for (const e of earnings) {
        normalized.push({
          id: e.id,
          txHash: e.transactionHash,
          type: "earning",
          datasetId: e.datasetId,
          amount: e.amount.toString(),
          createdAt: e.createdAt,
          raw: e,
        });
      }

      // Sort by createdAt desc
      normalized.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({ success: true, items: normalized.slice(0, 200) });
    } catch (error) {
      logger.error("TransactionsController.list error", error);
      return next(new AppError("transactions_list_failed", "Failed to fetch transactions", 500, { originalMessage: (error as any)?.message }));
    }
  }
}

export default new TransactionsController();
