import winston from "winston";
import fs from "fs";
import path from "path";

const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
  ],
});

export default logger;
export const log = {
  info: (...args: any[]) => console.log("[info]", ...args),
  warn: (...args: any[]) => console.warn("[warn]", ...args),
  error: (...args: any[]) => console.error("[error]", ...args),
};
