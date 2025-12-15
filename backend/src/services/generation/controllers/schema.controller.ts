import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import prisma from "../../../config/database";
import { logger } from "../../../shared/utils/logger";
import AppError from "../../../shared/errors/app-error";

export class SchemaController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const { name, description, fields, tier } = req.body;
      const schema = await (prisma as any).datasetSchema.create({
        data: { userId, name, description, fields, tier },
      });
      res.status(201).json({ success: true, schema });
    } catch (error: any) {
      logger.error("Schema create error:", error);
      return next(new AppError("schema_create_failed", "Failed to create schema", 500, { originalMessage: error?.message }));
    }
  }
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const schemas = await (prisma as any).datasetSchema.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, schemas });
    } catch (error: any) {
      logger.error("Get schemas error:", error);
      return next(new AppError("schema_get_failed", "Failed to get schemas", 500, { originalMessage: error?.message }));
    }
  }
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await (prisma as any).datasetSchema.findMany({
        where: { isTemplate: true },
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, templates });
    } catch (error: any) {
      logger.error("Get templates error:", error);
      return next(new AppError("schema_get_templates_failed", "Failed to get templates", 500, { originalMessage: error?.message }));
    }
  }
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const isAdmin = req.user.isAdmin;
      const id = req.params.id;
      const { name, description, fields, tier, isTemplate } = req.body;

      const existing = await (prisma as any).datasetSchema.findUnique({
        where: { id },
      });
      if (!existing) return res.status(404).json({ error: "Schema not found" });
      if (existing.userId !== userId && !isAdmin)
        return res.status(403).json({ error: "Forbidden" });

      const schema = await (prisma as any).datasetSchema.update({
        where: { id },
        data: { name, description, fields, tier, isTemplate },
      });
      res.json({ success: true, schema });
    } catch (error: any) {
      logger.error("Schema update error:", error);
      return next(new AppError("schema_update_failed", "Failed to update schema", 500, { originalMessage: error?.message }));
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const isAdmin = req.user.isAdmin;
      const id = req.params.id;

      const existing = await (prisma as any).datasetSchema.findUnique({
        where: { id },
      });
      if (!existing) return res.status(404).json({ error: "Schema not found" });
      if (existing.userId !== userId && !isAdmin)
        return res.status(403).json({ error: "Forbidden" });

      await (prisma as any).datasetSchema.delete({ where: { id } });
      res.json({ success: true });
    } catch (error: any) {
      logger.error("Schema delete error:", error);
      return next(new AppError("schema_delete_failed", "Failed to delete schema", 500, { originalMessage: error?.message }));
    }
  }
}
