import { createClient, type RedisClientType } from "redis";
import { logger } from "../../../shared/utils/logger";

export class RedisUtil {
  private client: RedisClientType;
  private readonly SESSION_PREFIX = "session:";
  private readonly NONCE_PREFIX = "nonce:";
  private connected = false;

  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.client.on("error", (err) => {
      logger.error("Redis Error:", err);
      this.connected = false;
      // attempt reconnect after a delay
      setTimeout(() => {
        this.connect().catch((e) => logger.error("Redis reconnect failed:", e));
      }, 5000);
    });

    this.client.on("connect", () => {
      this.connected = true;
      logger.info("Redis client connected");
    });

    this.client.on("end", () => {
      this.connected = false;
      logger.warn("Redis connection ended");
    });
  }

  get isConnected() {
    return this.connected;
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async connect(): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      this.connected = true;
    } catch (err) {
      this.connected = false;
      logger.error("Redis connect error:", err);
      // schedule retry
      setTimeout(() => {
        this.connect().catch((e) => logger.error("Redis reconnect failed:", e));
      }, 5000);
    }
  }

  /**
   * Session kaydet
   */
  async setSession(
    sessionToken: string,
    userId: string,
    ttl: number
  ): Promise<void> {
    try {
      if (!this.connected) {
        logger.warn("Redis not connected — setSession skipped");
        return;
      }
      await this.client.setEx(
        `${this.SESSION_PREFIX}${sessionToken}`,
        ttl,
        userId
      );
    } catch (err) {
      logger.error("Redis setSession error:", err);
    }
  }

  /**
   * Session getir
   */
  async getSession(sessionToken: string): Promise<string | null> {
    try {
      if (!this.connected) {
        logger.warn("Redis not connected — getSession returning null");
        return null;
      }
      return await this.client.get(`${this.SESSION_PREFIX}${sessionToken}`);
    } catch (err) {
      logger.error("Redis getSession error:", err);
      return null;
    }
  }

  /**
   * Session sil
   */
  async deleteSession(sessionToken: string): Promise<void> {
    try {
      if (!this.connected) {
        logger.warn("Redis not connected — deleteSession skipped");
        return;
      }
      await this.client.del(`${this.SESSION_PREFIX}${sessionToken}`);
    } catch (err) {
      logger.error("Redis deleteSession error:", err);
    }
  }

  /**
   * Revoke all sessions for a given userId (scan + delete)
   */
  async revokeSessionsForUser(userId: string): Promise<number> {
    try {
      if (!this.connected) {
        logger.warn("Redis not connected — revokeSessionsForUser skipped");
        return 0;
      }
      let deleted = 0;
      // Use scan iterator to avoid blocking redis
      const pattern = `${this.SESSION_PREFIX}*`;
      for await (const key of this.client.scanIterator({ MATCH: pattern })) {
        try {
          const val = await this.client.get(key);
          if (val === userId) {
            await this.client.del(key);
            deleted += 1;
          }
        } catch (e) {
          logger.warn("Error checking session key during revoke", e);
        }
      }
      return deleted;
    } catch (err) {
      logger.error("Redis revokeSessionsForUser error:", err);
      return 0;
    }
  }

  /**
   * Rotate sessions for a user: revoke existing sessions and set the new token
   */
  async rotateSession(
    newToken: string,
    userId: string,
    ttl: number
  ): Promise<void> {
    try {
      if (!this.connected) {
        logger.warn("Redis not connected — rotateSession skipped");
        return;
      }
      await this.revokeSessionsForUser(userId);
      await this.setSession(newToken, userId, ttl);
    } catch (err) {
      logger.error("Redis rotateSession error:", err);
    }
  }

  /**
   * Nonce kaydet (5 dakika TTL)
   */
  async setNonce(walletAddress: string, nonce: string): Promise<void> {
    try {
      if (!this.connected) {
        logger.warn("Redis not connected — setNonce skipped");
        return;
      }
      await this.client.setEx(
        `${this.NONCE_PREFIX}${walletAddress.toLowerCase()}`,
        300,
        nonce
      );
    } catch (err) {
      logger.error("Redis setNonce error:", err);
    }
  }

  /**
   * Nonce getir ve sil (tek kullanımlık)
   */
  async getNonceAndDelete(walletAddress: string): Promise<string | null> {
    try {
      const key = `${this.NONCE_PREFIX}${walletAddress.toLowerCase()}`;
      if (!this.connected) {
        logger.warn("Redis not connected — getNonceAndDelete returning null");
        return null;
      }
      const nonce = await this.client.get(key);
      if (nonce) {
        await this.client.del(key);
      }
      return nonce;
    } catch (err) {
      logger.error("Redis getNonceAndDelete error:", err);
      return null;
    }
  }
}
