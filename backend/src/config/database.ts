import { PrismaClient } from "@prisma/client";
import { dbQueryDurationSeconds, dbSlowQueries } from "../shared/metrics/metrics";
import { logger } from "../shared/utils/logger";

// Build a DATABASE_URL that can include connection limit if provided
function buildDatabaseUrl() {
	const url = process.env.DATABASE_URL || "";
	const limit = process.env.PRISMA_CONNECTION_LIMIT;
	if (!url) return url;
	if (limit) {
		// Append connection_limit for Postgres-style URLs
		if (url.includes("?")) return `${url}&connection_limit=${limit}`;
		return `${url}?connection_limit=${limit}`;
	}
	return url;
}

const databaseUrl = buildDatabaseUrl();

const prisma = new PrismaClient({
	datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
	log: [
		{ level: "query", emit: "event" },
		{ level: "info", emit: "stdout" },
		{ level: "error", emit: "stdout" },
	],
});

// Prisma query event listener for metrics and slow query logging
prisma.$on("query", (e: any) => {
	try {
		const model = e.model || "unknown";
		const action = e.action || "query";
		const durationSec = e.duration / 1000 || 0;
		dbQueryDurationSeconds.observe({ model, action }, durationSec);
		// Mark slow queries (threshold configurable via env)
		const thresholdMs = parseInt(process.env.DB_SLOW_QUERY_THRESHOLD_MS || "200");
		if (e.duration >= thresholdMs) {
			dbSlowQueries.inc({ model, action });
			logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
		}
	} catch (err) {
		// swallow metric errors
	}
});

export default prisma;
