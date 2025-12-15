import dotenv from "dotenv";
import express from "express";
import { Router } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./services/auth/routes/auth.routes";
import { createGenerationRoutes } from "./services/generation/routes/generation.routes";
import { RedisUtil } from "./services/auth/utils/redis.util";
import { errorHandler } from "./shared/middleware/error.middleware";
import { logger } from "./shared/utils/logger";
import { createServer } from "http";
import { GenerationQueue } from "./services/generation/queue/generation.queue";
import { GenerationWorker } from "./services/generation/workers/generation.worker";
import { GenerationController } from "./services/generation/controllers/generation.controller";
import { SocketService } from "./services/generation/socket/socket.service";
import { BondingController } from "./services/blockchain/controllers/bonding.controller";
import { NFTController } from "./services/blockchain/controllers/nft.controller";
import { WebhookController as BlockchainWebhookController } from "./services/blockchain/controllers/webhook.controller";
import { createBlockchainRoutes } from "./services/blockchain/routes/blockchain.routes";
import { GasController } from "./services/blockchain/controllers/gas.controller";
import { TransactionsController } from "./services/blockchain/controllers/transactions.controller";
import { WalletController } from "./services/blockchain/controllers/wallet.controller";
import { EventListenerService } from "./services/blockchain/services/event-listener.service";
import { StorageService } from "./services/storage/storage.service";
import { StorageController } from "./services/generation/controllers/storage.controller";
import { authMiddleware } from "./services/auth/middleware/auth.middleware";
import prisma from "./config/database";
import { ElasticsearchService } from "./services/marketplace/search/elasticsearch.service";
import { metricsMiddleware, metricsEndpoint } from "./shared/metrics/metrics";
import { register } from "./shared/metrics/metrics";
import * as Sentry from "@sentry/node";
import dd from "dd-trace";
import { createClient as createRedisClient } from "redis";
import { Client as ESClient } from "@elastic/elasticsearch";
import cookieParser from "cookie-parser";
import { StripeService } from "./services/marketplace/payment/stripe.service";
import { MarketplaceController } from "./services/marketplace/controllers/marketplace.controller";
import { WebhookController } from "./services/marketplace/controllers/webhook.controller";
import { createMarketplaceRoutes } from "./services/marketplace/routes/marketplace.routes";
import { SyncWorker } from "./services/marketplace/workers/sync.worker";
import {
  createDashboardRoutes,
  createAnalyticsRoutes,
} from "./services/dashboard/routes/dashboard.routes";
import embeddingsRoutes from "./services/embeddings/routes/embeddings.routes";
import chatRoutes from "./services/chat/routes/chat.routes";
import DashboardController from "./services/dashboard/controllers/dashboard.controller";
import EarningsController from "./services/dashboard/controllers/earnings.controller";
import AnalyticsController from "./services/dashboard/controllers/analytics.controller";
import StatsService from "./services/dashboard/services/stats.service";
import EarningsService from "./services/dashboard/services/earnings.service";
import AggregationService from "./services/dashboard/services/aggregation.service";
import cron from "node-cron";

dotenv.config();

// Initialize Sentry (optional)
if (process.env.SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE || "0.0"
      ),
    });
    logger.info("Sentry initialized");
  } catch (e) {
    logger.warn("Sentry init failed", e);
  }
}

// Initialize Datadog APM (dd-trace) if enabled
if (process.env.DATADOG_TRACING === "true") {
  try {
    dd.init({
      analytics: true,
      env: process.env.NODE_ENV || "development",
    });
    logger.info("Datadog dd-trace initialized");
  } catch (e) {
    logger.warn("Datadog init failed", e);
  }
}

const app = express();
const httpServer = createServer(app);

// Cookie parser (required for CSRF cookie mode)
app.use(cookieParser(process.env.COOKIE_SECRET || "keyboard cat"));

// CSRF protection removed: this backend authenticates API requests using
// Bearer JWTs in the `Authorization` header and does not rely on cookie-based
// session auth for API calls. Therefore CSRF protection for JSON API routes
// is unnecessary and was removed to avoid accidentally bypassing security.
// If you later introduce cookie-based auth/session cookies, re-enable CSRF
// protection and implement a `/api/csrf-token` endpoint for SPA clients.

