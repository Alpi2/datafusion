"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Star,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatasetCard } from "./DatasetCard";
import { MarketplaceFilters } from "./MarketplaceFilters";
import { CategoryNav } from "./CategoryNav";
import marketplaceAPI from "@/lib/api/marketplace";

const USE_DEMO = process.env.NEXT_PUBLIC_USE_DEMO_MARKETPLACE === "true";

// Small demo dataset used only when backend is unreachable and USE_DEMO flag is enabled
const demoDatasets = [
  {
    id: "demo-1",
    title: "Demo: E-commerce Customer Behavior",
    description: "Sample dataset to preview marketplace UI",
    creator: "Demo Vendor",
    category: "Business Intelligence",
    price: 0,
    downloads: 123,
    rating: 4.5,
    quality: 90,
    lastUpdated: "Just now",
    tags: ["demo"],
    preview: { rows: 10, columns: 5, size: "1KB" },
  },
];

const categories = [
  "All Categories",
  "Business Intelligence",
  "Finance",
  "Healthcare",
  "Marketing",
  "Technology",
  "Research",
  "Government",
];

const sortOptions = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "rating", label: "Highest Rated", icon: Star },
  { value: "recent", label: "Recently Added", icon: Clock },
  { value: "price", label: "Price: Low to High", icon: DollarSign },
];

export function MarketplaceInterface() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("trending");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    priceRange: [number, number];
    quality: number;
    downloads: number;
  }>({
    priceRange: [0, 1000],
    quality: 80,
    downloads: 0,
  });

  // Live data state
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriesState, setCategoriesState] = useState<string[]>(categories);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [total, setTotal] = useState(0);

  // datasets come from backend already filtered by query params.
  const filteredDatasets = datasets && datasets.length ? datasets : error && USE_DEMO ? demoDatasets : datasets;

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const category =
          selectedCategory === "All Categories" ? undefined : selectedCategory;

        const resp = await marketplaceAPI.listDatasets({
          page,
          limit,
          category,
          search: searchQuery,
          sortBy,
          priceMin: filters.priceRange[0],
          priceMax: filters.priceRange[1],
          qualityMin: filters.quality,
          downloadsMin: filters.downloads,
        });

        if (!mounted) return;

        // Support different API shapes: { items, total } or { datasets, total }
        const items = resp?.items || resp?.datasets || [];
        setDatasets(items);
        setTotal(resp?.total || resp?.count || items.length);

        // Try fetch categories if available
        try {
          const cats = await marketplaceAPI.getCategories();
          if (mounted && Array.isArray(cats)) {
            setCategoriesState(["All Categories", ...cats]);
          }
        } catch (e) {
          // ignore category errors
        }
      } catch (err: any) {
        console.error("Marketplace fetch error", err);
        setError(err?.message || "Failed to load datasets");
        if (USE_DEMO) setDatasets(demoDatasets);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [searchQuery, selectedCategory, sortBy, filters, page, limit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Dataset Marketplace
          </h1>
          <p className="text-slate-300">
            Discover, purchase, and monetize high-quality AI datasets from the
            community
          </p>
        </div>

        {/* Category Navigation */}
        <CategoryNav
          categories={categoriesState}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search datasets, tags, or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800/50 text-slate-400"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800/50 text-slate-400"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80">
              <MarketplaceFilters filters={filters} onChange={setFilters} />
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-300">{(filteredDatasets || []).length} datasets found</p>
              <div className="text-slate-400 text-sm">
                Showing results for {selectedCategory !== "All Categories" && selectedCategory}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="loader mb-4">Loading datasets...</div>
                <p className="text-slate-400">Please wait while we fetch marketplace data.</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-red-400 mb-4">{error}</div>
                {USE_DEMO ? (
                  <div className="text-slate-400 mb-4">Showing demo datasets instead.</div>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => {
                    setPage(1);
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : (filteredDatasets || []).length === 0 ? (
              <div className="text-center py-16">
                <div className="text-slate-400 mb-4">No datasets found matching your criteria</div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                    setFilters({ priceRange: [0, 1000] as [number, number], quality: 80, downloads: 0 });
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {(filteredDatasets || []).map((dataset) => (
                  <DatasetCard key={dataset.id} dataset={dataset} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
