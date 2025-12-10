"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BusinessIntelligencePanel } from "@/components/intelligence/BusinessIntelligencePanel";
import {
  TrendingUp,
  Target,
  Brain,
  Sparkles,
  BarChart3,
  DollarSign,
} from "lucide-react";

export default function IntelligencePage() {
  const [selectedDataset, setSelectedDataset] = useState("");

  // Demo dataset options for users to explore
  const demoDatasets = [
    {
      id: "ecommerce",
      name: "E-commerce Customer Data",
      description:
        "Customer profiles with purchase history, demographics, and behavioral patterns",
      category: "Retail",
      tier: "workflow",
    },
    {
      id: "financial",
      name: "Financial Transaction Data",
      description:
        "Banking transactions with risk assessment and compliance markers",
      category: "Finance",
      tier: "production",
    },
    {
      id: "healthcare",
      name: "Healthcare Patient Records",
      description:
        "HIPAA-compliant patient data with medical history and treatment outcomes",
      category: "Healthcare",
      tier: "production",
    },
    {
      id: "marketing",
      name: "Marketing Campaign Analytics",
      description:
        "Campaign performance data with audience segmentation and conversion metrics",
      category: "Marketing",
      tier: "workflow",
    },
    {
      id: "iot",
      name: "IoT Sensor Networks",
      description:
        "Time-series sensor data for industrial monitoring and predictive maintenance",
      category: "Industrial",
      tier: "production",
    },
    {
      id: "social",
      name: "Social Media Analytics",
      description:
        "User engagement data with sentiment analysis and trend identification",
      category: "Social",
      tier: "basic",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold">
                <span className="text-gradient">Business Intelligence</span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              AI-powered monetization opportunities for your synthetic datasets.
              Discover automation matches, market gaps, and enterprise sales
              opportunities.
            </p>

            {/* Key Metrics */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">$11K+</div>
                <div className="text-sm text-slate-400">avg revenue/mo</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">94%</div>
                <div className="text-sm text-slate-400">match accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">3</div>
                <div className="text-sm text-slate-400">platforms</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-slate-400">Live Analysis</span>
              </div>
            </div>
          </motion.div>

          {/* Dataset Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-5xl mx-auto mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">
                Explore Dataset Opportunities
              </h2>
              <p className="text-slate-400">
                Select a dataset type to analyze its monetization potential
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demoDatasets.map((dataset, index) => (
                <motion.button
                  key={dataset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  onClick={() => setSelectedDataset(dataset.description)}
                  className={`p-4 border rounded-xl text-left transition-all ${
                    selectedDataset === dataset.description
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 hover:border-slate-600 bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white text-sm">
                      {dataset.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dataset.tier === "production"
                            ? "bg-purple-400"
                            : dataset.tier === "workflow"
                            ? "bg-blue-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span className="text-xs text-slate-400 capitalize">
                        {dataset.tier}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {dataset.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                      {dataset.category}
                    </span>
                    {selectedDataset === dataset.description && (
                      <span className="text-xs text-emerald-400">
                        Analyzing...
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Custom Dataset Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">
                  Custom Dataset Analysis
                </h3>
              </div>
              <div className="relative">
                <textarea
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  placeholder="Describe your dataset (e.g., 'customer transaction data with purchase patterns, demographics, and loyalty metrics for retail analytics')..."
                  className="w-full h-24 p-4 bg-slate-900/40 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                />
                <div className="absolute bottom-3 right-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Sparkles className="w-3 h-3" />
                    <span>AI will analyze this for opportunities</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Business Intelligence Panel */}
          {selectedDataset && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <BusinessIntelligencePanel
                datasetDescription={selectedDataset}
                tier="production"
                isVisible={true}
              />
            </motion.div>
          )}

          {/* Call to Action */}
          {!selectedDataset && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center"
            >
              <div className="p-8 bg-gradient-to-r from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-2xl max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Ready to Discover Opportunities?
                  </h3>
                </div>
                <p className="text-slate-400 mb-6">
                  Select a dataset type above or describe your own to unlock
                  AI-powered monetization insights.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>Real-time Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <DollarSign className="w-4 h-4" />
                    <span>Revenue Projections</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Target className="w-4 h-4" />
                    <span>Market Opportunities</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
