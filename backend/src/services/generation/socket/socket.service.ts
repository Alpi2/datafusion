import { Server as SocketIOServer, type Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { EventEmitter } from "events";
import { logger } from "../../../shared/utils/logger";
import { JWTUtil } from "../../auth/utils/jwt.util";
import prisma from "../../../config/database";

type SubscriptionError = {
  channel: string;
  code: string;
  message: string;
};

export class SocketService {
  private io: SocketIOServer;
  private emitter: EventEmitter;
  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:3000",
        credentials: true,
      },
    });
    this.emitter = new EventEmitter();
    // Authenticate sockets during handshake using JWT from `auth.token` or Authorization header
    const jwtUtil = new JWTUtil();
    this.io.use((socket, next) => {
      try {
        // token can be sent in socket.handshake.auth.token (recommended) or in headers
        const tokenFromAuth = (socket.handshake.auth &&
          (socket.handshake.auth as any).token) as string | undefined;
        const authHeader = (socket.handshake.headers &&
          (socket.handshake.headers as any).authorization) as
          | string
          | undefined;
        const tokenFromHeader =
          authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : undefined;
        const token = tokenFromAuth || tokenFromHeader;
        if (!token) return next(new Error("Unauthorized"));
        const payload = jwtUtil.verifyToken(token);
        if (!payload) return next(new Error("Unauthorized"));
        // attach user to socket.data for later access and auto-join user room
        (socket.data as any).user = payload;
        socket.join(`user:${payload.userId}`);
        return next();
      } catch (e) {
        return next(new Error("Unauthorized"));
      }
    });

    // Consider using a named namespace for generation in future: this.io.of('/generation')
    this.io.on("connection", (socket: Socket) => {
      logger.info(
        `🔌 Socket connected: ${socket.id} user=${
          (socket.data as any).user?.userId
        }`
      );

      socket.on("subscribe-job", async (jobId: string) => {
        try {
          const user = (socket.data as any).user;
          if (!user || !user.userId) {
            const err: SubscriptionError = {
              channel: `job:${jobId}`,
              code: "unauthenticated",
              message: "Socket not authenticated",
            };
            socket.emit("subscription:error", err);
            return;
          }
          // verify generation job ownership or viewer permission
          const job = await prisma.generationJob.findUnique({
            where: { id: jobId },
          });
          if (!job) {
            const err: SubscriptionError = {
              channel: `job:${jobId}`,
              code: "not_found",
              message: "Job not found",
            };
            socket.emit("subscription:error", err);
            return;
          }
          // allow if user is owner or user has admin claim in token
          if (
            job.userId !== user.userId &&
            !(
              user &&
              user.roles &&
              user.roles.includes &&
              user.roles.includes("admin")
            )
          ) {
            const err: SubscriptionError = {
              channel: `job:${jobId}`,
              code: "forbidden",
              message: "Not authorized to subscribe to this job",
            };
            socket.emit("subscription:error", err);
            return;
          }
          socket.join(`job:${jobId}`);
          logger.info(
            `📡 Client subscribed to job: ${jobId} (socket=${socket.id} user=${user.userId})`
          );
        } catch (e) {
          logger.warn("subscribe-job handler error", e);
          socket.emit("subscription:error", {
            channel: `job:${jobId}`,
            code: "internal_error",
            message: "Subscription failed",
          });
        }
      });

      socket.on("unsubscribe-job", (jobId: string) => {
        socket.leave(`job:${jobId}`);
      });

      // Generic subscribe/unsubscribe is restricted to a whitelist with ownership checks
      socket.on("subscribe", async (channel: string) => {
        try {
          const user = (socket.data as any).user;
          if (!channel || typeof channel !== "string") return;
          // allow user personal room
          if (channel === `user:${user?.userId}`) {
            socket.join(channel);
            return;
          }

          // Whitelist patterns: job:<id>, bonding:<datasetId>, dataset:<datasetId>
          const jobMatch = channel.match(/^job:(.+)$/);
          if (jobMatch) {
            const jobId = jobMatch[1];
            // reuse subscribe-job logic
            socket.emit("subscription:error", {
              channel,
              code: "use_subscribe_job",
              message: "Use subscribe-job for job subscriptions",
            });
            return;
          }

          const bondingMatch = channel.match(/^bonding:(.+)$/);
          if (bondingMatch) {
            const datasetId = bondingMatch[1];
            // user must be owner (creator) or have purchased the dataset
            if (!user || !user.userId) {
              const err: SubscriptionError = {
                channel,
                code: "unauthenticated",
                message: "Socket not authenticated",
              };
              socket.emit("subscription:error", err);
              return;
            }
            const dataset = await prisma.dataset.findUnique({
              where: { id: datasetId },
            });
            if (!dataset) {
              socket.emit("subscription:error", {
                channel,
                code: "not_found",
                message: "Dataset not found",
              });
              return;
            }
            if (dataset.creatorId === user.userId) {
              socket.join(channel);
              logger.info(
                `📡 Client subscribed to bonding channel: ${channel}`
              );
              return;
            }
            // check purchases
            const purchase = await prisma.purchase.findFirst({
              where: { buyerId: user.userId, datasetId },
            });
            if (purchase) {
              socket.join(channel);
              logger.info(
                `📡 Client subscribed to bonding channel (purchaser): ${channel}`
              );
              return;
            }
            socket.emit("subscription:error", {
              channel,
              code: "forbidden",
              message: "Not authorized for bonding channel",
            });
            return;
          }

          const datasetMatch = channel.match(/^dataset:(.+)$/);
          if (datasetMatch) {
            const datasetId = datasetMatch[1];
            // allow if public dataset or owner
            const dataset = await prisma.dataset.findUnique({
              where: { id: datasetId },
            });
            if (!dataset) {
              socket.emit("subscription:error", {
                channel,
                code: "not_found",
                message: "Dataset not found",
              });
              return;
            }
            if (
              dataset.status === "active" ||
              dataset.creatorId === (user && user.userId)
            ) {
              socket.join(channel);
              logger.info(
                `📡 Client subscribed to dataset channel: ${channel}`
              );
              return;
            }
            socket.emit("subscription:error", {
              channel,
              code: "forbidden",
              message: "Not authorized for dataset channel",
            });
            return;
          }

          // Unknown channel pattern: reject
          socket.emit("subscription:error", {
            channel,
            code: "invalid_channel",
            message: "Channel pattern not allowed",
          });
        } catch (e) {
          logger.warn("Failed to subscribe socket to channel", {
            channel,
            err: e,
          });
          socket.emit("subscription:error", {
            channel,
            code: "internal_error",
            message: "Subscription failed",
          });
        }
      });

      socket.on("unsubscribe", (channel: string) => {
        try {
          socket.leave(channel);
        } catch (e) {
          // noop
        }
      });

      socket.on("disconnect", () => {
        logger.info(`🔌 Socket disconnected: ${socket.id}`);
      });
    });
    logger.info("✅ Socket.io initialized");
  }
  emitJobProgress(jobId: string, data: any) {
    const payload = { jobId, ...(data || {}) };
    this.io.to(`job:${jobId}`).emit("job-progress", payload);
    // If we have a userId in payload, also emit to that user's personal room
    const userId =
      (data && data.userId) ||
      (data && data.user && (data.user.userId || data.user.id));
    if (userId) {
      this.io.to(`user:${userId}`).emit("job-progress", payload);
    }
    // also emit to internal emitter for non-socket clients (SSE)
    try {
      this.emitter.emit(`job:${jobId}`, payload);
    } catch (e) {
      // log but don't crash
      logger.warn("SocketService emitter error:", e);
    }
  }
  getIO(): SocketIOServer {
    return this.io;
  }
  getEmitter(): EventEmitter {
    return this.emitter;
  }
}
