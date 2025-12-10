"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GenerationTier } from "./GenerationInterface";

interface CompactTierSelectorProps {
  selectedTier: GenerationTier;
  onTierChange: (tier: GenerationTier) => void;
  tierConfig: Record<
    string,
    {
      name: string;
      price: string;
      description: string;
      features: string[];
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      aiLimit: number;
      validation: boolean;
      compliance: boolean;
    }
  >;
}

export function CompactTierSelector({
  selectedTier,
  onTierChange,
  tierConfig,
}: CompactTierSelectorProps) {
  const tiers = [
    {
      id: "basic" as GenerationTier,
      config: tierConfig.basic,
      quality: "85%",
      time: "~2min",
      icon: Sparkles,
      color: "emerald",
    },
    {
      id: "workflow" as GenerationTier,
      config: tierConfig.workflow,
      quality: "94%",
      time: "~5min",
      icon: Zap,
      color: "blue",
    },
    {
      id: "production" as GenerationTier,
      config: tierConfig.production,
      quality: "99%",
      time: "~20min",
      icon: Brain,
      color: "purple",
    },
  ];

  const getSelectedStyles = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return "border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50";
    }

    const colorMap = {
      emerald:
        "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500/20",
      blue: "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500/20",
      purple:
        "border-purple-500 bg-purple-500/10 text-white ring-1 ring-purple-500/20",
    };

    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconStyles = (color: string) => {
    const colorMap = {
      emerald: "text-emerald-400",
      blue: "text-blue-400",
      purple: "text-purple-400",
    };

    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-300 whitespace-nowrap">
        Tier:
      </span>
      <div className="flex items-center gap-3">
        {tiers.map(({ id, config, quality, time, icon: Icon, color }) => {
          const isSelected = selectedTier === id;

          return (
            <motion.button
              key={id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTierChange(id)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 min-w-[160px] ${getSelectedStyles(
                color,
                isSelected
              )}`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900/40 flex items-center justify-center ${getIconStyles(
                  color
                )}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <div className="font-medium text-sm leading-tight">
                  {config.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold">{config.price}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-400">
                    {quality} quality
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-400">{time}</span>
                </div>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                    color === "emerald"
                      ? "bg-emerald-500"
                      : color === "blue"
                      ? "bg-blue-500"
                      : "bg-purple-500"
                  }`}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
