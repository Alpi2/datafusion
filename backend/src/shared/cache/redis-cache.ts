import { RedisUtil } from "../../services/auth/utils/redis.util";
import { logger } from "../utils/logger";

const redisUtil = new RedisUtil();

export async function initRedisCache() {
  try {
    await redisUtil.connect();
  } catch (e) {
    logger.warn("Redis cache init failed", e);
  }
}

/**
 * getOrSet cache helper
 * @param key cache key
 * @param ttlSeconds time-to-live
 * @param fetcher function to fetch value if cache miss
 */
export async function getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const client = redisUtil.getClient();
  try {
    if (!client) return await fetcher();
    const cached = await client.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch (e) {
        // fallback to fetcher
      }
    }
    const value = await fetcher();
    try {
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (e) {
      logger.warn("Redis setEx failed", e);
    }
    return value;
  } catch (err) {
    logger.warn("Redis getOrSet failed, falling back to fetcher", err);
    return await fetcher();
  }
}
