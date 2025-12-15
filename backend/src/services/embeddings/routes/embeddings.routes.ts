import { Router } from "express";
// @ts-ignore - multer types may be missing in some environments
import multer from "multer";
import { EmbeddingsController } from "../controllers/embeddings.controller";
import { authMiddleware } from "../../auth/middleware/auth.middleware";
const router = Router();
const controller = new EmbeddingsController();
// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (
    req: any,
    file: Express.Multer.File,
    cb: (err: Error | null, accept?: boolean) => void
  ) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "application/json",
      "text/csv",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});
// All routes require authentication
router.use(authMiddleware);
router.post("/upload", upload.single("file"), controller.uploadDocument);
router.post("/search", controller.searchDocuments);
router.get("/documents", controller.getUserDocuments);
router.delete("/documents/:id", controller.deleteDocument);
export default router;
