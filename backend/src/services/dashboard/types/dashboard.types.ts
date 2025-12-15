export interface UserStats {
  userId: string;
  totalDatasets: number;
  totalPurchases: number;
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  publishedDatasets: number;
  totalDownloads: number;
  reputation: number;
  rankingPosition: number;
}

export interface DatasetWithMetrics {
  id: string;
  name: string;
  description: string;
  tier: string;
  status: string;
  category: string;
  marketCap: number;
  earnings: number;
  createdAt: string;
  volume24h: number;
  downloads: number;
  holders: number;
  qualityScore: number;
  bondingProgress: number;
  graduationThreshold: number;
  deploymentType: string;
  nftTokenId?: string;
  storageProvider?: string;
  licenseRevenue?: number;
}

export interface EarningByDataset {
  datasetId: string;
  datasetName: string;
  total: number;
  tradingFees: number;
  downloads: number;
  bonuses: number;
}

export interface EarningByType {
  type: string;
  amount: number;
  percentage: number;
}

export interface EarningsSummary {
  total: number;
  monthly: number;
  weekly: number;
  byDataset: EarningByDataset[];
  byType: EarningByType[];
  tradingFeeRate: number;
}

export interface PerformanceMetrics {
  totalRevenue: number;
  activeDatasets: number;
  graduatedDatasets: number;
  avgQualityScore: number;
  revenueGrowth: number;
}
// (canonical UserStats defined above)

export type EarningsBreakdown = {
  type: string;
  total: string;
}[];

export type TimeSeriesPoint = {
  timestamp: string;
  value: number;
};
