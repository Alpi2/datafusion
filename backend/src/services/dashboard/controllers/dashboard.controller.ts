import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import prisma from "../../../config/database";
import { createClient, type RedisClientType } from "redis";
import { UserStats } from "../types/dashboard.types";
import StatsService from "../services/stats.service";
import { ensureOwnerOrRole } from "../../auth/middleware/auth.middleware";

const CACHE_TTL = 300; // seconds
let redisClient: RedisClientType | null = null;
const getRedis = async (): Promise<RedisClientType> => {
  if (redisClient && redisClient.isOpen) return redisClient;
  redisClient = createClient({
    url:
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || "localhost"}:${
        process.env.REDIS_PORT || "6379"
      }`,
    password: process.env.REDIS_PASSWORD || undefined,
  });
  redisClient.on("error", (e) => console.warn("Redis error:", e));
  await redisClient.connect();
  return redisClient;
};

const cacheKey = (userId: string) => `dashboard:stats:${userId}`;

export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req.params.userId as string) ||
      (req.query.userId as string) ||
      (req.body.userId as string);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      const result = await StatsService.calculateUserStats(userId);
      return res.json({ data: result, cached: false });
    } catch (e) {
      return next(e);
    }
  } catch (err) {
    next(err);
  }
};

export const getUserDatasets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req.params.userId as string) || (req.query.userId as string);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const rows = await prisma.userDataset.findMany({
      where: { userId },
      include: { dataset: true },
      orderBy: { createdAt: "desc" },
    });

    const result = await Promise.all(
      rows.map(async (r) => {
        const datasetId = r.datasetId;
        const earningsAgg = await prisma.earning.aggregate({
          where: { datasetId },
          _sum: { amount: true },
        });
        const earnings = Number(earningsAgg._sum.amount ?? 0);
        const downloads = await prisma.purchase.count({ where: { datasetId } });

        const ds = r.dataset;

        // Flatten shape expected by frontend
        return {
          id: ds.id,
          name: ds.title ?? "",
          title: ds.title ?? "",
          description: ds.description ?? "",
          tier: (ds as any).tier ?? "basic",
          status: r.status ?? ds.status,
          category: ds.category ?? "",
          marketCap: Number(r.marketCap ?? (ds as any).marketCap ?? 0),
          earnings,
          createdAt: ds.createdAt
            ? new Date(ds.createdAt).toISOString()
            : new Date().toISOString(),
          volume24h: Number(r.tradingVolume ?? 0),
          downloads,
          holders: r.holderCount ?? 0,
          qualityScore: ds.qualityScore ?? 0,
          bondingProgress: (r as any).bondingProgress ?? 0,
          deploymentType: r.deploymentType ?? null,
          nftTokenId: (r as any).nftTokenId ?? null,
          storageProvider: r.storageProvider ?? null,
          licenseRevenue: (r as any).licenseRevenue ?? 0,
        };
      })
    );

    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const getDatasetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, datasetId } = req.params as {
      userId?: string;
      datasetId?: string;
    };
    if (!datasetId)
      return res.status(400).json({ error: "datasetId is required" });

    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      include: { creator: true },
    });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    const userDataset = userId
      ? await prisma.userDataset.findUnique({ where: { datasetId } })
      : null;
    const earningsAgg = await prisma.earning.aggregate({
      where: { datasetId },
      _sum: { amount: true },
    });
    const earnings = Number(earningsAgg._sum.amount ?? 0);
    const downloads = await prisma.purchase.count({ where: { datasetId } });

    return res.json({ data: { dataset, userDataset, earnings, downloads } });
  } catch (err) {
    next(err);
  }
};

const invalidateUserCache = async (userId?: string) => {
  if (!userId) return;
  try {
    const client = await getRedis().catch(() => null);
    if (!client) return;
    await client.del(cacheKey(userId));
  } catch (e) {
    console.warn("Cache invalidate error", e);
  }
};

export const publishDataset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { datasetId, deploymentType, storageProvider } = req.body as any;
    // derive userId from authenticated user
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser || !authUser.id)
      return res.status(401).json({ error: "Unauthorized" });
    const userId = authUser.id as string;
    if (!datasetId)
      return res.status(400).json({ error: "datasetId is required" });

    // verify dataset exists and ownership
    const ds = await prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!ds) return res.status(404).json({ error: "Dataset not found" });
    if (!ensureOwnerOrRole(authUser, ds.creatorId, "admin"))
      return res
        .status(403)
        .json({ error: "Forbidden: cannot publish dataset you do not own" });

    // create or upsert UserDataset
    const created = await prisma.userDataset.upsert({
      where: { datasetId },
      update: {
        status: "bonding",
        publishedAt: new Date(),
        deploymentType: deploymentType ?? undefined,
        storageProvider: storageProvider ?? undefined,
      },
      create: {
        userId,
        datasetId,
        status: "bonding",
        deploymentType: deploymentType ?? "public",
        storageProvider: storageProvider ?? null,
        publishedAt: new Date(),
      },
    });

    // update dataset status to active
    await prisma.dataset.update({
      where: { id: datasetId },
      data: { status: "active" },
    });

    // log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "dataset_published",
        details: { datasetId },
        createdAt: new Date(),
      } as any,
    });

    // invalidate cache
    await invalidateUserCache(userId);

    return res.json({ data: created });
  } catch (err) {
    next(err);
  }
};

export const updateDataset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { datasetId } = req.params as { datasetId: string };
    const updates = req.body as any;
    if (!datasetId)
      return res.status(400).json({ error: "datasetId is required" });

    const existing = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });
    if (!existing) return res.status(404).json({ error: "Dataset not found" });

    // Authorization: only creator or admin can update
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser || !authUser.id)
      return res.status(401).json({ error: "Unauthorized" });
    if (!ensureOwnerOrRole(authUser, existing.creatorId, "admin"))
      return res.status(403).json({ error: "Forbidden" });

    const allowed: any = {};
    if (updates.title) allowed.title = updates.title;
    if (updates.description) allowed.description = updates.description;
    if (typeof updates.price !== "undefined") allowed.price = updates.price;
    if (updates.status) allowed.status = updates.status;

    const updated = await prisma.dataset.update({
      where: { id: datasetId },
      data: allowed,
    });

    // invalidate cache for the creator
    await invalidateUserCache(existing.creatorId);

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteDataset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { datasetId } = req.params as { datasetId: string };
    if (!datasetId)
      return res.status(400).json({ error: "datasetId is required" });

    const existing = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });
    if (!existing) return res.status(404).json({ error: "Dataset not found" });

    // Authorization: only creator or admin can delete
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser || !authUser.id)
      return res.status(401).json({ error: "Unauthorized" });
    if (!ensureOwnerOrRole(authUser, existing.creatorId, "admin"))
      return res.status(403).json({ error: "Forbidden" });

    const updated = await prisma.dataset.update({
      where: { id: datasetId },
      data: { status: "archived" },
    });

    await invalidateUserCache(existing.creatorId);

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

export const getActivityFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req.params.userId as string) || (req.query.userId as string);
    const limit = parseInt((req.query.limit as string) || "20", 10);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const items = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return res.json({ data: items });
  } catch (err) {
    next(err);
  }
};

export default {
  getUserStats,
  getUserDatasets,
  getDatasetById,
  publishDataset,
  updateDataset,
  deleteDataset,
  getActivityFeed,
};
