import { Queue, Worker, Job } from "bullmq";
import { logger } from "../../../shared/utils/logger";

export interface GenerationJobData {
  jobId: string;
  userId: string;
  prompt: string;
  tier: string;
  schema?: any;
  aiModels: string[];
  validationLevel?: string;
  complianceRequirements?: string[];
  knowledgeDocumentIds?: string[];
  chatContext?: any;
}

export class GenerationQueue {
  private queue: Queue;
  private worker: Worker;

  constructor() {
    const connection = {
      host: process.env.BULLMQ_REDIS_HOST || "localhost",
      port: parseInt(process.env.BULLMQ_REDIS_PORT || "6379"),
    } as any;
    this.queue = new Queue("generation", { connection });

    // Worker will be initialized separately with processor
    this.worker = null as any;
  }

  async addJob(data: GenerationJobData): Promise<string> {
    const job = await this.queue.add("generate-dataset", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    });

    logger.info(`📋 Job added to queue: ${job.id}`);
    return job.id as string;
  }

  initializeWorker(processor: (job: Job<GenerationJobData>) => Promise<void>) {
    const connection = {
      host: process.env.BULLMQ_REDIS_HOST || "localhost",
      port: parseInt(process.env.BULLMQ_REDIS_PORT || "6379"),
    } as any;
    const concurrency = parseInt(process.env.GENERATION_CONCURRENCY || "5");
    this.worker = new Worker("generation", processor, {
      connection,
      concurrency,
    });
    this.worker.on("completed", (job) => {
      logger.info(`✅ Job completed: ${job.id}`);
    });
    this.worker.on("failed", (job, err) => {
      logger.error(`❌ Job failed: ${job?.id}`, err);
    });
    logger.info("🔧 BullMQ worker initialized");
  }

  async close() {
    await this.queue.close();
    if (this.worker) await this.worker.close();
  }
}