// exportable socket service instance (assigned in startServer)
export let socketService: SocketService | null = null;

// Middleware
app.use(helmet());
// Tighten CORS configuration: require explicit ALLOWED_ORIGINS in production.
{
  const allowedEnv = process.env.ALLOWED_ORIGINS || "";
  let origins: string[] = [];
  if (allowedEnv) {
    origins = allowedEnv.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if ((process.env.NODE_ENV || "development") === "production" && origins.length === 0) {
    // Fail fast in production to avoid accidentally allowing all origins
    throw new Error(
      "FATAL: ALLOWED_ORIGINS must be set in production (comma-separated list of origins)"
    );
  }
  // Default to localhost origin for development when not provided
  if (origins.length === 0) origins = ["http://localhost:3000"];

  app.use(
    cors({
      origin: origins,
      credentials: true,
    })
  );
}
// NOTE: Do not apply JSON parsing globally for Stripe webhooks.
// We'll register a raw body parser specifically for the Stripe webhook route
// before registering the JSON parser for other routes (see startServer).

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  // Use JSON error shape and English message for consistency
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later.",
      },
    });
  },
});
app.use("/api/", limiter);
// Metrics middleware (measure API response times and counts)
app.use(metricsMiddleware);

// Routes
app.use("/api/auth", authRoutes);
// Generation routes will be mounted after services are initialized

// During tests (Jest), enable JSON parsing so `req.body` is available for test requests.
// Register JSON parser before mounting routes so test requests are parsed correctly.
if (typeof process.env.JEST_WORKER_ID !== "undefined") {
  app.use(express.json());
}

// Mount dashboard and analytics routes at module-level so tests can import `app`
// without triggering the full `startServer` initialization (external services).
app.use(
  "/api/dashboard",
  createDashboardRoutes(DashboardController, EarningsController)
);
app.use("/api/analytics", createAnalyticsRoutes(AnalyticsController));

// Health check
app.get("/health", async (req, res) => {
  const checks: any = { timestamp: new Date().toISOString() };
  // DB check
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch (e) {
    checks.db = "error";
    checks.dbError = String((e as any)?.message || e);
  }
  // Redis check (if configured)
  if (process.env.REDIS_HOST) {
    try {
      const client = createRedisClient({
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || "6379"),
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });
      await client.connect();
      await client.ping();
      await client.disconnect();
      checks.redis = "ok";
    } catch (e) {
      checks.redis = "error";
      checks.redisError = String((e as any)?.message || e);
    }
  }
  // Elasticsearch check (if configured)
  if (process.env.ELASTICSEARCH_NODE) {
    try {
      const es = new ESClient({ node: process.env.ELASTICSEARCH_NODE });
      const health = await es.cluster.health();
      checks.elasticsearch = health || "ok";
    } catch (e) {
      checks.elasticsearch = "error";
      checks.elasticsearchError = String((e as any)?.message || e);
    }
  }
  res.json({ status: "ok", checks });
});

