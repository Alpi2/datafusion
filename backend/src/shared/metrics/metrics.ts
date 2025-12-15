import client from "prom-client";

const register = new client.Registry();

// collect default metrics (CPU, memory, nodejs metrics)
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// HTTP requests counter
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

// Generation job metrics
export const generationJobSuccess = new client.Counter({
  name: "generation_jobs_success_total",
  help: "Total number of successful generation jobs",
  labelNames: ["tier"],
});

export const generationJobFailure = new client.Counter({
  name: "generation_jobs_failure_total",
  help: "Total number of failed generation jobs",
  labelNames: ["tier"],
});

export const generationJobDurationSeconds = new client.Histogram({
  name: "generation_job_duration_seconds",
  help: "Duration of generation jobs in seconds",
  labelNames: ["tier"],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
});

// Blockchain tx metrics
export const blockchainTxSuccess = new client.Counter({
  name: "blockchain_tx_success_total",
  help: "Total number of successful blockchain transactions",
});

export const blockchainTxFailure = new client.Counter({
  name: "blockchain_tx_failure_total",
  help: "Total number of failed blockchain transactions",
});

// Database query metrics
export const dbQueryDurationSeconds = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["model", "action"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
});

export const dbSlowQueries = new client.Counter({
  name: "db_slow_queries_total",
  help: "Total number of slow database queries",
  labelNames: ["model", "action"],
});

// Register custom metrics
[httpRequestDurationSeconds, httpRequestsTotal,
  generationJobSuccess, generationJobFailure, generationJobDurationSeconds,
  blockchainTxSuccess, blockchainTxFailure, dbQueryDurationSeconds, dbSlowQueries].forEach((m) => register.registerMetric(m));

export { register };

// Express middleware to measure HTTP requests
export function metricsMiddleware(req: any, res: any, next: any) {
  const end = httpRequestDurationSeconds.startTimer({ method: req.method, route: req.route ? req.route.path : req.path });
  res.on("finish", () => {
    const labels = { method: req.method, route: req.route ? req.route.path : req.path, status_code: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    end({ status_code: String(res.statusCode) });
  });
  next();
}

export function metricsEndpoint() {
  return async (req: any, res: any) => {
    try {
      res.setHeader("Content-Type", register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (err) {
      res.status(500).send(String((err as any)?.message || err));
    }
  };
}
