import { Client } from "@elastic/elasticsearch";
import { logger } from "../../../shared/utils/logger";

export class ElasticsearchService {
  private client: Client;
  private index: string;
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
    });
    this.index = process.env.ELASTICSEARCH_INDEX || "datasets";
  }
  async initialize() {
    try {
      // The client.indices.exists() may return either a boolean or an
      // object containing a `body` boolean depending on client version.
      // Normalize both shapes here to a boolean `exists` value.
      const existsResp = await this.client.indices.exists({
        index: this.index,
      });
      let exists: boolean;
      if (
        existsResp &&
        typeof existsResp === "object" &&
        "body" in (existsResp as any)
      ) {
        exists = Boolean((existsResp as any).body);
      } else {
        exists = Boolean(existsResp);
      }
      if (!exists) {
        const shards = parseInt(process.env.ELASTICSEARCH_INDEX_SHARDS || "1");
        const replicas = parseInt(process.env.ELASTICSEARCH_INDEX_REPLICAS || "1");
        const refreshInterval = process.env.ELASTICSEARCH_REFRESH_INTERVAL || "1s";
        await this.client.indices.create({
          index: this.index,
          body: {
            settings: {
              index: {
                number_of_shards: shards,
                number_of_replicas: replicas,
                refresh_interval: refreshInterval,
              },
            },
            mappings: {
              properties: {
                id: { type: "keyword", doc_values: true },
                title: { type: "text", analyzer: "standard" },
                description: { type: "text", analyzer: "standard" },
                category: { type: "keyword", doc_values: true },
                tags: { type: "keyword", doc_values: true },
                price: { type: "float", doc_values: true },
                qualityScore: { type: "integer", doc_values: true },
                downloadCount: { type: "integer", doc_values: true },
                rating: { type: "float", doc_values: true },
                reviewCount: { type: "integer", doc_values: true },
                creatorId: { type: "keyword", doc_values: true },
                creatorUsername: { type: "keyword", doc_values: true },
                status: { type: "keyword", doc_values: true },
                createdAt: { type: "date" },
                updatedAt: { type: "date" },
              },
            },
          },
        });
        logger.info("✅ Elasticsearch index created with optimized settings");
      }
    } catch (error) {
      logger.error("❌ Elasticsearch initialization failed:", error);
      throw error;
    }
  }
  async indexDataset(dataset: any) {
    const refresh = process.env.ELASTICSEARCH_INDEX_REFRESH_ON_INDEX === "true";
    await this.client.index({
      index: this.index,
      id: dataset.id,
      document: {
        id: dataset.id,
        title: dataset.title,
        description: dataset.description,
        category: dataset.category,
        tags: dataset.tags,
        price: parseFloat(dataset.price.toString()),
        qualityScore: dataset.qualityScore,
        downloadCount: dataset.downloadCount,
        rating: parseFloat(dataset.rating.toString()),
        reviewCount: dataset.reviewCount,
        creatorId: dataset.creatorId,
        creatorUsername: dataset.creator?.username,
        status: dataset.status,
        createdAt: dataset.createdAt,
        updatedAt: dataset.updatedAt,
      },
      refresh,
    });
  }
  async search(params: {
    query?: string;
    category?: string;
    tags?: string[];
    priceMin?: number;
    priceMax?: number;
    qualityMin?: number;
    downloadsMin?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      category,
      tags,
      priceMin,
      priceMax,
      qualityMin,
      downloadsMin,
      sortBy = "trending",
      page = 1,
      limit = 20,
    } = params;
    const must: any[] = [{ term: { status: "active" } }];
    const filter: any[] = [];
    // Full-text search
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ["title^3", "description^2", "tags"],
          fuzziness: "AUTO",
        },
      });
    }
    // Filters
    if (category && category !== "All Categories") {
      filter.push({ term: { category } });
    }
    if (tags && tags.length > 0) {
      filter.push({ terms: { tags } });
    }
    if (priceMin !== undefined || priceMax !== undefined) {
      filter.push({
        range: {
          price: {
            gte: priceMin ?? 0,
            lte: priceMax ?? 999999,
          },
        },
      });
    }
    if (qualityMin !== undefined) {
      filter.push({ range: { qualityScore: { gte: qualityMin } } });
    }
    if (downloadsMin !== undefined) {
      filter.push({ range: { downloadCount: { gte: downloadsMin } } });
    }
    // Sorting
    const sort: any[] = [];
    switch (sortBy) {
      case "trending":
        sort.push({ downloadCount: "desc" }, { rating: "desc" });
        break;
      case "rating":
        sort.push({ rating: "desc" }, { reviewCount: "desc" });
        break;
      case "recent":
        sort.push({ createdAt: "desc" });
        break;
      case "price":
        sort.push({ price: "asc" });
        break;
      default:
        sort.push({ _score: "desc" });
    }
    const result = await this.client.search({
      index: this.index,
      body: {
        query: {
          bool: { must, filter },
        },
        sort,
        from: (page - 1) * limit,
        size: limit,
      },
    });
    return {
      hits: result.hits.hits.map((hit: any) => hit._source),
      total: (result.hits.total as any).value,
      page,
      limit,
    };
  }
  async deleteDataset(id: string) {
    await this.client.delete({ index: this.index, id, refresh: true });
  }
}
