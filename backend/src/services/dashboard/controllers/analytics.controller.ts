import { Request, Response, NextFunction } from "express";
import AggregationService from "../services/aggregation.service";
import { createClient } from 'redis';
import prisma from "../../../config/database";
import DashboardCache from "../utils/cache.util";
import StatsService from "../services/stats.service";
import { percentChange, safeNumber } from "../utils/metrics.util";

const CACHE_TTL = 900; // 15 minutes
const cacheKey = (key: string) => `analytics:${key}`;

async function getRedis() {
  try {
    const url =
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
    const client = createClient({ url, password: process.env.REDIS_PASSWORD || undefined });
    client.on('error', (e) => console.warn('Redis error', e));
    await client.connect();
    return client;
  } catch (e) {
    console.warn('getRedis failed', e);
    return null;
  }
}

export const getTimeSeries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.query as { userId?: string };
    const { from, to, interval } = req.query as {
      from?: string;
      to?: string;
      interval?: string;
    };

    const series = await AggregationService.aggregateTimeSeries({
      userId,
      from,
      to,
      interval,
    });
    return res.json({ data: series });
  } catch (err) {
    next(err);
  }
};

export const getPerformanceMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req.params.userId as string) || (req.query.userId as string);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const cached = await DashboardCache.getEarningsSummary(userId).catch(
      () => null
    );
    // we use DashboardCache for analytics caching where applicable

    const result = await StatsService.getPerformanceMetrics(userId);
    return res.json({ data: result, cached: false });
  } catch (err) {
    next(err);
  }
};

export const getDatasetComparison = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req.params.userId as string) || (req.query.userId as string);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const client = await getRedis();
    const key = cacheKey(`comparison:${userId}`);
    if (client) {
      const cached = await client.get(key);
      if (cached) return res.json({ data: JSON.parse(cached), cached: true });
    }

    // get user's datasets ordered by totalEarnings desc
    const userDatasets = await prisma.userDataset.findMany({
      where: { userId },
      orderBy: { totalEarnings: "desc" },
      take: 3,
      include: { dataset: true },
    });
    if (!userDatasets.length) return res.json({ data: [] });

    const maxEarnings =
      Math.max(...userDatasets.map((u) => Number(u.totalEarnings ?? 0)), 0) ||
      1;
    const maxHolders =
      Math.max(...userDatasets.map((u) => u.holderCount ?? 0), 1) || 1;

    const results = await Promise.all(
      userDatasets.map(async (ud) => {
        const datasetId = ud.datasetId;
        const marketCap = Number(ud.marketCap ?? 0);
        const volume24h = Number(ud.tradingVolume ?? 0); // approximation
        const earnings = Number(ud.totalEarnings ?? 0);
        const downloads = await prisma.purchase.count({ where: { datasetId } });
        const holders = ud.holderCount ?? 0;
        const qualityScore = ud.dataset?.qualityScore ?? 0;

        const performanceIndex =
          qualityScore * 0.4 +
          (earnings / maxEarnings) * 0.3 * 100 +
          (holders / maxHolders) * 0.3 * 100;

        return {
          datasetId,
          marketCap,
          volume24h,
          earnings,
          downloads,
          holders,
          qualityScore,
          performanceIndex,
        };
      })
    );

    if (client) await client.setEx(key, CACHE_TTL, JSON.stringify(results));

    return res.json({ data: results, cached: false });
  } catch (err) {
    next(err);
  }
};

