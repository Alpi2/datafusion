import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types";
import AppError from "../../../shared/errors/app-error";
import prisma from "../../../config/database";
import { ElasticsearchService } from "../search/elasticsearch.service";
import { StripeService } from "../payment/stripe.service";
import { StorageService } from "../../storage/storage.service";
import { logger } from "../../../shared/utils/logger";
import earningsService from "../../dashboard/services/earnings.service";
import { ensureOwnerOrRole } from "../../auth/middleware/auth.middleware";
export class MarketplaceController {
  private searchService: ElasticsearchService;
  private stripeService: StripeService;
  private storageService: StorageService;
  constructor(
    searchService: ElasticsearchService,
    stripeService: StripeService,
    storageService: StorageService
  ) {
    this.searchService = searchService;
    this.stripeService = stripeService;
    this.storageService = storageService;
  }
  async listDatasets(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        tags,
        priceMin,
        priceMax,
        qualityMin,
        downloadsMin,
        sortBy,
      } = req.query;
      // Helper parsers: accept numbers or numeric strings
      const toNumber = (v: any): number | undefined => {
        if (v === undefined || v === null) return undefined;
        if (typeof v === "number") return v;
        if (typeof v === "string") {
          const n = Number(v);
          return Number.isNaN(n) ? undefined : n;
        }
        return undefined;
      };
      const toInt = (
        v: any,
        fallback: number | undefined = undefined
      ): number | undefined => {
        const n = toNumber(v);
        if (n === undefined) return fallback;
        return Math.floor(n);
      };

