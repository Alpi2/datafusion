import prisma from "../../../config/database";
import { Prisma } from "@prisma/client";
import { createClient, type RedisClientType } from "redis";

const CACHE_TTL = 900; // 15 minutes
let redisClient: RedisClientType | null = null;
const getRedis = async (): Promise<RedisClientType | null> => {
  try {
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
  } catch (e) {
    console.warn("Redis connect failed", e);
    return null;
  }
};

class AggregationService {
  // aggregate previous day's totals and insert into platform_stats
  async aggregateDailyStats(date?: Date) {
    const yesterday = date ? new Date(date) : new Date();
    // use previous day
    yesterday.setDate(yesterday.getDate() - 1);
    const start = new Date(yesterday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);

    // aggregates
    const totalUsers = await prisma.user.count();
    const totalDatasets = await prisma.userDataset.count();
    const totalVolumeRow: any = await prisma.userDataset.aggregate({
      _sum: { tradingVolume: true as any },
    });
    const totalVolume = Number(totalVolumeRow._sum.tradingVolume ?? 0);
    const earningsRow: any = await prisma.earning.aggregate({
      where: { createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const totalEarnings = Number(earningsRow._sum.amount ?? 0);
    const buyers = await prisma.purchase.findMany({
      where: { purchasedAt: { gte: start, lte: end } },
      select: { buyerId: true },
    });
    const buyerIds = Array.from(new Set(buyers.map((p) => p.buyerId)));
    const activeUsersCount = buyerIds.length;

    // New datasets and purchases in the 24h window
    const newDatasets24h = await prisma.dataset.count({
      where: { createdAt: { gte: start, lte: end } },
    });
    const totalPurchases24h = await prisma.purchase.count({
      where: { purchasedAt: { gte: start, lte: end } },
    });

    const created = await prisma.platformStats.create({
      data: {
        date: start,
        totalUsers,
        totalDatasets,
        totalVolume,
        totalEarnings,
        activeUsers24h: activeUsersCount,
        newDatasets24h,
        totalPurchases24h,
        createdAt: new Date(),
      } as any,
    });

    return created;
  }

  // user aggregation for a period
  async aggregateUserStats(userId: string, period: "day" | "week" | "month") {
    const now = new Date();
    let start = new Date(now);
    if (period === "day") start.setDate(now.getDate() - 1);
    if (period === "week") start.setDate(now.getDate() - 7);
    if (period === "month") start.setMonth(now.getMonth() - 1);
    start.setHours(0, 0, 0, 0);

    const earningsRow: any = await prisma.earning.aggregate({
      where: { userId, createdAt: { gte: start, lte: now } },
      _sum: { amount: true },
    });
    const earnings = Number(earningsRow._sum.amount ?? 0);
    const datasetCount = await prisma.userDataset.count({
      where: { userId, createdAt: { gte: start, lte: now } },
    });
    const purchases = await prisma.purchase.count({
      where: {
        dataset: { creatorId: userId },
        purchasedAt: { gte: start, lte: now },
      },
    });

    return {
      userId,
      period,
      start,
      end: now,
      earnings,
      datasetCount,
      purchases,
    };
  }

  // calculate trends comparing current period with previous
  async calculateTrends(userId: string) {
    const now = new Date();
    // current week: last 7 days
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 7);
    currentStart.setHours(0, 0, 0, 0);
    const prevStart = new Date(currentStart);
    prevStart.setDate(currentStart.getDate() - 7);
    const prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(-1);

    const currentEarningsRow: any = await prisma.earning.aggregate({
      where: { userId, createdAt: { gte: currentStart, lte: now } },
      _sum: { amount: true },
    });
    const prevEarningsRow: any = await prisma.earning.aggregate({
      where: { userId, createdAt: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    });
    const currentEarnings = Number(currentEarningsRow._sum.amount ?? 0);
    const prevEarnings = Number(prevEarningsRow._sum.amount ?? 0);

    const currentDatasets = await prisma.userDataset.count({
      where: { userId, createdAt: { gte: currentStart, lte: now } },
    });
    const prevDatasets = await prisma.userDataset.count({
      where: { userId, createdAt: { gte: prevStart, lte: prevEnd } },
    });

    const earningsGrowth =
      prevEarnings === 0
        ? currentEarnings === 0
          ? 0
          : 100
        : ((currentEarnings - prevEarnings) / Math.abs(prevEarnings)) * 100;
    const datasetGrowth =
      prevDatasets === 0
        ? currentDatasets === 0
          ? 0
          : 100
        : ((currentDatasets - prevDatasets) / Math.abs(prevDatasets)) * 100;

    return {
      earningsGrowth,
      datasetGrowth,
      current: { earnings: currentEarnings, datasets: currentDatasets },
      previous: { earnings: prevEarnings, datasets: prevDatasets },
    };
  }

  // schedule daily aggregation at next midnight; fallback uses setTimeout/setInterval
  startDailyScheduler() {
    const scheduleRun = async () => {
      try {
        await this.aggregateDailyStats();
      } catch (e) {
        console.warn("Daily aggregation failed", e);
      }
    };

    const now = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setHours(0, 0, 5, 0); // 00:05 to avoid midnight race
    const msUntilNext = next.getTime() - now.getTime();
    setTimeout(() => {
      scheduleRun();
      setInterval(scheduleRun, 24 * 60 * 60 * 1000);
    }, msUntilNext);
  }

  // Produce a simple time series (daily) for earnings or platform metrics
  async aggregateTimeSeries(opts: {
    userId?: string | null;
    from?: string | null;
    to?: string | null;
    interval?: string | null;
  }) {
    const { userId = null, from = null, to = null, interval = null } = opts;
    const end = to ? new Date(to) : new Date();
    const start = from
      ? new Date(from)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return d;
        })();
    // default to daily buckets
    const rows: Array<{ day: string; total: string }> = (await prisma.$queryRaw(
      Prisma.sql`
      SELECT DATE_TRUNC('day', created_at) as day, COALESCE(SUM(amount),0) as total
      FROM earnings
      WHERE ${
        userId ? Prisma.sql`user_id = ${userId} AND` : Prisma.sql``
      } created_at >= ${start} AND created_at <= ${end}
      GROUP BY day
      ORDER BY day ASC
    `
    )) as any;

    const map: Record<string, number> = {};
    for (const r of rows) {
      const d = new Date(r.day as any).toISOString().slice(0, 10);
      map[d] = Number((r as any).total ?? 0);
    }

    const series: Array<{ date: string; total: number }> = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, total: map[key] ?? 0 });
    }

    return series;
  }
}

export default new AggregationService();
