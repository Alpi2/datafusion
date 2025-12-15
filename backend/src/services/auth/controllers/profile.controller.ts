import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth.types";
import { PrismaClient } from "@prisma/client";
import { logger } from "../../../shared/utils/logger";
const prisma = new PrismaClient();
export class ProfileController {
  /**
   * POST /api/auth/profile/create
   * Kullanıcı profili oluştur/güncelle
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.userId; // Auth middleware'den
      const { username, email, bio } = req.body;
      // Username benzersizliğini kontrol et
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      });
      if (existingUser) {
        return res
          .status(409)
          .json({ error: "Bu username zaten kullanılıyor" });
      }
      // Profili güncelle
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          username,
          email: email || null,
          bio: bio || null,
        },
      });
      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            walletAddress: user.walletAddress,
            username: user.username,
            email: user.email,
            bio: user.bio,
            inflBalance: user.inflBalance.toString(),
            reputationScore: user.reputationScore,
          },
        },
      });
    } catch (error) {
      logger.error("Profile create error:", error);
      return res.status(500).json({ error: "Profil oluşturulamadı" });
    }
  }
  /**
   * GET /api/auth/profile/:walletAddress
   * Kullanıcı profilini getir
   */
  async getByWallet(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      const user = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
        select: {
          id: true,
          walletAddress: true,
          username: true,
          email: true,
          bio: true,
          profileImageUrl: true,
          inflBalance: true,
          reputationScore: true,
          createdAt: true,
        },
      });
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      return res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error("Get profile error:", error);
      return res.status(500).json({ error: "Profil getirilemedi" });
    }
  }
  /**
   * GET /api/auth/profile/me
   * Kendi profilini getir (authenticated)
   */
  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          walletAddress: true,
          username: true,
          email: true,
          bio: true,
          profileImageUrl: true,
          inflBalance: true,
          reputationScore: true,
          createdAt: true,
        },
      });
      return res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error("Get me error:", error);
      return res.status(500).json({ error: "Profil getirilemedi" });
    }
  }
}
