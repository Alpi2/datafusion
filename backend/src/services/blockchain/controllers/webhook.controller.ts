import { Request, Response, NextFunction } from "express";
import { logger } from "../../../shared/utils/logger";
import AppError from "../../../shared/errors/app-error";

export class WebhookController {
    try {
      // Process external webhook events (e.g., Pinata, etherscan webhook)
      const event = req.body;
      logger.info("Received webhook", event);
      res.json({ success: true });
    } catch (error: any) {
      logger.error("Webhook handling failed", error);
      return next(new AppError("webhook_failed", error.message || "Webhook failed", 500, { originalMessage: error.message }));
    }
  }
}

export default new WebhookController();
