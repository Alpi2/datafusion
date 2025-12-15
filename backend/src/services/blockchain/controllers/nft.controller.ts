import { Request, Response } from "express";
import { logger } from "../../../shared/utils/logger";

export class NFTController {
  async mint(req: Request, res: Response) {
    try {
      // TODO: enqueue NFT mint job via queue
      res.json({ success: true, message: "NFT mint queued" });
    } catch (error: any) {
      logger.error("NFT mint error", error);
      res.status(500).json({ error: error.message || "Mint failed" });
    }
  }
}

export default new NFTController();
