"use client";

import { Badge } from "@/components/ui/badge";

interface CategoryNavProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const categoryIcons: Record<string, string> = {
  "All Categories": "🌐",
  "Business Intelligence": "📊",
  Finance: "💹",
  Healthcare: "🏥",
  Marketing: "📈",
  Technology: "💻",
  Research: "🔬",
  Government: "🏛️",
};

const categoryCounts: Record<string, number> = {
  "All Categories": 1247,
  "Business Intelligence": 324,
  Finance: 198,
  Healthcare: 156,
  Marketing: 289,
  Technology: 201,
  Research: 67,
  Government: 12,
};

export function CategoryNav({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryNavProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          const count = categoryCounts[category] || 0;
          const icon = categoryIcons[category] || "📁";

          return (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-slate-800/30 text-slate-300 hover:bg-slate-700/50 hover:text-white border border-slate-700/50 hover:border-slate-600"
                }
              `}
            >
              <span className="text-sm">{icon}</span>
              <span>{category}</span>
              <Badge
                variant="secondary"
                className={`
                  text-xs font-medium
                  ${
                    isSelected
                      ? "bg-indigo-500/20 text-indigo-100 border-indigo-400/30"
                      : "bg-slate-700/50 text-slate-400 border-slate-600/50"
                  }
                `}
              >
                {count.toLocaleString()}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
