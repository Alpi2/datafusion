import { JsonRpcProvider } from "ethers";
import { logger } from "../../../shared/utils/logger";

type GasEstimates = {
  slow: string; // gwei
  average: string;
  fast: string;
  fetchedAt: string;
};

class GasService {
  private provider: JsonRpcProvider;
  private cache: GasEstimates | null = null;
  private ttl = 15_000; // 15 seconds cache
  private lastFetch = 0;

  constructor() {
    this.provider = new JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || process.env.POLYGON_MUMBAI_RPC
    );
  }

  private gweiFromWei(wei: any) {
    try {
      const bn = BigInt(wei.toString());
      // convert to gwei with basic division
      const gwei = Number(bn / 1000000000n);
      return String(gwei);
    } catch (e) {
      return "0";
    }
  }

  async getEstimates(): Promise<GasEstimates> {
    const now = Date.now();
    if (this.cache && now - this.lastFetch < this.ttl) {
      return this.cache;
    }

    try {
      const feeData = await this.provider.getFeeData();
      // feeData.gasPrice && maxFeePerGas
      const average = feeData.gasPrice
        ? this.gweiFromWei(feeData.gasPrice)
        : "0";
      // heuristics for slow/fast
      const slow = String(Math.max(1, Number(average) - 5));
      const fast = String(Number(average) + 10);

      this.cache = {
        slow,
        average,
        fast,
        fetchedAt: new Date().toISOString(),
      };
      this.lastFetch = now;
      return this.cache;
    } catch (e) {
      logger.warn("GasService getEstimates failed", e);
      // fallback conservative defaults
      const fallback = {
        slow: "1",
        average: "10",
        fast: "50",
        fetchedAt: new Date().toISOString(),
      };
      this.cache = fallback;
      this.lastFetch = now;
      return fallback;
    }
  }
}

export default new GasService();
