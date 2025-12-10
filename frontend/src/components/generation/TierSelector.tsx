"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Shield,
  Check,
  ArrowRight,
  Users,
  Brain,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GenerationTier } from "./GenerationInterface";

interface TierSelectorProps {
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

export function TierSelector({
  selectedTier,
  onTierChange,
  tierConfig,
}: TierSelectorProps) {
  const tiers = [
    {
      id: "basic" as GenerationTier,
      name: "Basic Test Data",
      price: "Free",
      popular: false,
      description: "Perfect for testing and prototyping",
      icon: Sparkles,
      color: "emerald",
      features: [
        "Single AI generation (GPT-4)",
        "Document upload & context chat",
        "Community quality assurance",
        "CSV & JSON formats",
        "Up to 10,000 rows",
        "Basic schema detection",
        "Personalized knowledge base",
      ],
      limitations: [
        "No multi-AI validation",
        "No compliance checking",
        "Limited format options",
      ],
      useCase: "Rapid prototyping, testing, proof of concepts",
      stats: { quality: "85%", speed: "< 2 min", support: "Community" },
    },
    {
      id: "workflow" as GenerationTier,
      name: "Workflow Ready",
      price: "$",
      popular: true,
      description: "Production-ready with validation",
      icon: Zap,
      color: "blue",
      features: [
        "Multi-AI validation (3 models)",
        "Format verification & testing",
        "Creator quality testing",
        "Premium formats (Parquet, Avro)",
        "Up to 1M rows",
        "Advanced schema builder",
        "Data profiling reports",
      ],
      limitations: ["No compliance automation", "Standard statistical tests"],
      useCase: "Production workflows, ML training, business intelligence",
      stats: { quality: "94%", speed: "5-10 min", support: "Priority" },
    },
    {
      id: "production" as GenerationTier,
      name: "Production Grade",
      price: "$$",
      popular: false,
      description: "Enterprise-grade with full compliance",
      icon: Shield,
      color: "purple",
      features: [
        "Multi-AI consensus (5+ models)",
        "Statistical verification",
        "Automated compliance checking",
        "Enterprise testing suite",
        "Unlimited rows",
        "Custom format support",
        "Detailed audit trails",
        "SLA guarantees",
      ],
      limitations: [],
      useCase:
        "Enterprise systems, regulated industries, mission-critical applications",
      stats: { quality: "99.2%", speed: "15-30 min", support: "Dedicated" },
    },
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = {
      emerald: isSelected
        ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
        : "border-slate-700 hover:border-emerald-500/50",
      blue: isSelected
        ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
        : "border-slate-700 hover:border-blue-500/50",
      purple: isSelected
        ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20"
        : "border-slate-700 hover:border-purple-500/50",
    };
    return baseClasses[color as keyof typeof baseClasses];
  };

  const getIconColorClasses = (color: string) => {
    const iconClasses = {
      emerald: "text-emerald-400",
      blue: "text-blue-400",
      purple: "text-purple-400",
    };
    return iconClasses[color as keyof typeof iconClasses];
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your Generation Tier
        </h2>
        <p className="text-slate-400">
          Select the level of validation and compliance for your synthetic
          dataset
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const Icon = tier.icon;

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * tiers.indexOf(tier) }}
              className={`relative bg-slate-800/40 backdrop-blur-sm border rounded-2xl p-6 cursor-pointer transition-all duration-300 ${getColorClasses(
                tier.color,
                isSelected
              )}`}
              onClick={() => onTierChange(tier.id)}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg bg-slate-900/50 flex items-center justify-center ${getIconColorClasses(
                      tier.color
                    )}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-slate-400">{tier.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {tier.price}
                  </div>
                  {tier.price !== "Free" && (
                    <div className="text-xs text-slate-400">per dataset</div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-900/30 rounded-lg">
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">
                    {tier.stats.quality}
                  </div>
                  <div className="text-xs text-slate-400">Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">
                    {tier.stats.speed}
                  </div>
                  <div className="text-xs text-slate-400">Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">
                    {tier.stats.support}
                  </div>
                  <div className="text-xs text-slate-400">Support</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-white text-sm">
                  Features included:
                </h4>
                {tier.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
                {tier.features.length > 4 && (
                  <div className="text-xs text-slate-400 ml-6">
                    +{tier.features.length - 4} more features...
                  </div>
                )}
              </div>

              {/* Use Case */}
              <div className="mb-4 p-3 bg-slate-900/20 rounded-lg">
                <h4 className="font-medium text-white text-xs mb-1">
                  Best for:
                </h4>
                <p className="text-xs text-slate-400">{tier.useCase}</p>
              </div>

              {/* Select Button */}
              <Button
                className={`w-full ${
                  isSelected
                    ? `bg-${tier.color}-600 hover:bg-${tier.color}-700 text-white`
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                }`}
                onClick={() => onTierChange(tier.id)}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Selected
                  </>
                ) : (
                  <>
                    Select {tier.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Quick View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          Quick Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Users className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-medium text-white">Community Driven</h4>
            <p className="text-sm text-slate-400">
              Free tier with community validation
            </p>
          </div>
          <div className="text-center">
            <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h4 className="font-medium text-white">AI Validated</h4>
            <p className="text-sm text-slate-400">
              Multi-model validation for accuracy
            </p>
          </div>
          <div className="text-center">
            <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h4 className="font-medium text-white">Enterprise Ready</h4>
            <p className="text-sm text-slate-400">
              Full compliance and statistical verification
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
