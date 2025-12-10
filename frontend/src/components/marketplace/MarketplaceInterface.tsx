"use client";

import { useState } from "react";
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

const mockDatasets = [
  {
    id: 1,
    title: "E-commerce Customer Behavior Analytics",
    description:
      "Comprehensive dataset containing purchase patterns, browsing behavior, and customer segments for online retail optimization.",
    creator: "DataVault Labs",
    category: "Business Intelligence",
    price: 299,
    downloads: 2840,
    rating: 4.8,
    quality: 96,
    lastUpdated: "2 days ago",
    tags: ["customer-analytics", "e-commerce", "behavioral-data"],
    preview: {
      rows: 125000,
      columns: 18,
      size: "45MB",
    },
  },
  {
    id: 2,
    title: "Financial Market Sentiment Analysis",
    description:
      "Real-time social media sentiment data correlated with stock price movements across major exchanges.",
    creator: "QuantFlow Research",
    category: "Finance",
    price: 599,
    downloads: 1560,
    rating: 4.9,
    quality: 98,
    lastUpdated: "1 hour ago",
    tags: ["sentiment-analysis", "finance", "social-media"],
    preview: {
      rows: 890000,
      columns: 24,
      size: "156MB",
    },
  },
  {
    id: 3,
    title: "Healthcare Patient Outcomes Dataset",
    description:
      "Anonymized patient data showing treatment efficacy across different demographics and conditions.",
    creator: "MedData Insights",
    category: "Healthcare",
    price: 899,
    downloads: 920,
    rating: 4.7,
    quality: 99,
    lastUpdated: "5 days ago",
    tags: ["healthcare", "patient-outcomes", "clinical-data"],
    preview: {
      rows: 67000,
      columns: 32,
      size: "78MB",
    },
  },
  {
    id: 4,
    title: "Social Media Engagement Patterns",
    description:
      "Cross-platform engagement metrics and viral content analysis for marketing optimization.",
    creator: "ViralMetrics Co",
    category: "Marketing",
    price: 199,
    downloads: 3400,
    rating: 4.6,
    quality: 94,
    lastUpdated: "1 day ago",
    tags: ["social-media", "engagement", "viral-content"],
    preview: {
      rows: 340000,
      columns: 15,
      size: "89MB",
    },
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

  const filteredDatasets = mockDatasets.filter((dataset) => {
    const matchesSearch =
      dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All Categories" ||
      dataset.category === selectedCategory;
    const matchesPrice =
      dataset.price >= filters.priceRange[0] &&
      dataset.price <= filters.priceRange[1];
    const matchesQuality = dataset.quality >= filters.quality;
    const matchesDownloads = dataset.downloads >= filters.downloads;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesQuality &&
      matchesDownloads
    );
  });

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
          categories={categories}
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
              <p className="text-slate-300">
                {filteredDatasets.length} datasets found
              </p>
              <div className="text-slate-400 text-sm">
                Showing results for{" "}
                {selectedCategory !== "All Categories" && selectedCategory}
              </div>
            </div>

            {filteredDatasets.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-slate-400 mb-4">
                  No datasets found matching your criteria
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                    setFilters({
                      priceRange: [0, 1000] as [number, number],
                      quality: 80,
                      downloads: 0,
                    });
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {filteredDatasets.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