export const getCategoryDistribution = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req.params.userId as string) || (req.query.userId as string);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const client = await getRedis();
    const key = cacheKey(`categories:${userId}`);
    if (client) {
      const cached = await client.get(key);
      if (cached) return res.json({ data: JSON.parse(cached), cached: true });
    }

    const rows: Array<{
      category: string;
      dataset_count: string;
      earnings: string;
    }> = (await prisma.$queryRaw`
      SELECT d.category, COUNT(*) as dataset_count, COALESCE(SUM(e.amount),0) as earnings
      FROM user_datasets ud
      JOIN datasets d ON ud.dataset_id = d.id
      LEFT JOIN earnings e ON e.dataset_id = d.id
      WHERE ud.user_id = ${userId}
      GROUP BY d.category
    `) as any;

    const result = rows.map((r) => ({
      category: r.category,
      datasetCount: Number((r as any).dataset_count ?? 0),
      earnings: Number((r as any).earnings ?? 0),
    }));

    if (client) await client.setEx(key, CACHE_TTL, JSON.stringify(result));

    return res.json({ data: result, cached: false });
  } catch (err) {
    next(err);
  }
};

export const getUserEngagement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req.params.userId as string) || (req.query.userId as string);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const client = await getRedis();
    const key = cacheKey(`engagement:${userId}`);
    if (client) {
      const cached = await client.get(key);
      if (cached) return res.json({ data: JSON.parse(cached), cached: true });
    }

    const datasetCount = await prisma.userDataset.count({
      where: { userId, NOT: { status: "draft" } },
    });
    const totalPurchases = await prisma.purchase.count({
      where: { dataset: { creatorId: userId } },
    });
    const avgDownloadsPerDataset = datasetCount
      ? totalPurchases / datasetCount
      : 0;

    // holder growth: attempt simple approximation using current holders vs a week-ago snapshot if available in activity_log
    const currentHoldersRow: any = await prisma.userDataset.aggregate({
      where: { userId },
      _sum: { holderCount: true } as any,
    });
    const currentHolders = Number(currentHoldersRow._sum?.holderCount ?? 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    // look for an activity log entry that might contain holder snapshot (best-effort)
    const snapshot = await prisma.activityLog.findFirst({
      where: {
        userId,
        action: { contains: "holder" },
        createdAt: { lt: weekAgo },
      },
      orderBy: { createdAt: "desc" },
    });
    let holderGrowthRate: number | null = null;
    if (snapshot && (snapshot.details as any)?.holders) {
      const last = Number((snapshot.details as any).holders ?? 0);
      holderGrowthRate = last ? (currentHolders - last) / last : null;
    }

    // trading volume trend: sum trading_fee over last 7 days by day
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    const rows: Array<{ day: string; total: string }> = (await prisma.$queryRaw`
      SELECT DATE_TRUNC('day', created_at) as day, SUM(amount) as total
      FROM earnings
      WHERE user_id = ${userId} AND type = 'trading_fee' AND created_at >= ${start}
      GROUP BY day
      ORDER BY day ASC
    `) as any;
    const trend: Array<{ date: string; total: number }> = [];
    const map: Record<string, number> = {};
    for (const r of rows) {
      const d = new Date(r.day as any).toISOString().slice(0, 10);
      map[d] = Number((r as any).total ?? 0);
    }
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const keyDay = d.toISOString().slice(0, 10);
      trend.push({ date: keyDay, total: map[keyDay] ?? 0 });
    }

    const result = {
      avgDownloadsPerDataset,
      holderGrowthRate,
      tradingVolumeTrend: trend,
    };

    if (client) await client.setEx(key, CACHE_TTL, JSON.stringify(result));

    return res.json({ data: result, cached: false });
  } catch (err) {
    next(err);
  }
};

export const getPlatformStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const client = await getRedis();
    const key = cacheKey("platform:latest");
    if (client) {
      const cached = await client.get(key);
      if (cached) return res.json({ data: JSON.parse(cached), cached: true });
    }

    const stat = await prisma.platformStats.findFirst({
      orderBy: { date: "desc" },
    });
    let result: any = stat;
    if (!stat) {
      // fallback aggregates
      const totalUsers = await prisma.user.count();
      const totalDatasets = await prisma.userDataset.count();
      const totalVolumeRow: any = await prisma.userDataset.aggregate({
        _sum: { tradingVolume: true as any },
      });
      const totalEarningsRow: any = await prisma.earning.aggregate({
        _sum: { amount: true as any },
      });
      result = {
        totalUsers,
        totalDatasets,
        totalVolume: Number(totalVolumeRow._sum.tradingVolume ?? 0),
        totalEarnings: Number(totalEarningsRow._sum.amount ?? 0),
      };
    }

    if (client) await client.setEx(key, CACHE_TTL, JSON.stringify(result));
    return res.json({ data: result, cached: false });
  } catch (err) {
    next(err);
  }
};

