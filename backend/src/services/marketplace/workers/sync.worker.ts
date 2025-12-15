import prisma from "../../../config/database";
import { ElasticsearchService } from "../search/elasticsearch.service";
import { logger } from "../../../shared/utils/logger";

export class SyncWorker {
  private searchService: ElasticsearchService;
  constructor(searchService: ElasticsearchService) {
    this.searchService = searchService;
  }
  async syncAllDatasets() {
    try {
      const datasets = await (prisma as any).dataset.findMany({
        where: { status: "active" },
        include: { creator: { select: { username: true } } },
      });
      for (const dataset of datasets) {
        await this.searchService.indexDataset(dataset);
      }
      logger.info(`✅ Synced ${datasets.length} datasets to Elasticsearch`);
    } catch (error) {
      logger.error("❌ Sync worker error:", error);
    }
  }
  startPeriodicSync(intervalMinutes: number = 60) {
    setInterval(() => {
      this.syncAllDatasets();
    }, intervalMinutes * 60 * 1000);
  }
}
