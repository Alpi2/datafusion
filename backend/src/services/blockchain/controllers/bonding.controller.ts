import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import AppError from "../../../shared/errors/app-error";
import { ContractService } from "../../blockchain/services/contract.service";
import { IPFSService } from "../../blockchain/services/ipfs.service";
import prisma from "../../../config/database";
import { z } from "zod";
import { logger } from "../../../shared/utils/logger";
import { ensureOwnerOrRole } from "../../auth/middleware/auth.middleware";

const deploySchema = z.object({
  datasetId: z.string().uuid(),
  tokenName: z.string().min(3).max(50),
  tokenSymbol: z
    .string()
    .min(2)
    .max(10)
    .transform((s) => s.toUpperCase()),
});

const tradeSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export class BondingController {
  private contractService: ContractService;
  private ipfsService: IPFSService;

  constructor() {
    this.contractService = new ContractService();
    this.ipfsService = new IPFSService();
  }

  async deploy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const { datasetId, tokenName, tokenSymbol } = deploySchema.parse(
        req.body
      );

      // Verify dataset exists and that the caller is the creator or has admin role
      const dataset = await prisma.dataset.findUnique({
        where: { id: datasetId },
      });
      if (!dataset) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      const authUser = req.user;
      if (!ensureOwnerOrRole(authUser, dataset.creatorId, "admin")) {
        return res.status(403).json({ error: "Forbidden: not owner" });
      }

      // Check if already deployed
      const existing = await prisma.bondingCurve.findUnique({
        where: { datasetId },
      });
      if (existing) {
        return res
          .status(400)
          .json({ error: "Bonding curve already deployed" });
      }

      // Upload metadata to IPFS
      const metadata = {
        name: tokenName,
        description: dataset.description,
        image: `ipfs://placeholder`,
        attributes: [
          { trait_type: "Quality Score", value: dataset.qualityScore },
          { trait_type: "Row Count", value: dataset.rowCount },
          { trait_type: "Category", value: dataset.category },
        ],
        external_url: `${process.env.FRONTEND_URL}/marketplace/${datasetId}`,
      };
      const metadataURI = await this.ipfsService.uploadMetadata(metadata);

      // Deploy bonding curve
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const deployment = await this.contractService.deployBondingCurve({
        name: tokenName,
        symbol: tokenSymbol as unknown as string,
        metadataURI,
        creatorAddress: user!.walletAddress,
      });

      // Save to database
      const bondingCurve = await prisma.bondingCurve.create({
        data: {
          datasetId,
          contractAddress: deployment.contractAddress,
          creatorAddress: user!.walletAddress,
          tokenName,
          tokenSymbol: tokenSymbol as unknown as string,
          deploymentTxHash: deployment.txHash,
        },
      });

      // Update dataset NFT fields
      await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          isNft: true,
          nftContractAddress: process.env.DATASET_NFT_ADDRESS,
          nftTokenId: deployment.nftTokenId,
        },
      });

      // Update UserDataset status
      await prisma.userDataset.update({
        where: { datasetId },
        data: {
          status: "bonding",
          publishedAt: new Date(),
        },
      });

      res.json({
        success: true,
        bondingCurve: {
          id: bondingCurve.id,
          contractAddress: deployment.contractAddress,
          nftTokenId: deployment.nftTokenId,
          transactionHash: deployment.txHash,
        },
      });
    } catch (error) {
      logger.error("Bonding curve deployment failed", error);
      return next(new AppError("bonding_deploy_failed", "Deployment failed", 500, { originalMessage: (error as any)?.message }));
    }
  }

  async buy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { datasetId } = req.params;
      const { amount } = tradeSchema.parse(req.body);
      const userId = req.user.id;
      const curve = await prisma.bondingCurve.findUnique({
        where: { datasetId },
      });
      if (!curve) {
        return res.status(404).json({ error: "Bonding curve not found" });
      }
      if (curve.graduated) {
        return res.status(400).json({ error: "Already graduated to Uniswap" });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      // Prepare unsigned transaction payload for the client to sign and send
      const txPayloadStr = await this.contractService.buyTokens(
        curve.contractAddress,
        amount
      );
      const txPayload = JSON.parse(txPayloadStr as unknown as string);
      res.json({ success: true, tx: txPayload });
    } catch (error) {
      logger.error("Buy transaction failed", error);
      return next(new AppError("bonding_buy_failed", "Purchase failed", 500, { originalMessage: (error as any)?.message }));
    }
  }

  async sell(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { datasetId } = req.params;
      const { amount } = tradeSchema.parse(req.body);
      const userId = req.user.id;
      const curve = await prisma.bondingCurve.findUnique({
        where: { datasetId },
      });
      if (!curve) {
        return res.status(404).json({ error: "Bonding curve not found" });
      }
      if (curve.graduated) {
        return res.status(400).json({ error: "Already graduated to Uniswap" });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      // Prepare unsigned transaction payload for the client to sign and send
      const txPayloadStr = await this.contractService.sellTokens(
        curve.contractAddress,
        amount
      );
      const txPayload = JSON.parse(txPayloadStr as unknown as string);
      res.json({ success: true, tx: txPayload });
    } catch (error) {
      logger.error("Sell transaction failed", error);
      return next(new AppError("bonding_sell_failed", "Sell failed", 500, { originalMessage: (error as any)?.message }));
    }
  }

  async getPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { datasetId } = req.params;
      const curve = await prisma.bondingCurve.findUnique({
        where: { datasetId },
      });
      if (!curve) {
        return res.status(404).json({ error: "Bonding curve not found" });
      }
      const price = await this.contractService.getCurrentPrice(
        curve.contractAddress
      );
      const marketCap = await this.contractService.getMarketCap(
        curve.contractAddress
      );
      res.json({
        currentPrice: price,
        marketCap,
        supply: curve.currentSupply.toString(),
        graduated: curve.graduated,
      });
    } catch (error) {
      logger.error("Failed to fetch price", error);
      return next(new AppError("bonding_price_failed", "Price fetch failed", 500, { originalMessage: (error as any)?.message }));
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { datasetId } = req.params;
      const curve = await prisma.bondingCurve.findUnique({
        where: { datasetId },
        include: {
          trades: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
      if (!curve) {
        return res.status(404).json({ error: "Bonding curve not found" });
      }
      res.json({
        contractAddress: curve.contractAddress,
        currentSupply: curve.currentSupply.toString(),
        currentPrice: curve.currentPrice.toString(),
        marketCap: curve.marketCap.toString(),
        totalVolume: curve.totalVolume.toString(),
        holderCount: curve.holderCount,
        graduated: curve.graduated,
        uniswapPool: curve.uniswapPoolAddress,
        recentTrades: curve.trades,
      });
    } catch (error) {
      logger.error("Failed to fetch status", error);
      return next(new AppError("bonding_status_failed", "Status fetch failed", 500, { originalMessage: (error as any)?.message }));
    }
  }
}

export default new BondingController();