export const exportAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req.params.userId as string) || (req.query.userId as string);
    const format = (req.query.format as string) || "json";
    if (!userId) return res.status(400).json({ error: "userId is required" });

    // gather summary and comparison
    const perf = await getPerformanceMetricsInternal(userId);
    const comparison = await getDatasetComparisonInternal(userId);

    const payload = { performance: perf, comparison };
    if (format === "csv") {
      // simple CSV: performance on first lines, then comparison table
      const lines: string[] = [];
      lines.push("metric,value");
      for (const k of Object.keys(perf)) lines.push(`${k},${(perf as any)[k]}`);
      lines.push("");
      lines.push(
        "datasetId,marketCap,volume24h,earnings,downloads,holders,qualityScore,performanceIndex"
      );
      for (const r of comparison) {
        lines.push(
          `${r.datasetId},${r.marketCap},${r.volume24h},${r.earnings},${r.downloads},${r.holders},${r.qualityScore},${r.performanceIndex}`
        );
      }
      const csv = lines.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics_${userId}.csv"`
      );
      return res.send(csv);
    }

    return res.json({ data: payload });
  } catch (err) {
    next(err);
  }
};

// Internal helpers to reuse logic without HTTP request wrapping
const getPerformanceMetricsInternal = async (userId: string) => {
  const totalAgg = await prisma.earning.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const totalRevenue = safeNumber(totalAgg._sum.amount ?? 0);
  const activeCount = await prisma.userDataset.count({
    where: { userId, status: "bonding" },
  });
  const graduatedCount = await prisma.userDataset.count({
    where: { userId, status: "graduated" },
  });
  const datasets = await prisma.userDataset.findMany({
    where: { userId },
    include: { dataset: true },
  });
  const scores = datasets.map((d) => d.dataset?.qualityScore ?? 0);
  const avgQuality = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
  return { totalRevenue, activeCount, graduatedCount, avgQuality };
};

const getDatasetComparisonInternal = async (userId: string) => {
  const userDatasets = await prisma.userDataset.findMany({
    where: { userId },
    orderBy: { totalEarnings: "desc" },
    take: 3,
    include: { dataset: true },
  });
  const maxEarnings =
    Math.max(...userDatasets.map((u) => Number(u.totalEarnings ?? 0)), 0) || 1;
  const maxHolders =
    Math.max(...userDatasets.map((u) => u.holderCount ?? 0), 1) || 1;
  const results = await Promise.all(
    userDatasets.map(async (ud) => {
      const datasetId = ud.datasetId;
      const marketCap = Number(ud.marketCap ?? 0);
      const volume24h = Number(ud.tradingVolume ?? 0);
      const earnings = Number(ud.totalEarnings ?? 0);
      const downloads = await prisma.purchase.count({ where: { datasetId } });
      const holders = ud.holderCount ?? 0;
      const qualityScore = ud.dataset?.qualityScore ?? 0;
      const performanceIndex =
        qualityScore * 0.4 +
        (earnings / maxEarnings) * 0.3 * 100 +
        (holders / maxHolders) * 0.3 * 100;
      return {
        datasetId,
        marketCap,
        volume24h,
        earnings,
        downloads,
        holders,
        qualityScore,
        performanceIndex,
      };
    })
  );
  return results;
};

export default {
  getTimeSeries,
  getPerformanceMetrics,
  getDatasetComparison,
  getCategoryDistribution,
  getUserEngagement,
  getPlatformStats,
  exportAnalytics,
};
