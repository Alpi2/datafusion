import { apiClient } from "../api/client";

export type UserStats = {
  userId: string;
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  publishedDatasets: number;
  rankingPosition?: number;
};

export type Dataset = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  tier?: string;
  status?: string;
  category?: string;
  marketCap?: number;
  earnings?: number;
  createdAt?: string;
  volume24h?: number;
  downloads?: number;
  holders?: number;
  qualityScore?: number;
  bondingProgress?: number;
  deploymentType?: string;
};

export type EarningsSummary = {
  total: number;
  monthly: number;
  weekly: number;
  tradingFeeRate?: number;
};

export type PerformanceMetrics = any; // İstersen daha iyi tip yazabiliriz sonra

export type PublishDatasetRequest = {
  userId: string;
  datasetId: string;
  deploymentType?: string;
  storageProvider?: string | null;
};

// Compatibility için bırakıldı, apiClient zaten retry yapıyorsa kaldırılabilir
async function requestWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 2,
  backoff = 300
): Promise<T> {
  try {
    // @ts-ignore – rawRequest varsa kullanılır
    return await apiClient.rawRequest<T>(url, options as any);
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, backoff));
      return requestWithRetry<T>(
        url,
        options,
        retries - 1,
        Math.floor(backoff * 1.5)
      );
    }
    throw err;
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  return apiClient.get<UserStats>(`/api/dashboard/stats/${userId}`);
}

export async function getUserDatasets(userId: string): Promise<Dataset[]> {
  return apiClient.get<Dataset[]>(`/api/dashboard/datasets/${userId}`);
}

export async function getEarningsSummary(
  userId: string
): Promise<EarningsSummary> {
  return apiClient.get<EarningsSummary>(`/api/dashboard/earnings/${userId}`);
}

export async function getPerformanceMetrics(
  userId: string
): Promise<PerformanceMetrics> {
  return apiClient.get<PerformanceMetrics>(
    `/api/analytics/performance/${userId}`
  );
}

export async function getActivityFeed(
  userId: string,
  limit = 20
): Promise<any[]> {
  return apiClient.get<any[]>(
    `/api/dashboard/activity/${userId}?limit=${limit}`
  );
}

export async function publishDataset(
  data: PublishDatasetRequest
): Promise<Dataset> {
  return apiClient.post<Dataset>("/api/dashboard/datasets/publish", data);
}