      const datasets = await (prisma as any).dataset.findMany({
        where: {
          status: "active",
          ...(category && category !== "All Categories" ? { category } : {}),
          ...(priceMin || priceMax
            ? {
                price: {
                  gte: toNumber(priceMin),
                  lte: toNumber(priceMax),
                },
              }
            : {}),
          ...(qualityMin ? { qualityScore: { gte: toInt(qualityMin) } } : {}),
          ...(downloadsMin
            ? { downloadCount: { gte: toInt(downloadsMin) } }
            : {}),
        },
        include: {
          creator: { select: { username: true, walletAddress: true } },
        },
        orderBy: this.getSortOrder(sortBy as string),
        skip: (toInt(page, 1)! - 1) * toInt(limit, 20)!,
        take: toInt(limit, 20)!,
      });
      const total = await (prisma as any).dataset.count({
        where: { status: "active" },
      });
      res.json({
        success: true,
        datasets: datasets.map((d: any) => this.formatDataset(d)),
        pagination: {
          total,
          page: toInt(page, 1),
          limit: toInt(limit, 20),
          pages: Math.ceil(total / (toInt(limit, 20) || 1)),
        },
      });
    } catch (error: any) {
      logger.error("List datasets error:", error);
      return next(new AppError("marketplace_list_failed", "Failed to list datasets", 500, { originalMessage: error?.message }));
    }
  }
  async searchDatasets(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        query,
        category,
        tags,
        priceMin,
        priceMax,
        qualityMin,
        downloadsMin,
        sortBy,
        page = 1,
        limit = 20,
      } = req.body;
      const toNumber = (v: any): number | undefined => {
        if (v === undefined || v === null) return undefined;
        if (typeof v === "number") return v;
        if (typeof v === "string") {
          const n = Number(v);
          return Number.isNaN(n) ? undefined : n;
        }
        return undefined;
      };
      const toInt = (
        v: any,
        fallback: number | undefined = undefined
      ): number | undefined => {
        const n = toNumber(v);
        if (n === undefined) return fallback;
        return Math.floor(n);
      };

      // Try searching with Elasticsearch; if it fails, fall back to a DB query
      try {
        const result = await this.searchService.search({
          query,
          category,
          tags,
          priceMin: toNumber(priceMin),
          priceMax: toNumber(priceMax),
          qualityMin: toInt(qualityMin),
          downloadsMin: toInt(downloadsMin),
          sortBy,
          page: toInt(page, 1)!,
          limit: toInt(limit, 20)!,
        });

        // Fetch full dataset details from PostgreSQL
        const datasetIds = result.hits.map((hit: any) => hit.id);
        const datasets = await (prisma as any).dataset.findMany({
          where: { id: { in: datasetIds } },
          include: {
            creator: { select: { username: true, walletAddress: true } },
          },
        });
        // Preserve Elasticsearch hit ordering: build a map and reorder results
        const datasetMap = new Map<string, any>();
        for (const d of datasets) {
          datasetMap.set(d.id, d);
        }
        const orderedDatasets: any[] = [];
        for (const id of datasetIds) {
          const record = datasetMap.get(id);
          if (record) orderedDatasets.push(record);
        }

        res.json({
          success: true,
          datasets: orderedDatasets.map((d: any) => this.formatDataset(d)),
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: Math.ceil(result.total / result.limit),
          },
        });
        return;
      } catch (e: any) {
        // Elasticsearch failed (cluster red/unavailable/timeouts). Log and fallback to DB.
        logger.warn("Elasticsearch search failed, falling back to PostgreSQL query", e);
        // Build a Prisma where clause mirroring the filters used by the search
        const whereClause: any = {
          status: "active",
          ...(category && category !== "All Categories" ? { category } : {}),
          ...(priceMin || priceMax
            ? {
                price: {
                  gte: toNumber(priceMin),
                  lte: toNumber(priceMax),
                },
              }
            : {}),
          ...(qualityMin ? { qualityScore: { gte: toInt(qualityMin) } } : {}),
          ...(downloadsMin
            ? { downloadCount: { gte: toInt(downloadsMin) } }
            : {}),
        };

        if (query && String(query).trim() !== "") {
          // Basic text matching against title/description and tag contains
          whereClause.OR = [
            { title: { contains: String(query), mode: "insensitive" } },
            { description: { contains: String(query), mode: "insensitive" } },
            { tags: { has: String(query) } },
          ];
        }

        const datasets = await (prisma as any).dataset.findMany({
          where: whereClause,
          include: {
            creator: { select: { username: true, walletAddress: true } },
          },
          orderBy: this.getSortOrder(sortBy as string),
          skip: (toInt(page, 1)! - 1) * toInt(limit, 20)!,
          take: toInt(limit, 20)!,
        });

        const total = await (prisma as any).dataset.count({ where: whereClause });

        res.json({
          success: true,
          datasets: datasets.map((d: any) => this.formatDataset(d)),
          pagination: {
            total,
            page: toInt(page, 1),
            limit: toInt(limit, 20),
            pages: Math.ceil(total / (toInt(limit, 20) || 1)),
          },
        });
        return;
      }
    } catch (error: any) {
      logger.error("Search datasets error:", error);
      return next(new AppError("marketplace_search_failed", "Failed to search datasets", 500, { originalMessage: error?.message }));
    }
  }
  async getDatasetById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user?.userId;
      const dataset = await (prisma as any).dataset.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              username: true,
              walletAddress: true,
              profileImageUrl: true,
            },
          },
          reviews: {
            include: {
              user: { select: { username: true, profileImageUrl: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
      if (!dataset) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      // Check if user owns this dataset
      let isPurchased = false;
      if (userId) {
        const purchase = await (prisma as any).purchase.findUnique({
          where: {
            buyerId_datasetId: { buyerId: userId, datasetId: id },
          },
        });
        isPurchased = !!purchase;
      }
      res.json({
        success: true,
        dataset: { ...this.formatDataset(dataset), isPurchased },
      });
    } catch (error: any) {
      logger.error("Get dataset error:", error);
      return next(new AppError("marketplace_get_dataset_failed", "Failed to get dataset", 500, { originalMessage: error?.message }));
    }
  }
  async purchaseDataset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { datasetId } = req.params;
      const userId = req.user.userId;
      const dataset = await (prisma as any).dataset.findUnique({
        where: { id: datasetId },
      });
      if (!dataset) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      // Check if already purchased
      const existingPurchase = await (prisma as any).purchase.findUnique({
        where: {
          buyerId_datasetId: { buyerId: userId, datasetId },
        },
      });
      if (existingPurchase) {
        return res.status(400).json({ error: "Dataset already purchased" });
      }
      // Create Stripe payment intent
      const { clientSecret, paymentIntentId } =
        await this.stripeService.createPaymentIntent({
          amount: Math.round(parseFloat(dataset.price.toString()) * 100), // Convert to cents
          currency: "usd",
          metadata: {
            datasetId,
            buyerId: userId,
            datasetTitle: dataset.title,
          },
        });
      res.json({
        success: true,
        clientSecret,
        paymentIntentId,
        amount: parseFloat(dataset.price.toString()),
      });
    } catch (error: any) {
      logger.error("Purchase dataset error:", error);
      return next(new AppError("marketplace_purchase_failed", "Failed to initiate purchase", 500, { originalMessage: error?.message }));
    }
  }
  async downloadDataset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const dataset = await (prisma as any).dataset.findUnique({
        where: { id },
      });
      if (!dataset) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      // Check entitlement (user must be creator or purchaser). Allow admins via ensureOwnerOrRole
      const purchase = await (prisma as any).purchase.findUnique({
        where: {
          buyerId_datasetId: { buyerId: userId, datasetId: id },
        },
      });
      const authUser = req.user;
      const isCreatorOrAdmin = ensureOwnerOrRole(authUser, dataset.creatorId, "admin");
      if (!isCreatorOrAdmin && !purchase) {
        return res
          .status(403)
          .json({ error: "You must purchase this dataset to download it" });
      }
      // If a purchase exists and earnings have not yet been recorded for that purchase,
      // record the earning for the dataset creator. This covers cases where the
      // payment webhook may not have recorded earnings yet (or tests create purchases directly).
      if (purchase) {
        try {
          const existing = await (prisma as any).earning.findFirst({
            where: { source: purchase.id },
          });
          if (!existing) {
            const datasetRecord = dataset as any;
            const creatorId = datasetRecord.creatorId;
            const earningAmount = Number(purchase.pricePaid ?? 0) * 0.3;
            if (creatorId && earningAmount > 0) {
              await earningsService.recordEarning({
                userId: creatorId,
                datasetId: id,
                amount: earningAmount,
                type: "download",
                source: purchase.id,
              } as any);
              logger.info(
                `Recorded earning ${earningAmount} for creator ${creatorId} from purchase ${purchase.id}`
              );
            }
          }
        } catch (e) {
          logger.warn("Failed to record earning on download", e);
        }
      }
      // Generate presigned download URL (24h expiry)
      const downloadUrl = await this.storageService.getPresignedUrl(
        dataset.fileUrl,
        24 * 60 * 60
      );
      // Increment download count
      await (prisma as any).dataset.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });
      res.json({
        success: true,
        downloadUrl,
        expiresIn: 86400, // 24 hours in seconds
      });
    } catch (error: any) {
      logger.error("Download dataset error:", error);
      return next(new AppError("marketplace_download_failed", "Failed to generate download URL", 500, { originalMessage: error?.message }));
    }
  }
  async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { datasetId } = req.params;
      const userId = req.user.userId;
      const { rating, comment } = req.body;
      // Check if user purchased the dataset
      const purchase = await (prisma as any).purchase.findUnique({
        where: {
          buyerId_datasetId: { buyerId: userId, datasetId },
        },
      });
      if (!purchase) {
        return res
          .status(403)
          .json({ error: "You must purchase this dataset to review it" });
      }
      // Create or update review
      const review = await (prisma as any).review.upsert({
        where: {
          userId_datasetId: { userId, datasetId },
        },
        create: {
          userId,
          datasetId,
          rating,
          comment,
        },
        update: {
          rating,
          comment,
        },
      });
      // Recalculate dataset rating
      const reviews = await (prisma as any).review.findMany({
        where: { datasetId },
      });
      const avgRating =
        reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviews.length;
      await (prisma as any).dataset.update({
        where: { id: datasetId },
        data: {
          rating: avgRating,
          reviewCount: reviews.length,
        },
      });
      res.json({ success: true, review });
    } catch (error: any) {
      logger.error("Create review error:", error);
      return next(new AppError("marketplace_create_review_failed", "Failed to create review", 500, { originalMessage: error?.message }));
    }
  }
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await (prisma as any).dataset.groupBy({
        by: ["category"],
        where: { status: "active" },
        _count: { category: true },
      });
      res.json({
        success: true,
        categories: [
          "All Categories",
          ...categories.map((c: any) => c.category),
        ],
      });
    } catch (error: any) {
      logger.error("Get categories error:", error);
      return next(new AppError("marketplace_get_categories_failed", "Failed to get categories", 500, { originalMessage: error?.message }));
    }
  }

  async getWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const items = await (prisma as any).wishlist.findMany({
        where: { userId },
        include: {
          dataset: { include: { creator: { select: { username: true } } } },
        },
      });
      const wishlist = items.map((it: any) => this.formatDataset(it.dataset));
      res.json({ success: true, wishlist });
    } catch (error: any) {
      logger.error("Get wishlist error:", error);
      return next(new AppError("marketplace_get_wishlist_failed", "Failed to get wishlist", 500, { originalMessage: error?.message }));
    }
  }

  async toggleWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { datasetId } = req.params;
      const existing = await (prisma as any).wishlist.findUnique({
        where: { userId_datasetId: { userId, datasetId } },
      });
      if (existing) {
        await (prisma as any).wishlist.delete({ where: { id: existing.id } });
      } else {
        await (prisma as any).wishlist.create({ data: { userId, datasetId } });
      }
      // Return updated wishlist
      const items = await (prisma as any).wishlist.findMany({
        where: { userId },
        include: {
          dataset: { include: { creator: { select: { username: true } } } },
        },
      });
      const wishlist = items.map((it: any) => this.formatDataset(it.dataset));
      res.json({ success: true, wishlist });
    } catch (error: any) {
      logger.error("Toggle wishlist error:", error);
      return next(new AppError("marketplace_toggle_wishlist_failed", "Failed to toggle wishlist", 500, { originalMessage: error?.message }));
    }
  }
  private formatDataset(dataset: any) {
    return {
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      creator: dataset.creator?.username || "Unknown",
      creatorWallet: dataset.creator?.walletAddress,
      category: dataset.category,
      price: parseFloat(dataset.price.toString()),
      downloads: dataset.downloadCount,
      rating: parseFloat(dataset.rating.toString()),
      quality: dataset.qualityScore,
      lastUpdated: this.formatDate(dataset.updatedAt),
      tags: dataset.tags,
      preview: dataset.previewData,
      reviews: dataset.reviews,
    };
  }
  private getSortOrder(sortBy: string) {
    switch (sortBy) {
      case "trending":
        return [{ downloadCount: "desc" }, { rating: "desc" }];
      case "rating":
        return [{ rating: "desc" }, { reviewCount: "desc" }];
      case "recent":
        return { createdAt: "desc" };
      case "price":
        return { price: "asc" };
      default:
        return { createdAt: "desc" };
    }
  }
  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  }
}
