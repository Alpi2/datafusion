import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller';
import { connectWallet, getWalletInfo } from '../controllers/wallet.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

router.post('/wallet/connect', requireAuth, connectWallet);
router.get('/wallet', requireAuth, getWalletInfo);

export default router;
