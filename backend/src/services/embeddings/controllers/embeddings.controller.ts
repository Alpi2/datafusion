import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import { EmbeddingsService } from "../embeddings.service";
import { logger } from "../../../shared/utils/logger";
import { z } from "zod";
import prisma from "../../../config/database";

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional(),
});

export class EmbeddingsController {
  private service: EmbeddingsService;
  constructor() {
    this.service = new EmbeddingsService();
  }
  uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const doc = await this.service.uploadAndProcessDocument(userId, file);
      res.json({
        success: true,
        document: {
          id: doc.id,
          filename: doc.filename,
          fileSize: Number(doc.fileSize),
          processed: doc.processed,
        },
      });
    } catch (error: any) {
      logger.error("Upload document failed:", error);
      res.status(500).json({ error: error.message });
    }
  };
  searchDocuments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { query, limit } = searchSchema.parse(req.body);
      const results = await this.service.searchSimilarDocuments(
        userId,
        query,
        limit
      );
      res.json({
        success: true,
        results: results.map((r) => ({
          id: r.id,
          filename: r.filename,
          similarity: r.similarity,
          metadata: r.metadata,
          preview: r.content_text?.slice(0, 200),
        })),
      });
    } catch (error: any) {
      logger.error("Search documents failed:", error);
      res.status(400).json({ error: error.message });
    }
  };
  getUserDocuments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const docs = await (prisma as any).knowledgeDocument.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          filename: true,
          fileType: true,
          fileSize: true,
          processed: true,
          metadata: true,
          createdAt: true,
        },
      });
      res.json({
        success: true,
        documents: docs.map((d: any) => ({
          ...d,
          fileSize: Number(d.fileSize),
        })),
      });
    } catch (error: any) {
      logger.error("Get user documents failed:", error);
      res.status(500).json({ error: error.message });
    }
  };
  deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const doc = await (prisma as any).knowledgeDocument.findFirst({
        where: { id, userId },
      });
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      await (prisma as any).knowledgeDocument.delete({ where: { id } });
      res.json({ success: true });
    } catch (error: any) {
      logger.error("Delete document failed:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new EmbeddingsController();
