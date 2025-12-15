import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Web3Util } from "../utils/web3.util";
import { JWTUtil } from "../utils/jwt.util";
import { RedisUtil } from "../utils/redis.util";
import { randomBytes } from "crypto";
import { logger } from "../../../shared/utils/logger";
const prisma = new PrismaClient();
const web3Util = new Web3Util();
const jwtUtil = new JWTUtil();
const redisUtil = new RedisUtil();
export class WalletController {
  /**
   * POST /api/auth/wallet/connect
   * Wallet bağlantısı için nonce oluştur
   */
  async connect(req: Request, res: Response) {
    try {
      const { walletAddress } = req.body;
      // Wallet adresini validate et
      if (!web3Util.isValidAddress(walletAddress)) {
        return res.status(400).json({ error: "Geçersiz wallet adresi" });
      }
      // Nonce oluştur
      const nonce = randomBytes(32).toString("hex");

      // Redis'e kaydet (5 dakika TTL)
      await redisUtil.setNonce(walletAddress, nonce);
      // İmzalanacak mesajı oluştur
      const message = web3Util.generateNonceMessage(walletAddress, nonce);
      return res.json({
        success: true,
        data: {
          nonce,
          message,
          expiresIn: 300, // 5 dakika
        },
      });
    } catch (error) {
      logger.error("Wallet connect error:", error);
      return res.status(500).json({ error: "Sunucu hatası" });
    }
  }
  /**
   * POST /api/auth/wallet/verify
   * İmzayı doğrula ve JWT token oluştur
   */
  async verify(req: Request, res: Response) {
    try {
      const { walletAddress, signature, nonce } = req.body;
      // Nonce'u Redis'ten al ve sil
      const storedNonce = await redisUtil.getNonceAndDelete(walletAddress);

      if (storedNonce === null && !redisUtil.isConnected) {
        // Redis error/fallback — log and deny access
        logger.warn(
          "Redis unavailable while fetching nonce; denying verification"
        );
        return res
          .status(401)
          .json({ error: "Geçersiz veya süresi dolmuş nonce" });
      }

      if (!storedNonce || storedNonce !== nonce) {
        return res
          .status(401)
          .json({ error: "Geçersiz veya süresi dolmuş nonce" });
      }
      // Mesajı yeniden oluştur
      const message = web3Util.generateNonceMessage(walletAddress, nonce);
      // İmzayı doğrula
      const isValid = await web3Util.verifySignature(
        walletAddress,
        message,
        signature
      );

      if (!isValid) {
        return res.status(401).json({ error: "Geçersiz imza" });
      }
      // Kullanıcıyı bul veya oluştur
      let user = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
      });
      const isNewUser = !user;
      if (!user) {
        // Yeni kullanıcı - geçici username ile oluştur
        user = await prisma.user.create({
          data: {
            walletAddress: walletAddress.toLowerCase(),
            username: `user_${walletAddress.slice(2, 10)}`, // Geçici
            inflBalance: "0",
          },
        });
      }
      // $INFL bakiyesini güncelle
      const inflBalance = await web3Util.getInflBalance(walletAddress);
      await prisma.user.update({
        where: { id: user.id },
        data: { inflBalance },
      });
      // JWT token oluştur
      const token = jwtUtil.generateToken({
        userId: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
      });
      // Session oluştur
      const expiresAt = jwtUtil.getTokenExpiry(token);
      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken: token,
          expiresAt:
            expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      // Redis'e de kaydet (hızlı erişim için)
      await redisUtil.setSession(token, user.id, 7 * 24 * 60 * 60); // 7 gün
      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            walletAddress: user.walletAddress,
            username: user.username,
            inflBalance: user.inflBalance.toString(),
            isNewUser,
          },
        },
      });
    } catch (error) {
      logger.error("Wallet verify error:", error);
      return res.status(500).json({ error: "Sunucu hatası" });
    }
  }
  /**
   * GET /api/auth/token/balance/:walletAddress
   * $INFL token bakiyesini getir
   */
  async getTokenBalance(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      if (!web3Util.isValidAddress(walletAddress)) {
        return res.status(400).json({ error: "Geçersiz wallet adresi" });
      }
      const balance = await web3Util.getInflBalance(walletAddress);
      return res.json({
        success: true,
        data: {
          walletAddress,
          inflBalance: balance,
        },
      });
    } catch (error) {
      logger.error("Get balance error:", error);
      return res.status(500).json({ error: "Bakiye alınamadı" });
    }
  }
}
