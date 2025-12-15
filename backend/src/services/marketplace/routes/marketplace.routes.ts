import { Router } from "express";
import { MarketplaceController } from "../controllers/marketplace.controller";
import { WebhookController } from "../controllers/webhook.controller";
import { authMiddleware } from "../../auth/middleware/auth.middleware";
import { validateRequest } from "../../auth/middleware/validation.middleware";
import { z } from "zod";
import express from "express";

const toNumber = (val: unknown) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
};

const SearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priceMin: z.preprocess(toNumber, z.number().optional()),
  priceMax: z.preprocess(toNumber, z.number().optional()),
  qualityMin: z.preprocess(toNumber, z.number().optional()),
  downloadsMin: z.preprocess(toNumber, z.number().optional()),
  sortBy: z.enum(["trending", "rating", "recent", "price"]).optional(),
  page: z.preprocess(toNumber, z.number().optional()),
  limit: z.preprocess(toNumber, z.number().optional()),
});

const ReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export function createMarketplaceRoutes(
  marketplaceController: MarketplaceController,
  webhookController: WebhookController
): Router {
  const router = Router();
  // Public endpoints
  router.get(
    "/datasets",
    marketplaceController.listDatasets.bind(marketplaceController)
  );
  router.post(
    "/search",
    validateRequest(SearchSchema),
    marketplaceController.searchDatasets.bind(marketplaceController)
  );
  router.get(
    "/datasets/:id",
    marketplaceController.getDatasetById.bind(marketplaceController)
  );
  router.get(
    "/categories",
    marketplaceController.getCategories.bind(marketplaceController)
  );
  // Protected endpoints
  router.post(
    "/purchase/:datasetId",
    authMiddleware,
    marketplaceController.purchaseDataset.bind(marketplaceController)
  );
  router.get(
    "/datasets/:id/download",
    authMiddleware,
    marketplaceController.downloadDataset.bind(marketplaceController)
  );
  router.post(
    "/review/:datasetId",
    authMiddleware,
    validateRequest(ReviewSchema),
    marketplaceController.createReview.bind(marketplaceController)
  );
  // Wishlist endpoints
  router.get(
    "/wishlist",
    authMiddleware,
    marketplaceController.getWishlist.bind(marketplaceController)
  );
  router.post(
    "/wishlist/:datasetId",
    authMiddleware,
    marketplaceController.toggleWishlist.bind(marketplaceController)
  );
  // Webhook (raw body required)
  router.post(
    "/webhooks/stripe",
    express.raw({ type: "application/json" }),
    webhookController.handleStripeWebhook.bind(webhookController)
  );
  return router;
}
