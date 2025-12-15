import { Request, Response, NextFunction } from "express";
import AppError from "../../../shared/errors/app-error";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import { GenerationQueue } from "../queue/generation.queue";
import prisma from "../../../config/database";
import { logger } from "../../../shared/utils/logger";
import ValidationService from "../../validation/validation.service";
import ComplianceService from "../../validation/compliance.service";

export class GenerationController {
  private queue: GenerationQueue;
  constructor(queue: GenerationQueue) {
    this.queue = queue;
  }
  // Lightweight preview/estimate endpoint
  async preview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { prompt, tier = "basic", schema, rowCount = 5 } = req.body;
      // Basic estimate logic (token / cost heuristic)
      const perRowTokenEstimate =
        tier === "basic" ? 15 : tier === "workflow" ? 40 : 100;
      const tokens = perRowTokenEstimate * rowCount;
      const costPerToken =
        tier === "basic" ? 0 : tier === "workflow" ? 0.00002 : 0.00005; // mock pricing
      const estimatedCost = Number((tokens * costPerToken).toFixed(6));
      const baseEta = tier === "basic" ? 15 : tier === "workflow" ? 60 : 300; // seconds base
      const etaSeconds = Math.max(5, Math.round(baseEta * (rowCount / 5)));

      // Attempt to use AI preview path if available
      let previewRows: any[] = [];
      try {
        const { OpenAIService } = await import("../ai/openai.service");
        const ai = new OpenAIService();
        if (typeof ai.generatePreview === "function") {
          previewRows = await ai.generatePreview({
            prompt,
            schema,
            tier,
            rowCount,
          });
        }
      } catch (e) {
        // fallback: generate a simple synthetic preview
        previewRows = [];
        for (let i = 0; i < Math.min(10, rowCount); i++) {
          const row: any = { previewIndex: i + 1 };
          if (schema && Array.isArray(schema.fields)) {
            for (const f of schema.fields) {
              const name =
                f.name ||
                f.field ||
                `col_${Math.random().toString(36).slice(2, 6)}`;
              row[name] = `${name}_sample_${i + 1}`;
            }
          } else {
            row[`col_${i + 1}`] = `sample_${i + 1}`;
          }
          previewRows.push(row);
        }
      }

      return res.json({
        success: true,
        estimate: { tokens, estimatedCost, etaSeconds },
        preview: previewRows,
      });
    } catch (error: any) {
      logger.error("Preview endpoint error:", error);
      return next(new AppError("generation_preview_failed", "Preview failed", 500, { originalMessage: error?.message }));
    }
  }
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const {
        prompt,
        tier,
        schema,
        aiModels,
        validationLevel,
        complianceRequirements,
        knowledgeDocumentIds,
        chatContext,
      } = req.body;
      // Create job record in DB
      const job = await (prisma as any).generationJob.create({
        data: {
          userId,
          prompt,
          tier,
          schema,
          aiModels: aiModels || ["gpt-4"],
          validationLevel,
          complianceRequirements: complianceRequirements || [],
          knowledgeDocumentIds: knowledgeDocumentIds || [],
          chatContext: chatContext || null,
          status: "pending",
          progress: 0,
        },
      });
      // Add to queue
      await this.queue.addJob({
        jobId: job.id,
        userId,
        prompt,
        tier,
        schema,
        aiModels: aiModels || ["gpt-4"],
        validationLevel,
        complianceRequirements,
        knowledgeDocumentIds: knowledgeDocumentIds || [],
        chatContext: chatContext || null,
      });
      res.status(201).json({
        success: true,
        jobId: job.id,
        message: "Generation job created",
      });
    } catch (error: any) {
      logger.error("Generation create error:", error);
      return next(new AppError("generation_create_failed", "Failed to create generation job", 500, { originalMessage: error?.message }));
    }
  }
  async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const userId = req.user.userId;
      const job = await (prisma as any).generationJob.findFirst({
        where: { id: jobId, userId },
      });
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          currentStep: job.currentStep,
          resultUrl: job.resultUrl,
          qualityScore: job.qualityScore,
          rowCount: job.rowCount,
          fileSize: job.fileSize?.toString(),
          errorMessage: job.errorMessage,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        },
      });
    } catch (error: any) {
      logger.error("Get status error:", error);
      return next(new AppError("generation_get_status_failed", "Failed to get job status", 500, { originalMessage: error?.message }));
    }
  }
  async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const { limit = 10, offset = 0 } = req.query;
      const jobs = await (prisma as any).generationJob.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });
      const total = await (prisma as any).generationJob.count({
        where: { userId },
      });
      res.json({
        success: true,
        jobs: jobs.map((job: any) => ({
          id: job.id,
          prompt: (job.prompt || "").substring(0, 100) + "...",
          tier: job.tier,
          status: job.status,
          progress: job.progress,
          qualityScore: job.qualityScore,
          createdAt: job.createdAt,
        })),
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error: any) {
      logger.error("Get history error:", error);
      return next(new AppError("generation_get_history_failed", "Failed to get job history", 500, { originalMessage: error?.message }));
    }
  }
  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const userId = req.user.userId;
      const job = await (prisma as any).generationJob.findFirst({
        where: { id: jobId, userId },
      });
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      if (job.status === "completed" || job.status === "failed") {
        return res
          .status(400)
          .json({ error: "Cannot cancel completed or failed job" });
      }
      await (prisma as any).generationJob.update({
        where: { id: jobId },
        data: { status: "cancelled", currentStep: "Cancelled by user" },
      });
      res.json({ success: true, message: "Job cancelled" });
    } catch (error: any) {
      logger.error("Cancel job error:", error);
      return next(new AppError("generation_cancel_failed", "Failed to cancel job", 500, { originalMessage: error?.message }));
    }
  }

  async validate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const {
        datasetId,
        data,
        schema,
        validationLevel = "standard",
        complianceRequirements = [],
      } = req.body;

      let datasetData: any[] | undefined = undefined;

      if (datasetId) {
        const ds = await (prisma as any).dataset.findFirst({
          where: { id: datasetId, creatorId: userId },
        });
        if (!ds) return res.status(404).json({ error: "Dataset not found" });
        datasetData = ds.previewData || ds.sampleData || [];
      } else if (Array.isArray(data)) {
        datasetData = data;
      } else {
        return res
          .status(400)
          .json({ error: "Either datasetId or data array must be provided" });
      }

      const validationResult = await ValidationService.validateDataset(
        datasetData as any[],
        schema,
        validationLevel
      );

      let complianceResults: any[] = [];
      if (
        Array.isArray(complianceRequirements) &&
        complianceRequirements.length > 0
      ) {
        complianceResults = await ComplianceService.checkCompliance(
          datasetData as any[],
          complianceRequirements
        );
      }

      res.json({
        success: true,
        validation: validationResult,
        compliance: complianceResults,
      });
    } catch (error: any) {
      logger.error("Validation endpoint error:", error);
      return next(new AppError("generation_validate_failed", error?.message || "Validation failed", 500, { originalMessage: error?.message }));
    }
  }
}
