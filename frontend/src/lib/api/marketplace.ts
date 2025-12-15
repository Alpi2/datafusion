import apiClient from "./client";

export type PurchaseResponse = {
  success?: boolean;
  sessionId?: string;
  redirectUrl?: string;
  unsignedTx?: any;
};

const marketplaceAPI = {
  listDatasets(params?: Record<string, any>) {
    if (!params) return apiClient.get<any>(`/api/marketplace/datasets`);
    // If a search/query term is provided, use the search endpoint (POST)
    if (params.search || params.query) {
      const body = { ...params };
      // normalize key to 'query' expected by the backend search endpoint
      if (params.search && !body.query) body.query = params.search;
      delete body.search;
      return apiClient.post<any>(`/api/marketplace/search`, body);
    }
    const qs =
      "?" +
      Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
    return apiClient.get<any>(`/api/marketplace/datasets${qs}`);
  },
  getCategories() {
    return apiClient.get<string[]>(`/api/marketplace/categories`);
  },
  getDatasetById(id: string) {
    return apiClient.get<any>(`/api/marketplace/datasets/${id}`);
  },
  purchaseDataset(datasetId: string, body?: any) {
    return apiClient.post<PurchaseResponse>(
      `/api/marketplace/purchase/${datasetId}`,
      body
    );
  },
  downloadDataset(datasetId: string) {
    return apiClient.get<{ downloadUrl?: string }>(
      `/api/marketplace/datasets/${datasetId}/download`
    );
  },
  // Wishlist endpoints
  getWishlist() {
    return apiClient.get<any>(`/api/marketplace/wishlist`);
  },
  toggleWishlist(datasetId: string) {
    return apiClient.post<any>(`/api/marketplace/wishlist/${datasetId}`);
  },
  createReview(
    datasetId: string,
    review: { rating: number; comment?: string }
  ) {
    return apiClient.post<{ success: boolean }>(
      `/api/marketplace/review/${datasetId}`,
      review
    );
  },
};

export default marketplaceAPI;
