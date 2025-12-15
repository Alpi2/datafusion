import { Router } from "express";
import { BondingController } from "../controllers/bonding.controller";
import { NFTController } from "../controllers/nft.controller";
import { WebhookController } from "../controllers/webhook.controller";
import { GasController } from "../controllers/gas.controller";
import { TransactionsController } from "../controllers/transactions.controller";
import { WalletController } from "../controllers/wallet.controller";
import { authMiddleware } from "../../auth/middleware/auth.middleware";

export function createBlockchainRoutes(
  bondingController: BondingController,
  nftController?: NFTController,
  webhookController?: WebhookController,
  gasController?: GasController,
  transactionsController?: TransactionsController,
  walletController?: WalletController
): Router {
  const router = Router();
  // Bonding Curve endpoints
  router.post(
    "/bonding/deploy",
    authMiddleware,
    bondingController.deploy.bind(bondingController)
  );
  router.post(
    "/bonding/buy/:datasetId",
    authMiddleware,
    bondingController.buy.bind(bondingController)
  );
  router.post(
    "/bonding/sell/:datasetId",
    authMiddleware,
    bondingController.sell.bind(bondingController)
  );
  router.get(
    "/bonding/price/:datasetId",
    bondingController.getPrice.bind(bondingController)
  );
  router.get(
    "/bonding/status/:datasetId",
    bondingController.getStatus.bind(bondingController)
  );
  // NFT endpoints
  if (nftController) {
    router.post(
      "/nft/mint",
      authMiddleware,
      nftController.mint.bind(nftController)
    );
    // If a metadata endpoint is later added to NFTController, mount it here.
  }

  // Blockchain webhook endpoints
  if (webhookController) {
    router.post(
      "/webhooks/chain",
      webhookController.handleEvent.bind(webhookController)
    );
  }

  // Gas estimates
  if (gasController) {
    router.get("/gas", gasController.get.bind(gasController));
  }

  // Transactions / history
  if (transactionsController) {
    router.get(
      "/transactions",
      authMiddleware,
      transactionsController.list.bind(transactionsController)
    );
  }

  // Wallet management (connect additional wallets, list, activate)
  if (walletController) {
    router.get(
      "/wallets",
      authMiddleware,
      walletController.list.bind(walletController)
    );
    router.post(
      "/wallets",
      authMiddleware,
      walletController.register.bind(walletController)
    );
    router.patch(
      "/wallets/:id/activate",
      authMiddleware,
      walletController.activate.bind(walletController)
    );
  }
  return router;
}
