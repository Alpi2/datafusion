"use client";

import { DollarSign, Star, Download, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Filters {
  priceRange: [number, number];
  quality: number;
  downloads: number;
}

interface MarketplaceFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function MarketplaceFilters({
  filters,
  onChange,
}: MarketplaceFiltersProps) {
  const updateFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onChange({
      priceRange: [0, 1000],
      quality: 80,
      downloads: 0,
    });
  };

  const priceRanges = [
    { label: "Free", min: 0, max: 0 },
    { label: "Under $100", min: 0, max: 100 },
    { label: "$100 - $300", min: 100, max: 300 },
    { label: "$300 - $500", min: 300, max: 500 },
    { label: "$500+", min: 500, max: 1000 },
  ];

  const qualityLevels = [
    { label: "Any Quality", value: 0 },
    { label: "Good (80%+)", value: 80 },
    { label: "Excellent (90%+)", value: 90 },
    { label: "Premium (95%+)", value: 95 },
  ];

  const downloadTiers = [
    { label: "Any", value: 0 },
    { label: "100+ downloads", value: 100 },
    { label: "500+ downloads", value: 500 },
    { label: "1K+ downloads", value: 1000 },
    { label: "5K+ downloads", value: 5000 },
  ];

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-slate-400 hover:text-white"
        >
          Clear all
        </Button>
      </div>

      {/* Price Range */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-indigo-400" />
          <h4 className="font-medium text-white">Price Range</h4>
        </div>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label
              key={range.label}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="priceRange"
                checked={
                  filters.priceRange[0] === range.min &&
                  filters.priceRange[1] === range.max
                }
                onChange={() =>
                  updateFilter("priceRange", [range.min, range.max])
                }
                className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:ring-2"
              />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>

        {/* Custom Price Range */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <label className="text-sm text-slate-400 mb-2 block">
            Custom Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange[0]}
              onChange={(e) =>
                updateFilter("priceRange", [
                  Number(e.target.value),
                  filters.priceRange[1],
                ])
              }
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400 self-center">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange[1]}
              onChange={(e) =>
                updateFilter("priceRange", [
                  filters.priceRange[0],
                  Number(e.target.value),
                ])
              }
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Quality Score */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-indigo-400" />
          <h4 className="font-medium text-white">Quality Score</h4>
        </div>
        <div className="space-y-2">
          {qualityLevels.map((level) => (
            <label
              key={level.label}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="quality"
                checked={filters.quality === level.value}
                onChange={() => updateFilter("quality", level.value)}
                className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:ring-2"
              />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                {level.label}
              </span>
            </label>
          ))}
        </div>

        {/* Quality Slider */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400">Minimum Quality</label>
            <Badge
              variant="secondary"
              className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
            >
              {filters.quality}%
            </Badge>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.quality}
            onChange={(e) => updateFilter("quality", Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Download Count */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-indigo-400" />
          <h4 className="font-medium text-white">Popularity</h4>
        </div>
        <div className="space-y-2">
          {downloadTiers.map((tier) => (
            <label
              key={tier.label}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="downloads"
                checked={filters.downloads === tier.value}
                onChange={() => updateFilter("downloads", tier.value)}
                className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:ring-2"
              />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                {tier.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Featured Badges */}
      <div>
        <h4 className="font-medium text-white mb-4">Featured</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
            />
            <span className="text-slate-300 group-hover:text-white transition-colors">
              Editor's Choice
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
            />
            <span className="text-slate-300 group-hover:text-white transition-colors">
              Recently Updated
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
            />
            <span className="text-slate-300 group-hover:text-white transition-colors">
              Trending This Week
            </span>
          </label>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: rgb(99 102 241);
          cursor: pointer;
          box-shadow: 0 0 2px 0 rgba(99, 102, 241, 0.5);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: rgb(99 102 241);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 2px 0 rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}
