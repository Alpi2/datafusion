import { Job } from "bullmq";
import { GenerationJobData } from "../queue/generation.queue";
import { OpenAIService } from "../../ai/openai.service";
import { EnsembleService } from "../../ai/ensemble.service";
import { EmbeddingsService } from "../../embeddings/embeddings.service";
import { ValidationService } from "../../validation/validation.service";
import { ComplianceService } from "../../validation/compliance.service";
import { StorageService } from "../../storage/storage.service";
import prisma from "../../../config/database";
import { logger } from "../../../shared/utils/logger";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import { SocketService } from "../socket/socket.service";
import {
  generationJobDurationSeconds,
  generationJobSuccess,
  generationJobFailure,
} from "../../../shared/metrics/metrics";

export class GenerationWorker {
  private openAI: OpenAIService;
  private ensemble: EnsembleService;
  private embeddings: EmbeddingsService;
  private validation: ValidationService;
  private compliance: ComplianceService;
  private storage: StorageService;
  private socketService: SocketService;
  constructor(socketService: SocketService) {
    this.openAI = new OpenAIService();
    this.ensemble = new EnsembleService();
    this.embeddings = new EmbeddingsService();
    this.validation = new ValidationService();
    this.compliance = new ComplianceService();
    this.storage = new StorageService();
    this.socketService = socketService;
  }
  async process(job: Job<GenerationJobData>): Promise<void> {
    const {
      jobId,
      userId,
      prompt,
      tier,
      schema,
      aiModels,
      validationLevel,
      complianceRequirements,
      knowledgeDocumentIds,
      chatContext,
    } = job.data;
    const tierLabel = job.data.tier || "unknown";
    const endTimer = generationJobDurationSeconds.startTimer({ tier: tierLabel });
    try {
      await this.updateJobStatus(
        jobId,
        "processing",
        0,
        "Initializing generation..."
      );
      // Step 1: Get knowledge context if documents provided
      let knowledgeContext = "";
      if (knowledgeDocumentIds && knowledgeDocumentIds.length > 0) {
        await this.updateJobStatus(
          jobId,
          "processing",
          5,
          "Loading knowledge context..."
        );
        // Pass the provided document ids through so embeddings service can build context
        knowledgeContext = await this.embeddings.getKnowledgeContext(
          userId,
          prompt,
          knowledgeDocumentIds
        );
      }
      // Step 2: Generate data with AI
      await this.updateJobStatus(
        jobId,
        "processing",
        20,
        "Generating synthetic data..."
      );

      const rowCount = this.getRowCountForTier(tier);
      let data: any[];
      let consensusScore = 100;
      if (tier === "basic" || aiModels.length === 1) {
        // Single model generation
        const response = await this.openAI.generateDataset({
          prompt,
          schema,
          tier: tier as any,
          rowCount,
          knowledgeContext,
        });
        data = response.data;
      } else {
        // Multi-AI consensus (Workflow/Production)
        await this.updateJobStatus(
          jobId,
          "processing",
          30,
          "Running multi-AI consensus..."
        );
        const result = await this.ensemble.generateWithConsensus(
          {
            prompt,
            schema,
            tier: tier as any,
            rowCount,
            knowledgeContext,
          },
          aiModels
        );
        data = result.data;
        consensusScore = result.consensusScore;
      }
      // Step 3: Advanced validation
      let validationReport = null;
      if (validationLevel && tier !== "basic") {
        await this.updateJobStatus(
          jobId,
          "processing",
          60,
          "Running validation pipeline..."
        );
        validationReport = await this.validation.validateDataset(
          data,
          schema,
          validationLevel as any
        );
        if (!validationReport.isValid) {
          throw new Error(
            `Validation failed: ${validationReport.errors.join(", ")}`
          );
        }
      }
      // Step 4: Compliance checking
      let complianceReport = null;
      if (complianceRequirements && complianceRequirements.length > 0) {
        await this.updateJobStatus(
          jobId,
          "processing",
          75,
          "Checking compliance..."
        );
        complianceReport = await this.compliance.checkCompliance(
          data,
          complianceRequirements
        );
        const nonCompliant = complianceReport.filter((r) => !r.compliant);
        if (nonCompliant.length > 0) {
          logger.warn(
            `Compliance issues detected: ${nonCompliant
              .map((r) => r.standard)
              .join(", ")}`
          );
        }
      }
      // Step 5: Format and save
      await this.updateJobStatus(
        jobId,
        "processing",
        85,
        "Formatting dataset..."
      );
      const fileName = `${userId}/${jobId}.csv`;
      const filePath = await this.saveAsCSV(data, fileName);
      // Step 6: Upload to storage
      await this.updateJobStatus(
        jobId,
        "processing",
        92,
        "Uploading to storage..."
      );
      const fileBuffer = fs.readFileSync(filePath);
      await this.storage.uploadFile(fileName, fileBuffer, "text/csv");
      fs.unlinkSync(filePath);
      const resultUrl = await this.storage.getPresignedUrl(fileName, 86400);
      // Calculate final quality score
      const qualityScore = this.calculateQualityScore(
        data,
        tier,
        consensusScore,
        validationReport?.score
      );
      // Complete job
      await this.updateJobStatus(
        jobId,
        "completed",
        100,
        "Generation complete!",
        resultUrl,
        qualityScore,
        data.length,
        fileBuffer.length
      );
      generationJobSuccess.inc({ tier: tierLabel });
      endTimer();
      // Update job with reports
      await (prisma as any).generationJob.update({
        where: { id: jobId },
        data: {
          validationReport: validationReport as any,
          complianceReport: complianceReport as any,
          knowledgeDocumentIds: knowledgeDocumentIds || [],
        },
      });
      // Create activity log and draft dataset (existing code)
      try {
        await prisma.activityLog.create({
          data: {
            userId,
            action: "dataset_generated",
            details: { jobId, tier, rowCount: data.length },
            createdAt: new Date(),
          } as any,
        });
      } catch (e) {
        logger.warn("Activity log creation failed", e);
      }

      try {
        const title = prompt
          ? prompt.length > 120
            ? prompt.slice(0, 120)
            : prompt
          : `Generated dataset ${jobId}`;
        const description = `Dataset generated from prompt: ${prompt}`;
        const dataset = await prisma.dataset.create({
          data: {
            creatorId: userId,
            title,
            description,
            category: "generated",
            tags: [],
            price: 0,
            qualityScore: qualityScore || 0,
            downloadCount: 0,
            rating: 0,
            reviewCount: 0,
            previewData: data.slice(0, Math.min(3, data.length)),
            fileUrl: resultUrl || "",
            fileSize: BigInt(fileBuffer.length),
            rowCount: data.length,
            columnCount: Object.keys(data[0] || {}).length,
            status: "draft",
          } as any,
        });

        await prisma.userDataset.create({
          data: {
            userId,
            datasetId: dataset.id,
            status: "draft",
            holderCount: 0,
            totalEarnings: 0,
          } as any,
        });
        logger.info(
          `Created draft dataset ${dataset.id} for user ${userId} from job ${jobId}`
        );
        // Emit an additional job progress update that includes the created dataset id
        try {
          this.socketService.emitJobProgress(jobId, {
            status: "completed",
            progress: 100,
            currentStep: "Generation complete!",
            resultUrl,
            qualityScore,
            rowCount: data.length,
            fileSize: fileBuffer.length,
            datasetId: dataset.id,
          });
        } catch (e) {
          logger.warn("Failed to emit dataset-id progress update", e);
        }
      } catch (e) {
        logger.warn("Failed to create draft dataset from generation", e);
      }
      logger.info(`✅ Generation completed: ${jobId}`);
    } catch (error: any) {
      logger.error(`❌ Generation failed: ${jobId}`, error);
      await this.updateJobStatus(
        jobId,
        "failed",
        0,
        "Generation failed",
        undefined,
        undefined,
        undefined,
        undefined,
        error?.message
      );
      generationJobFailure.inc({ tier: tierLabel });
      endTimer();
      throw error;
    }
  }
  private async updateJobStatus(
    jobId: string,
    status: string,
    progress: number,
    currentStep: string,
    resultUrl?: string,
    qualityScore?: number,
    rowCount?: number,
    fileSize?: number,
    errorMessage?: string
  ) {
    await (prisma as any).generationJob.update({
      where: { id: jobId },
      data: {
        status,
        progress,
        currentStep,
        ...(resultUrl && { resultUrl }),
        ...(qualityScore && { qualityScore }),
        ...(rowCount && { rowCount }),
        ...(fileSize && { fileSize: BigInt(fileSize) }),
        ...(errorMessage && { errorMessage }),
        ...(status === "completed" && { completedAt: new Date() }),
      },
    });
    // Emit real-time update via WebSocket
    this.socketService.emitJobProgress(jobId, {
      status,
      progress,
      currentStep,
      resultUrl,
      qualityScore,
      rowCount,
      fileSize,
      errorMessage,
    });
  }
  private getRowCountForTier(tier: string): number {
    const limits = { basic: 100, workflow: 500, production: 1000 };
    return limits[tier as keyof typeof limits] || 100;
  }
  private async saveAsCSV(data: any[], fileName: string): Promise<string> {
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, path.basename(fileName));

    if (data.length === 0) throw new Error("No data to save");
    const headers = Object.keys(data[0]).map((key) => ({
      id: key,
      title: key,
    }));
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    await csvWriter.writeRecords(data);
    return filePath;
  }
  private calculateQualityScore(
    data: any[],
    tier: string,
    consensusScore: number,
    validationScore?: number
  ): number {
    const baseScores = { basic: 85, workflow: 94, production: 99 };
    let score = baseScores[tier as keyof typeof baseScores] || 85;
    // Adjust for consensus
    if (consensusScore < 100) {
      score = score * (consensusScore / 100);
    }
    // Adjust for validation
    if (validationScore) {
      score = (score + validationScore) / 2;
    }
    return Math.round(score);
  }
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
