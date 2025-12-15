import { Queue, Worker } from "bullmq";
import { logger } from "../../../shared/utils/logger";

export interface BlockchainJobData {
  type: string;
  payload: any;
}

export class BlockchainQueue {
  private queue: Queue;

  constructor() {
    const connection = {
      host: process.env.BULLMQ_REDIS_HOST || "localhost",
      port: parseInt(process.env.BULLMQ_REDIS_PORT || "6379"),
    } as any;
    this.queue = new Queue("blockchain", { connection });
  }

  async addJob(data: BlockchainJobData) {
    const job = await this.queue.add("blockchain-job", data, { attempts: 3 });
    logger.info("Blockchain job added", job.id);
    return job.id;
  }

  initializeWorker(processor: (job: any) => Promise<void>) {
    const connection = {
      host: process.env.BULLMQ_REDIS_HOST || "localhost",
      port: parseInt(process.env.BULLMQ_REDIS_PORT || "6379"),
    } as any;
    new Worker("blockchain", async (job) => processor(job), { connection });
  }
}

export default new BlockchainQueue();
