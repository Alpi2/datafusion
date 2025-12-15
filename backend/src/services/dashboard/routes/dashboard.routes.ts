import { Router } from "express";
import {
  authMiddleware,
  requireRole,
  requireScope,
} from "../../auth/middleware/auth.middleware";
import {
  validateUserId,
  validatePublishDataset,
} from "../middleware/validation.middleware";

export function createDashboardRoutes(
  dashboardController: any,
  earningsController: any
) {
  const router = Router();

  // Dashboard stats & datasets (all require auth)
  router.get(
    "/stats/:userId",
    authMiddleware,
    validateUserId,
    dashboardController.getUserStats.bind(dashboardController)
  );
  router.get(
    "/datasets/:userId",
    authMiddleware,
    validateUserId,
    dashboardController.getUserDatasets.bind(dashboardController)
  );
  router.get(
    "/datasets/:userId/:datasetId",
    authMiddleware,
    dashboardController.getDatasetById.bind(dashboardController)
  );
  router.post(
    "/datasets/publish",
    authMiddleware,
    validatePublishDataset,
    dashboardController.publishDataset.bind(dashboardController)
  );
  router.put(
    "/datasets/:datasetId",
    authMiddleware,
    dashboardController.updateDataset.bind(dashboardController)
  );
  router.delete(
    "/datasets/:datasetId",
    authMiddleware,
    dashboardController.deleteDataset.bind(dashboardController)
  );
  router.get(
    "/activity/:userId",
    authMiddleware,
    validateUserId,
    dashboardController.getActivityFeed.bind(dashboardController)
  );

  // Earnings endpoints
  router.get(
    "/earnings/:userId",
    authMiddleware,
    validateUserId,
    earningsController.getEarningsSummary.bind(earningsController)
  );
  router.get(
    "/earnings/:userId/by-dataset",
    authMiddleware,
    validateUserId,
    earningsController.getEarningsByDataset.bind(earningsController)
  );
  router.get(
    "/earnings/:userId/by-type",
    authMiddleware,
    validateUserId,
    earningsController.getEarningsByType.bind(earningsController)
  );
  router.get(
    "/earnings/:userId/timeseries",
    authMiddleware,
    validateUserId,
    earningsController.getEarningsTimeSeries.bind(earningsController)
  );

  return router;
}

export function createAnalyticsRoutes(analyticsController: any) {
  const router = Router();

  // Analytics endpoints (require auth except platform stats)
  router.get(
    "/performance/:userId",
    authMiddleware,
    analyticsController.getPerformanceMetrics.bind(analyticsController)
  );
  router.get(
    "/comparison/:userId",
    authMiddleware,
    analyticsController.getDatasetComparison.bind(analyticsController)
  );
  router.get(
    "/categories/:userId",
    authMiddleware,
    analyticsController.getCategoryDistribution.bind(analyticsController)
  );
  router.get(
    "/engagement/:userId",
    authMiddleware,
    analyticsController.getUserEngagement.bind(analyticsController)
  );
  router.get(
    "/platform",
    analyticsController.getPlatformStats.bind(analyticsController)
  ); // Public
  // Export analytics is an elevated operation — restrict to admins
  router.get(
    "/export/:userId",
    authMiddleware,
    requireRole("admin"),
    analyticsController.exportAnalytics.bind(analyticsController)
  );

  return router;
}
