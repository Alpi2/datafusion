import { Request, Response, NextFunction } from "express";
import gasService from "../services/gas.service";
import { logger } from "../../../shared/utils/logger";
import AppError from "../../../shared/errors/app-error";

export class GasController {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const estimates = await gasService.getEstimates();
      res.json({ success: true, estimates });
    } catch (e) {
      logger.error("GasController.get error", e);
      return next(new AppError("gas_estimates_failed", "Failed to fetch gas estimates", 500, { originalMessage: (e as any)?.message }));
    }
  }
}

export default new GasController();
