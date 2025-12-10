"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Download, Shield } from "lucide-react";
import type { UserType } from "./GenerationInterface";

interface ExampleShowcaseProps {
  userType: UserType;
  compact?: boolean;
}

export default function ExampleShowcase({
  userType,
  compact = false,
}: ExampleShowcaseProps) {
  const examples = {
    simple: [
      {
        title: "Customer Support Tickets",
        description: "E-commerce platform support conversations",
        quality: 95,
        uses: "2.1K",
        price: "$12",
        tags: ["CSV", "JSON", "Real-time"],
      },
      {
        title: "User Reviews Dataset",
        description: "Product reviews with sentiment analysis",
        quality: 92,
        uses: "1.8K",
        price: "$8",
        tags: ["Text", "Sentiment", "Multilingual"],
      },
      {
        title: "Social Media Posts",
        description: "Trending content across platforms",
        quality: 88,
        uses: "3.2K",
        price: "$15",
        tags: ["Social", "Trending", "Analytics"],
      },
    ],
    advanced: [
      {
        title: "Healthcare Patient Records",
        description: "HIPAA-compliant synthetic medical data",
        quality: 98,
        uses: "894",
        price: "$45",
        tags: ["HIPAA", "Medical", "Structured"],
      },
      {
        title: "Financial Transactions",
        description: "Banking data for fraud detection models",
        quality: 96,
        uses: "1.2K",
        price: "$35",
        tags: ["PCI-DSS", "Fraud", "ML-ready"],
      },
      {
        title: "IoT Sensor Networks",
        description: "Time-series data from industrial sensors",
        quality: 94,
        uses: "756",
        price: "$28",
        tags: ["Time-series", "Industrial", "Real-time"],
      },
    ],
    enterprise: [
      {
        title: "Employee HR Analytics",
        description: "Workforce data for enterprise dashboards",
        quality: 99,
        uses: "445",
        price: "$120",
        tags: ["GDPR", "Analytics", "Enterprise"],
      },
      {
        title: "Supply Chain Logistics",
        description: "Global shipping and inventory data",
        quality: 97,
        uses: "623",
        price: "$85",
        tags: ["Logistics", "Global", "Bulk"],
      },
      {
        title: "CRM Customer Journey",
        description: "B2B sales pipeline and conversion data",
        quality: 96,
        uses: "512",
        price: "$95",
        tags: ["CRM", "B2B", "Pipeline"],
      },
    ],
    academic: [
      {
        title: "Climate Research Data",
        description: "Temperature and precipitation models",
        quality: 99,
        uses: "234",
        price: "$25",
        tags: ["Climate", "Research", "Cited"],
      },
      {
        title: "Genomic Sequences",
        description: "Synthetic DNA data for bioinformatics",
        quality: 98,
        uses: "156",
        price: "$40",
        tags: ["Genomics", "Bio", "Academic"],
      },
      {
        title: "Economic Indicators",
        description: "Macroeconomic data for policy research",
        quality: 97,
        uses: "189",
        price: "$30",
        tags: ["Economics", "Policy", "Reproducible"],
      },
    ],
  };

  const currentExamples = examples[userType] || examples.simple;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8"
      >
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Popular Templates
          </h3>
          <p className="text-sm text-slate-400">
            Quick-start datasets for {userType} users
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          {currentExamples.slice(0, 3).map((example, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * i }}
              whileHover={{ y: -2 }}
              className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                <span className="text-xs font-medium text-white">
                  {example.quality}%
                </span>
                <span className="text-xs text-slate-400">{example.price}</span>
              </div>

              <h4 className="font-medium text-white text-sm mb-1">
                {example.title}
              </h4>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {example.description}
              </p>

              <Button variant="outline" size="sm" className="w-full text-xs">
                Use Template
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-16"
    >
      <div className="text-center mb-8">
        <h3 className="text-xl font-display font-semibold mb-2">
          Popular{" "}
          {userType === "simple"
            ? "Quick Start"
            : userType === "advanced"
            ? "Power User"
            : userType === "enterprise"
            ? "Enterprise"
            : "Research"}{" "}
          Datasets
        </h3>
        <p className="text-sm text-muted-foreground">
          {userType === "simple" && "Ready-to-use datasets that just work"}
          {userType === "advanced" &&
            "High-quality datasets with detailed schemas"}
          {userType === "enterprise" &&
            "Compliance-ready data for large organizations"}
          {userType === "academic" &&
            "Peer-reviewed, reproducible research datasets"}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {currentExamples.map((example, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * i }}
            whileHover={{ y: -4 }}
            className="bg-card/30 backdrop-blur border border-border/50 rounded-2xl p-6 hover:border-border transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="text-sm font-medium">
                    {example.quality}%
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Quality Score
                </Badge>
              </div>

              {userType === "enterprise" && (
                <Shield className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <h4 className="font-display font-semibold mb-2">{example.title}</h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {example.description}
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {example.tags.map((tag, tagIndex) => (
                <Badge key={tagIndex} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {example.uses} uses
                </div>
                <div className="font-medium text-emerald-400">
                  {example.price}
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full group">
              <span>Use Template</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button variant="ghost" className="text-sm text-muted-foreground">
          Browse all datasets in marketplace
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
