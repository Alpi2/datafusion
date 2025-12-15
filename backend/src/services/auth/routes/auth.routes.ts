import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";
import { ProfileController } from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  apiRateLimiter,
  authRateLimiter,
} from "../../../shared/middleware/rateLimit.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import {
  WalletConnectRequestSchema,
  WalletVerifyRequestSchema,
  ProfileCreateRequestSchema,
} from "../types/auth.types";

const router = Router();
const walletController = new WalletController();
const profileController = new ProfileController();

// Wallet endpoints (use stricter auth rate limiter)
router.post(
  "/wallet/connect",
  authRateLimiter,
  validateRequest(WalletConnectRequestSchema),
  walletController.connect.bind(walletController)
);
router.post(
  "/wallet/verify",
  authRateLimiter,
  validateRequest(WalletVerifyRequestSchema),
  walletController.verify.bind(walletController)
);
router.get(
  "/token/balance/:walletAddress",
  walletController.getTokenBalance.bind(walletController)
);

// Profile endpoints (authenticated) — protected by auth rate limiter
router.post(
  "/profile/create",
  authRateLimiter,
  authMiddleware,
  validateRequest(ProfileCreateRequestSchema),
  profileController.create.bind(profileController)
);
router.get(
  "/profile/me",
  authRateLimiter,
  authMiddleware,
  profileController.getMe.bind(profileController)
);
router.get(
  "/profile/:walletAddress",
  profileController.getByWallet.bind(profileController)
);

// Logout endpoint
router.post("/logout", authRateLimiter, authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      const { RedisUtil } = await import("../utils/redis.util");
      const redisUtil = new RedisUtil();
      await redisUtil.deleteSession(token);
    }
    res.json({ success: true, message: "Çıkış yapıldı" });
  } catch (error) {
    res.status(500).json({ error: "Çıkış yapılamadı" });
  }
});

export default router;
