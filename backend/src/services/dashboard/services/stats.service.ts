import prisma from "../../../config/database";
import { UserStats } from "../types/dashboard.types";
import DashboardCache from "../utils/cache.util";

class StatsService {
  async calculateUserStats(userId: string): Promise<UserStats> {
    const cached = await DashboardCache.getUserStats(userId).catch(() => null);
    if (cached) return cached;

    const totalDatasets = await prisma.userDataset.count({ where: { userId } });
    const totalPurchases = await prisma.purchase.count({
      where: { dataset: { creatorId: userId } },
    });

    const totalEarningsAgg = await prisma.earning.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const totalEarnings = Number(totalEarningsAgg._sum.amount ?? 0);

    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthlyAgg = await prisma.earning.aggregate({
      where: { userId, createdAt: { gte: monthAgo } },
      _sum: { amount: true },
    });
    const weeklyAgg = await prisma.earning.aggregate({
      where: { userId, createdAt: { gte: weekAgo } },
      _sum: { amount: true },
    });

    const monthlyEarnings = Number(monthlyAgg._sum.amount ?? 0);
    const weeklyEarnings = Number(weeklyAgg._sum.amount ?? 0);

    const publishedDatasets = await prisma.userDataset.count({
      where: { userId, NOT: { status: "draft" } },
    });

    const totalDownloads = await prisma.purchase.count({
      where: { dataset: { creatorId: userId } },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputationScore: true },
    });
    const reputation = user?.reputationScore ?? 0;

    const rankingPosition = await this.getRankingPosition(userId);

    const result: UserStats & any = {
      userId,
      totalDatasets,
      totalPurchases,
      totalEarnings,
      monthlyEarnings,
      weeklyEarnings,
      publishedDatasets,
      totalDownloads,
      reputation,
      rankingPosition,
    };

    await DashboardCache.setUserStats(userId, result).catch(() => null);
    return result as UserStats;
  }

  async calculateDatasetMetrics(datasetId: string) {
    const ds = await prisma.dataset.findUnique({
      where: { id: datasetId },
      include: { creator: true },
    });
    if (!ds) return null;

    const earningsAgg = await prisma.earning.aggregate({
      where: { datasetId },
      _sum: { amount: true },
    });
    const earnings = Number(earningsAgg._sum.amount ?? 0);
    const downloads = await prisma.purchase.count({ where: { datasetId } });
    const userDataset = await prisma.userDataset.findUnique({
      where: { datasetId },
    });
    const holders = userDataset?.holderCount ?? 0;
    const marketCap = Number(userDataset?.marketCap ?? 0);
    const tradingVolume = Number(userDataset?.tradingVolume ?? 0);
    const qualityScore = ds.qualityScore ?? 0;

    return {
      datasetId,
      earnings,
      downloads,
      holders,
      marketCap,
      tradingVolume,
      qualityScore,
    };
  }

  async getPerformanceMetrics(userId: string) {
    const totalAgg: any = await prisma.earning.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const totalRevenue = Number(totalAgg._sum.amount ?? 0);
    const activeCount = await prisma.userDataset.count({
      where: { userId, status: "bonding" },
    });
    const graduatedCount = await prisma.userDataset.count({
      where: { userId, status: "graduated" },
    });
    const datasets = await prisma.userDataset.findMany({
      where: { userId },
      include: { dataset: true },
    });
    const scores = datasets.map((d) => d.dataset?.qualityScore ?? 0);
    const avgQuality = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    return { totalRevenue, activeCount, graduatedCount, avgQuality };
  }

  async updateUserDatasetStats(datasetId: string) {
    const metrics = await this.calculateDatasetMetrics(datasetId);
    if (!metrics) return null;

    // update user_dataset fields (totalEarnings, tradingVolume, holderCount, marketCap)
    const tx = await prisma.$transaction([
      prisma.userDataset.updateMany({
        where: { datasetId },
        data: {
          totalEarnings: metrics.earnings,
          tradingVolume: metrics.tradingVolume,
          holderCount: metrics.holders,
          marketCap: metrics.marketCap,
        } as any,
      }),
    ]);

    // invalidate cache for owner if possible
    const ud = await prisma.userDataset.findUnique({ where: { datasetId } });
    if (ud) {
      await DashboardCache.invalidateUserStats(ud.userId).catch(() => null);
    }

    return tx;
  }

  async getRankingPosition(userId: string) {
    // Count users with higher total earnings
    const totalAgg = await prisma.earning.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const total = Number(totalAgg._sum.amount ?? 0);
    const rows: Array<{ count: string }> = (await prisma.$queryRaw`
      SELECT COUNT(*)::text as count FROM (
        SELECT user_id, SUM(amount) as total
        FROM earnings
        GROUP BY user_id
        HAVING SUM(amount) > ${total}
      ) t
    `) as any;
    const higherCount = rows?.[0] ? Number(rows[0].count) : 0;
    return higherCount + 1;
  }
}

export default new StatsService();
