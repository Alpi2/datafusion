import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export function useMarketplaceCategories() {
  return useQuery<string[]>({
    queryKey: ["marketplace", "categories"],
    queryFn: async () => {
      const res = await apiClient.get<{ categories: string[] }>(
        "/api/marketplace/categories"
      );
      // apiClient returns json.data ?? json — ensure we return categories array
      return (res?.categories as string[]) || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

type DatasetFilters = {
  priceRange?: [number, number];
  quality?: number;
  downloads?: number;
};

export function useMarketplaceDatasets(opts: {
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  filters: DatasetFilters;
  page: number;
  limit: number;
}) {
  const { searchQuery, selectedCategory, sortBy, filters, page, limit } = opts;

  return useQuery<any>({
    queryKey: [
      "marketplace",
      "datasets",
      searchQuery,
      selectedCategory,
      sortBy,
      page,
      limit,
      filters,
    ],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim() === "") {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (selectedCategory && selectedCategory !== "All Categories")
          params.set("category", selectedCategory);
        params.set("priceMin", String(filters?.priceRange?.[0] ?? 0));
        params.set("priceMax", String(filters?.priceRange?.[1] ?? 1000));
        params.set("qualityMin", String(filters?.quality ?? 80));
        params.set("downloadsMin", String(filters?.downloads ?? 0));

        const data = await apiClient.get<any>(
          `/api/marketplace/datasets?${params.toString()}`
        );
        return data;
      }

      const body = {
        query: searchQuery,
        category: selectedCategory,
        priceMin: filters?.priceRange?.[0] ?? 0,
        priceMax: filters?.priceRange?.[1] ?? 1000,
        qualityMin: filters?.quality ?? 80,
        downloadsMin: filters?.downloads ?? 0,
        sortBy,
        page,
        limit,
      };

      const data = await apiClient.post<any>("/api/marketplace/search", body);
      return data;
    },
    staleTime: 1000 * 60 * 1,
  });
}

export default { useMarketplaceCategories, useMarketplaceDatasets };
