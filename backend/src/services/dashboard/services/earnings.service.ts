import prisma from "../../../config/database";
import { Prisma } from "@prisma/client";
import DashboardCache from "../utils/cache.util";
import { createClient, type RedisClientType } from "redis";

const CACHE_TTL = 600; // 10 minutes
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

const cacheKey = (prefix: string, userId: string) =>
  `dashboard:earnings:${prefix}:${userId}`;

class EarningsService {
  async recordEarning(payload: {
    userId: string;
    datasetId?: string | null;
    amount: number;
    type: string;
    source?: string | null;
    transactionHash?: string | null;
    metadata?: any;
  }) {
    const {
      userId,
      datasetId = null,
      amount,
      type,
      source = null,
      transactionHash = null,
      metadata = null,
    } = payload;

    // Use transaction to create earning and update related records atomically
    const created = await prisma.$transaction(async (tx) => {
      const earn = await tx.earning.create({
        data: {
          userId,
          datasetId,
          amount,
          type,
          source,
          transactionHash,
          metadata,
        } as any,
      });

      // increment UserDataset.totalEarnings if datasetId provided
      if (datasetId) {
        await tx.userDataset.updateMany({
          where: { datasetId },
          data: { totalEarnings: { increment: amount } as any } as any,
        });
      }

      // increment user inflBalance (wallet balance)
      await tx.user.updateMany({
        where: { id: userId },
        data: { inflBalance: { increment: amount } as any } as any,
      });

      // log activity
      await tx.activityLog.create({
        data: {
          userId,
          action: "earning_recorded",
          details: { amount, type, datasetId, source },
          createdAt: new Date(),
        } as any,
      });

      return earn;
    });

    // invalidate caches
    try {
      await DashboardCache.invalidateEarnings(userId).catch(() => null);
    } catch (e) {
      // ignore cache errors
    }

    // Emit events for real-time updates (socket integration can hook here)
    // Use runtime require to avoid circular import during module initialization
    try {
      // attempt to emit via socketService if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const appModule = require("../../../app");
      const sock = appModule && appModule.socketService;
      if (sock && sock.getIO) {
        try {
          sock
            .getIO()
            .to(`user:${userId}`)
            .emit("earnings:update", { earning: created });
        } catch (e) {
          // ignore socket emit errors
        }
      }
      // also emit via internal emitter for SSE or other listeners
      try {
        if (sock && sock.getEmitter) {
          sock.getEmitter().emit(`earnings:${userId}`, { earning: created });
        }
      } catch (e) {
        // ignore emitter errors
      }
    } catch (e) {
      // swallow require/import errors
    }

    return created;
  }

