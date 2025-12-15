import { Request, Response, NextFunction } from "express";
import prisma from "../../../config/database";
import AppError from "../../../shared/errors/app-error";

function isValidUUID(id?: string) {
  if (!id) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    id
  );
}

export const validateUserId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params as { userId?: string };
  if (!userId || !isValidUUID(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  // If auth middleware attaches user to req, enforce owner or admin
  const authUser = (req as any).user as { id?: string; isAdmin?: boolean } | undefined;
  if (authUser && authUser.id && authUser.id !== userId && !authUser.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

export const validatePublishDataset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { datasetId, deploymentType } = req.body as any;
  if (!datasetId || typeof datasetId !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid request body: datasetId is required" });
  }
  if (deploymentType && !["public", "private"].includes(deploymentType)) {
    return res.status(400).json({ error: "Invalid deploymentType" });
  }

  // Ensure auth user exists
  const authUser = (req as any).user as { id?: string; isAdmin?: boolean } | undefined;
  if (!authUser || !authUser.id) return res.status(401).json({ error: "Unauthorized" });

  try {
    const ds = await prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!ds) return res.status(404).json({ error: "Dataset not found" });

    if (ds.creatorId !== authUser.id && !authUser.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden: cannot publish a dataset you do not own" });
    }
  } catch (e) {
    console.warn("validatePublishDataset error", e);
    return next(new AppError("validate_publish_error", "Internal error validating dataset", 500, { originalMessage: (e as any)?.message }));
  }

  next();
};
