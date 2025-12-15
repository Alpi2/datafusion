import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";

const jwtSecret = process.env.JWT_SECRET || "";

if (NODE_ENV !== "development") {
  // In non-development environments, JWT_SECRET must be provided and non-empty
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      "FATAL: JWT_SECRET must be set to a strong secret (>=32 chars) in non-development environments"
    );
  }
}

export const env = {
  port: process.env.PORT || "4000",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwtSecret,
  nodeEnv: NODE_ENV,
  allowedOrigins: process.env.ALLOWED_ORIGINS || "",
};