  async calculateEarningsByPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const agg = await prisma.earning.aggregate({
      where: { userId, createdAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount ?? 0);
  }

  async getEarningsBreakdown(userId: string, datasetId?: string | null) {
    const client = await getRedis().catch(() => null);
    const key = cacheKey(
      "breakdown",
      userId + (datasetId ? `:${datasetId}` : "")
    );
    if (client) {
      const cached = await client.get(key).catch(() => null);
      if (cached) return JSON.parse(cached);
    }

    const rows: Array<{ type: string; total: string }> =
      (await prisma.$queryRaw(
        Prisma.sql`
      SELECT type, SUM(amount) as total
      FROM earnings
      WHERE user_id = ${userId} ${
          datasetId ? Prisma.sql`AND dataset_id = ${datasetId}` : Prisma.sql``
        }
      GROUP BY type
    `
      )) as any;

    const total = rows.reduce((s, r) => s + Number((r as any).total ?? 0), 0);
    const result = rows.map((r) => ({
      type: r.type,
      total: Number((r as any).total ?? 0),
      percent: total ? (Number((r as any).total ?? 0) / total) * 100 : 0,
    }));

    if (client)
      await client
        .setEx(key, CACHE_TTL, JSON.stringify(result))
        .catch(() => null);
    return result;
  }

  async getSummary(userId: string) {
    const cached = await DashboardCache.getEarningsSummary(userId).catch(
      () => null
    );
    if (cached) return { data: cached, cached: true };

    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const totalAgg = await prisma.earning.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const monthAgg = await prisma.earning.aggregate({
      where: { userId, createdAt: { gte: monthAgo } },
      _sum: { amount: true },
    });
    const weekAgg = await prisma.earning.aggregate({
      where: { userId, createdAt: { gte: weekAgo } },
      _sum: { amount: true },
    });

    const total = Number(totalAgg._sum.amount ?? 0);
    const monthly = Number(monthAgg._sum.amount ?? 0);
    const weekly = Number(weekAgg._sum.amount ?? 0);
    const tradingFeeRate = 0.015;

    const result = { total, monthly, weekly, tradingFeeRate };
    await DashboardCache.setEarningsSummary(userId, {
      userId,
      ...result,
    }).catch(() => null);
    return { data: result, cached: false };
  }

  async getByDataset(userId: string) {
    const clientCached = await DashboardCache.getEarningsSummary(userId).catch(
      () => null
    );
    // we use separate key below (byDataset) so don't return summary here

    const rows: Array<{ dataset_id: string; type: string; total: string }> =
      (await prisma.$queryRaw`
      SELECT dataset_id, type, SUM(amount) as total
      FROM earnings
      WHERE user_id = ${userId}
      GROUP BY dataset_id, type
    `) as any;

    const map: Record<string, any> = {};
    for (const r of rows) {
      const id = r.dataset_id;
      const t = r.type;
      const total = Number((r as any).total ?? 0);
      if (!map[id]) map[id] = { datasetId: id, totals: {}, total: 0 };
      map[id].totals[t] = (map[id].totals[t] ?? 0) + total;
      map[id].total += total;
    }

    const results = [] as any[];
    for (const id of Object.keys(map)) {
      const entry = map[id];
      const total = entry.total;
      const tradingFees = total * 0.6;
      const downloads = total * 0.3;
      const bonuses = total * 0.1;
      results.push({
        datasetId: id,
        total,
        breakdown: { tradingFees, downloads, bonuses },
        byType: entry.totals,
      });
    }

    // cache separately (include userId)
    await DashboardCache.setEarningsSummary(userId, { userId, total: 0 }).catch(
      () => null
    );
    return { data: results, cached: false };
  }

  async getByType(userId: string) {
    const rows: Array<{ type: string; total: string }> =
      (await prisma.$queryRaw`
      SELECT type, SUM(amount) as total
      FROM earnings
      WHERE user_id = ${userId}
      GROUP BY type
    `) as any;
    const result = rows.map((r) => ({
      type: r.type,
      total: Number((r as any).total ?? 0),
    }));
    return { data: result, cached: false };
  }

  async getTimeSeries(userId: string, period: string = "7d") {
    const days = period.endsWith("d")
      ? parseInt(period.slice(0, -1), 10)
      : parseInt(period, 10);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (isNaN(days) ? 7 : days));

    const rows: Array<{ day: string; total: string }> = (await prisma.$queryRaw`
      SELECT DATE_TRUNC('day', created_at) as day, SUM(amount) as total
      FROM earnings
      WHERE user_id = ${userId} AND created_at >= ${start}
      GROUP BY day
      ORDER BY day ASC
    `) as any;

    const map: Record<string, number> = {};
    for (const r of rows) {
      const day = new Date(r.day as any).toISOString().slice(0, 10);
      map[day] = Number((r as any).total ?? 0);
    }
    const series: Array<{ date: string; total: number }> = [];
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().slice(0, 10);
      series.push({ date: dayKey, total: map[dayKey] ?? 0 });
    }
    return { data: series, cached: false };
  }

  async simulateEarnings(datasetId: string, persist = false) {
    // Find purchases for the dataset
    const purchases = await prisma.purchase.findMany({ where: { datasetId } });
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) return { datasetId, simulated: 0, items: [] };

    const items: Array<any> = [];
    let totalSim = 0;
    for (const p of purchases) {
      const price = Number(p.pricePaid ?? 0);
      const downloadFee = price * 0.3; // mock: 30% goes to dataset owner
      const tradingFee = 0; // mock until bonding/trading exists
      const itemTotal = downloadFee + tradingFee;
      items.push({
        purchaseId: p.id,
        buyerId: p.buyerId,
        downloadFee,
        tradingFee,
        total: itemTotal,
      });
      totalSim += itemTotal;
    }

    if (persist && items.length) {
      // persist earnings for each purchase if not already recorded for that purchase
      const ops: any[] = [];
      for (const it of items) {
        // create earning with source = purchase id if not exists
        const exists = await prisma.earning.findFirst({
          where: { source: it.purchaseId },
        });
        if (exists) continue;
        ops.push(
          prisma.earning.create({
            data: {
              userId: dataset.creatorId,
              datasetId,
              amount: it.downloadFee,
              type: "download",
              source: it.purchaseId,
              createdAt: new Date(),
            } as any,
          })
        );
      }

      if (ops.length) {
        await prisma.$transaction(async (tx) => {
          const created = await Promise.all(
            ops.map((o) => tx.$executeRaw`${o}`)
          );
          // update totals
          await tx.userDataset.updateMany({
            where: { datasetId },
            data: { totalEarnings: { increment: totalSim } as any } as any,
          });
          await tx.user.updateMany({
            where: { id: dataset.creatorId },
            data: { inflBalance: { increment: totalSim } as any } as any,
          });
        });
      }
    }

    return { datasetId, simulated: totalSim, items };
  }
}

export default new EarningsService();