// Prometheus metrics endpoint
app.get("/metrics", metricsEndpoint());

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
async function startServer() {
  try {
    // Redis connection
    const redisUtil = new RedisUtil();
    await redisUtil.connect();
    logger.info("✅ Redis connected");

    // MinIO initialization
    const storage = new StorageService();
    await storage.initialize();
    logger.info("✅ MinIO initialized");

    // Elasticsearch initialization
    const elasticsearchService = new ElasticsearchService();
    await elasticsearchService.initialize();
    logger.info("✅ Elasticsearch initialized");
    // Stripe and Marketplace services
    const stripeService = new StripeService();
    const marketplaceController = new MarketplaceController(
      elasticsearchService,
      stripeService,
      storage
    );
    const webhookController = new WebhookController(stripeService);
    // Register a raw body parser for Stripe webhook route so the
    // signature verification receives the exact raw payload.
    app.use(
      "/api/marketplace/webhooks/stripe",
      express.raw({ type: "application/json" })
    );

    // Now register JSON parser for the rest of the routes
    app.use(express.json());
    // Mount embeddings and chat routes (require JSON/body parsing)
    app.use("/api/embeddings", embeddingsRoutes);
    app.use("/api/chat", chatRoutes);
    // Sync existing datasets into Elasticsearch and schedule periodic syncs
    const syncWorker = new SyncWorker(elasticsearchService);
    await syncWorker.syncAllDatasets(); // initial sync
    syncWorker.startPeriodicSync(60); // every 60 minutes
    // Mount marketplace routes
    app.use(
      "/api/marketplace",
      createMarketplaceRoutes(marketplaceController, webhookController)
    );

    // Initialize dashboard/analytics services and controllers (routes are mounted at module scope)
    const statsService = StatsService;
    const earningsService = EarningsService;
    const aggregationService = AggregationService;
    const dashboardController = DashboardController;
    const earningsController = EarningsController;
    const analyticsController = AnalyticsController;

    // Schedule daily aggregation at midnight
    cron.schedule("0 0 * * *", async () => {
      logger.info("Running daily platform stats aggregation...");
      try {
        await aggregationService.aggregateDailyStats();
      } catch (e) {
        logger.error("Daily aggregation failed", e);
      }
    });

    // Socket.io and generation queue/worker setup
    socketService = new SocketService(httpServer);
    const generationQueue = new GenerationQueue();
    const generationWorker = new GenerationWorker(socketService);
    const generationController = new GenerationController(generationQueue);

    // Initialize worker
    generationQueue.initializeWorker(async (job) => {
      await generationWorker.process(job as any);
    });

    // Blockchain controllers + routes
    const bondingController = new BondingController();
    const nftController = new NFTController();
    const chainWebhookController = new BlockchainWebhookController();
    const gasController = new GasController();
    const transactionsController = new TransactionsController();
    const walletController = new WalletController();
    app.use(
      "/api/blockchain",
      createBlockchainRoutes(
        bondingController,
        nftController,
        chainWebhookController,
        gasController,
        transactionsController,
        walletController
      )
    );

    // Start blockchain event listeners (subscribe to on-chain events)
    try {
      const eventListener = new EventListenerService();
      await eventListener.start();
      logger.info("✅ Blockchain event listener started");
    } catch (e) {
      logger.warn("Blockchain event listener failed to start", e);
    }

    // Mount generation routes
    app.use("/api/generation", createGenerationRoutes(generationController));

    // Expose storage endpoints under /api/storage to maintain compatibility
    const storageController = new StorageController();
    const storageRouter = Router();
    storageRouter.post(
      "/presign",
      authMiddleware,
      storageController.getPresignedUploadUrl.bind(storageController)
    );
    storageRouter.get(
      "/download/:fileId",
      authMiddleware,
      storageController.getPresignedDownloadUrl.bind(storageController)
    );
    app.use("/api/storage", storageRouter);

    // SSE endpoint for job progress at /ws/jobs/:jobId for non-socket clients
    app.get("/ws/jobs/:jobId", async (req, res) => {
      const { jobId } = req.params;
      // set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      // send initial job state if available
      try {
        const job = await (prisma as any).generationJob.findUnique({
          where: { id: jobId },
        });
        if (job) {
          const init = {
            status: job.status,
            progress: job.progress,
            currentStep: job.currentStep,
            resultUrl: job.resultUrl,
          };
          res.write(`data: ${JSON.stringify(init)}\n\n`);
        }
      } catch (e) {
        // ignore initial fetch errors
      }

      const handler = (data: any) => {
        try {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
          // noop
        }
      };

      const emitter = socketService!.getEmitter();
      emitter.on(`job:${jobId}`, handler);

      req.on("close", () => {
        emitter.off(`job:${jobId}`, handler);
      });
    });

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("❌ Server failed to start:", error);
    process.exit(1);
  }
}
// Only automatically start the full server when not running tests or under Jest.
// Jest sets `JEST_WORKER_ID`; use it to detect test runs more reliably in various setups.
if (
  process.env.NODE_ENV !== "test" &&
  typeof process.env.JEST_WORKER_ID === "undefined"
) {
  startServer();
}

export default app;
