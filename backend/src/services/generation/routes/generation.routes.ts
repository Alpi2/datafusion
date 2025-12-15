import { Router } from "express";
import { GenerationController } from "../controllers/generation.controller";
import { SchemaController } from "../controllers/schema.controller";
import { StorageController } from "../controllers/storage.controller";
import { authMiddleware } from "../../auth/middleware/auth.middleware";
import { validateRequest } from "../../auth/middleware/validation.middleware";
import { z } from "zod";

const CreateGenerationSchema = z.object({
  prompt: z.string().min(10).max(1000),
  tier: z.enum(["basic", "workflow", "production"]),
  schema: z.any().optional(),
  aiModels: z.array(z.string()).optional(),
  knowledgeDocumentIds: z.array(z.string().uuid()).optional(),
  chatContext: z.any().optional(),
  validationLevel: z.string().optional(),
  complianceRequirements: z.array(z.string()).optional(),
});

const CreateSchemaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  fields: z.any(),
  tier: z.string().optional(),
});

const ValidateSchema = z.object({
  datasetId: z.string().optional(),
  data: z.array(z.any()).optional(),
  schema: z.any().optional(),
  validationLevel: z
    .enum(["standard", "enhanced", "enterprise", "regulatory"])
    .optional(),
  complianceRequirements: z.array(z.string()).optional(),
});

const PreviewSchema = z.object({
  prompt: z.string().min(1).max(2000),
  tier: z.enum(["basic", "workflow", "production"]).optional(),
  schema: z.any().optional(),
  rowCount: z.number().int().min(1).max(50).optional(),
});

export function createGenerationRoutes(
  generationController: GenerationController
): Router {
  const router = Router();
  const schemaController = new SchemaController();
  const storageController = new StorageController();

  // Generation endpoints
  router.post(
    "/create",
    authMiddleware,
    validateRequest(CreateGenerationSchema),
    generationController.create.bind(generationController)
  );

  router.get(
    "/status/:jobId",
    authMiddleware,
    generationController.getStatus.bind(generationController)
  );

  router.get(
    "/history",
    authMiddleware,
    generationController.getHistory.bind(generationController)
  );

  router.post(
    "/cancel/:jobId",
    authMiddleware,
    generationController.cancel.bind(generationController)
  );

  // Synchronous validation endpoint (does not enqueue a generation job)
  router.post(
    "/validate",
    authMiddleware,
    validateRequest(ValidateSchema),
    generationController.validate.bind(generationController)
  );

  // Lightweight preview/estimate endpoint
  router.post(
    "/preview",
    authMiddleware,
    validateRequest(PreviewSchema),
    generationController.preview?.bind(generationController)
  );

  // Schema endpoints
  router.post(
    "/schema/build",
    authMiddleware,
    validateRequest(CreateSchemaSchema),
    schemaController.create.bind(schemaController)
  );

  router.get(
    "/schema",
    authMiddleware,
    schemaController.getAll.bind(schemaController)
  );

  router.put(
    "/schema/:id",
    authMiddleware,
    validateRequest(CreateSchemaSchema),
    schemaController.update.bind(schemaController)
  );

  router.delete(
    "/schema/:id",
    authMiddleware,
    schemaController.delete.bind(schemaController)
  );

  router.get(
    "/templates",
    schemaController.getTemplates.bind(schemaController)
  );

  // Storage endpoints
  router.post(
    "/storage/presign",
    authMiddleware,
    storageController.getPresignedUploadUrl.bind(storageController)
  );

  router.get(
    "/storage/download/:fileId",
    authMiddleware,
    storageController.getPresignedDownloadUrl.bind(storageController)
  );

  return router;
}
