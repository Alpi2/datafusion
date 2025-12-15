import { createClient, type RedisClientType } from "redis";
import { UserStats } from "../types/dashboard.types";

// EarningsSummary type isn't declared elsewhere; define a lightweight shape here
export type EarningsSummary = {
  userId: string;
  total: number;
  breakdown?: Array<{ type: string; total: number }>;
  timeseries?: Array<{ timestamp: string; value: number }>;
};

const TTL = {
  USER_STATS: 300, // 5 minutes
  EARNINGS: 600, // 10 minutes
  ANALYTICS: 900, // 15 minutes
  PLATFORM_STATS: 3600, // 1 hour
};

let client: RedisClientType | null = null;
async function getClient(): Promise<RedisClientType | null> {
  try {
    if (client && client.isOpen) return client;
    const url =
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || "localhost"}:${
        process.env.REDIS_PORT || "6379"
      }`;
    client = createClient({
      url,
      password: process.env.REDIS_PASSWORD || undefined,
    });
    client.on("error", (err) => console.warn("Redis error", err));
    await client.connect();
    return client;
  } catch (e) {
    console.warn("Redis connection failed, caching disabled", e);
    client = null;
    return null;
  }
}

const keys = {
  userStats: (userId: string) => `dashboard:stats:${userId}`,
  earnings: (userId: string) => `dashboard:earnings:${userId}`,
  earningsByDataset: (userId: string) =>
    `dashboard:earnings:byDataset:${userId}`,
  earningsByType: (userId: string) => `dashboard:earnings:byType:${userId}`,
  earningsTimeSeries: (userId: string) =>
    `dashboard:earnings:timeseries:${userId}`,
  analytics: (userId: string) => `dashboard:analytics:${userId}`,
  platformStats: () => `platform:stats`,
};

class DashboardCache {
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const c = await getClient();
      if (!c) return null;
      const v = await c.get(keys.userStats(userId));
      if (!v) return null;
      return JSON.parse(v) as UserStats;
    } catch (e) {
      console.warn("getUserStats cache error", e);
      return null;
    }
  }

  async setUserStats(
    userId: string,
    stats: UserStats,
    ttl: number = TTL.USER_STATS
  ) {
    try {
      const c = await getClient();
      if (!c) return;
      await c.setEx(keys.userStats(userId), ttl, JSON.stringify(stats));
    } catch (e) {
      console.warn("setUserStats cache error", e);
    }
  }

  async invalidateUserStats(userId: string) {
    try {
      const c = await getClient();
      if (!c) return;
      await c.del(keys.userStats(userId));
    } catch (e) {
      console.warn("invalidateUserStats error", e);
    }
  }

  async getEarningsSummary(userId: string): Promise<EarningsSummary | null> {
    try {
      const c = await getClient();
      if (!c) return null;
      const v = await c.get(keys.earnings(userId));
      if (!v) return null;
      return JSON.parse(v) as EarningsSummary;
    } catch (e) {
      console.warn("getEarningsSummary cache error", e);
      return null;
    }
  }

  async setEarningsSummary(
    userId: string,
    summary: EarningsSummary,
    ttl: number = TTL.EARNINGS
  ) {
    try {
      const c = await getClient();
      if (!c) return;
      await c.setEx(keys.earnings(userId), ttl, JSON.stringify(summary));
    } catch (e) {
      console.warn("setEarningsSummary cache error", e);
    }
  }

  async getEarningsByDataset(userId: string): Promise<any[] | null> {
    try {
      const c = await getClient();
      if (!c) return null;
      const v = await c.get(keys.earningsByDataset(userId));
      if (!v) return null;
      return JSON.parse(v) as any[];
    } catch (e) {
      console.warn("getEarningsByDataset cache error", e);
      return null;
    }
  }

  async setEarningsByDataset(
    userId: string,
    data: any[],
    ttl: number = TTL.EARNINGS
  ) {
    try {
      const c = await getClient();
      if (!c) return;
      await c.setEx(keys.earningsByDataset(userId), ttl, JSON.stringify(data));
    } catch (e) {
      console.warn("setEarningsByDataset cache error", e);
    }
  }

  async getEarningsByType(userId: string): Promise<any[] | null> {
    try {
      const c = await getClient();
      if (!c) return null;
      const v = await c.get(keys.earningsByType(userId));
      if (!v) return null;
      return JSON.parse(v) as any[];
    } catch (e) {
      console.warn("getEarningsByType cache error", e);
      return null;
    }
  }

  async setEarningsByType(
    userId: string,
    data: any[],
    ttl: number = TTL.EARNINGS
  ) {
    try {
      const c = await getClient();
      if (!c) return;
      await c.setEx(keys.earningsByType(userId), ttl, JSON.stringify(data));
    } catch (e) {
      console.warn("setEarningsByType cache error", e);
    }
  }

  async getEarningsTimeSeries(userId: string): Promise<any[] | null> {
    try {
      const c = await getClient();
      if (!c) return null;
      const v = await c.get(keys.earningsTimeSeries(userId));
      if (!v) return null;
      return JSON.parse(v) as any[];
    } catch (e) {
      console.warn("getEarningsTimeSeries cache error", e);
      return null;
    }
  }

  async setEarningsTimeSeries(
    userId: string,
    data: any[],
    ttl: number = TTL.EARNINGS
  ) {
    try {
      const c = await getClient();
      if (!c) return;
      await c.setEx(keys.earningsTimeSeries(userId), ttl, JSON.stringify(data));
    } catch (e) {
      console.warn("setEarningsTimeSeries cache error", e);
    }
  }

  async invalidateEarnings(userId: string) {
    try {
      const c = await getClient();
      if (!c) return;
      await c.del(keys.earnings(userId));
      // also invalidate user stats as earnings affect stats
      await c.del(keys.userStats(userId));
    } catch (e) {
      console.warn("invalidateEarnings error", e);
    }
  }

  // Additional helpers matching invalidation triggers
  async invalidateAnalytics(userId: string) {
    try {
      const c = await getClient();
      if (!c) return;
      await c.del(keys.analytics(userId));
    } catch (e) {
      console.warn("invalidateAnalytics error", e);
    }
  }

  async invalidatePlatformStats() {
    try {
      const c = await getClient();
      if (!c) return;
      await c.del(keys.platformStats());
    } catch (e) {
      console.warn("invalidatePlatformStats error", e);
    }
  }
}

export default new DashboardCache();
