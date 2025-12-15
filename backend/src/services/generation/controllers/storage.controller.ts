import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import AppError from "../../../shared/errors/app-error";
import { StorageService } from "../../storage/storage.service";
import { logger } from "../../../shared/utils/logger";

export class StorageController {
  private storage: StorageService;
  constructor() {
    this.storage = new StorageService();
  }
  async getPresignedUploadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const { fileName, contentType } = req.body;
      const objectName = `${userId}/${Date.now()}-${fileName}`;
      const url = await this.storage.getPresignedUploadUrl(objectName);
      res.json({ success: true, uploadUrl: url, objectName });
    } catch (error: any) {
      logger.error("Presigned upload URL error:", error);
      return next(new AppError("storage_presign_upload_failed", "Failed to generate upload URL", 500, { originalMessage: error?.message }));
    }
  }
  async getPresignedDownloadUrl(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      const url = await this.storage.getPresignedUrl(fileId);
      res.json({ success: true, downloadUrl: url });
    } catch (error: any) {
      logger.error("Presigned download URL error:", error);
      return next(new AppError("storage_presign_download_failed", "Failed to generate download URL", 500, { originalMessage: error?.message }));
    }
  }
}
