import { Request, Response, NextFunction } from "express";
import earningsService from "../services/earnings.service";

export const getEarningsSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const result = await earningsService.getSummary(userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getEarningsByDataset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const result = await earningsService.getByDataset(userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getEarningsByType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const result = await earningsService.getByType(userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getEarningsTimeSeries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const period = (req.query.period as string) || "7d";

    const result = await earningsService.getTimeSeries(userId, period);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const recordEarning = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body as any;
    if (
      !payload ||
      !payload.userId ||
      typeof payload.amount === "undefined" ||
      !payload.type
    ) {
      return res
        .status(400)
        .json({ error: "userId, amount and type are required" });
    }

    const created = await earningsService.recordEarning(payload);
    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
};

export default {
  getEarningsSummary,
  getEarningsByDataset,
  getEarningsByType,
  getEarningsTimeSeries,
  recordEarning,
};
