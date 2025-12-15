import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import { RAGService } from "../rag.service";
import { logger } from "../../../shared/utils/logger";
import { z } from "zod";
const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

export class ChatController {
  private service: RAGService;
  constructor() {
    this.service = new RAGService();
  }
  chatWithDataset = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { id: datasetId } = req.params;
      const { message, conversationHistory } = chatSchema.parse(req.body);
      const response = await this.service.chatWithDataset(
        userId,
        datasetId,
        message,
        conversationHistory
      );
      res.json({
        success: true,
        response,
      });
    } catch (error: any) {
      logger.error("Chat with dataset failed:", error);
      res.status(400).json({ error: error.message });
    }
  };
  detectPatterns = async (req: Request, res: Response) => {
    try {
      const { id: datasetId } = req.params;
      const patterns = await this.service.detectPatterns(datasetId);
      res.json({
        success: true,
        patterns,
      });
    } catch (error: any) {
      logger.error("Pattern detection failed:", error);
      res.status(500).json({ error: error.message });
    }
  };
  detectAnomalies = async (req: Request, res: Response) => {
    try {
      const { id: datasetId } = req.params;
      const anomalies = await this.service.detectAnomalies(datasetId);
      res.json({
        success: true,
        anomalies,
      });
    } catch (error: any) {
      logger.error("Anomaly detection failed:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new ChatController();
