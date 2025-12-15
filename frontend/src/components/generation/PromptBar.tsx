"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Settings,
  Wand2,
  Brain,
  Shield,
  Zap,
  FileText,
  Download,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UserType, GenerationTier } from "./GenerationInterface";
import { generationAPI } from "@/lib/api/generation";

interface PromptBarProps {
  userType: UserType;
  selectedTier: GenerationTier;
  tierConfig: {
    name: string;
    price: string;
    description: string;
    features: string[];
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    aiLimit: number;
    validation: boolean;
    compliance: boolean;
  };
  onGenerationStart: (prompt: string, config: Record<string, unknown>) => void;
  schema?: any;
  onAdvancedToggle: () => void;
  showAdvanced: boolean;
  isGenerating: boolean;
  compact?: boolean;
  previewRows?: number;
  onEstimate?: (est: any) => void;
}

export default function PromptBar({
  userType,
  selectedTier,
  tierConfig,
  onGenerationStart,
  schema,
  onAdvancedToggle,
  showAdvanced,
  isGenerating,
  compact = false,
  previewRows,
  onEstimate,
}: PromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Smart prompts based on user type and tier
  const getSmartPrompts = () => {
    const basePrompts = {
      simple: [
        "Generate customer data for an e-commerce platform with names, emails, purchase history",
        "Create user profiles for a social media app with demographics and preferences",
        "Generate sales data for a retail store with products, quantities, and dates",
      ],
      advanced: [
        "Generate healthcare patient data with medical history, treatments, and outcomes following HIPAA guidelines",
        "Create financial transaction data with fraud detection features and compliance markers",
        "Generate IoT sensor data with time series patterns and anomaly detection labels",
      ],
      enterprise: [
        "Generate enterprise customer dataset with complex segmentation, lifecycle stages, and regulatory compliance",
        "Create multi-dimensional financial portfolio data with risk metrics and regulatory reporting requirements",
        "Generate supply chain data with vendor relationships, logistics tracking, and compliance documentation",
      ],
      academic: [
        "Generate research dataset for machine learning with balanced classes and statistical significance",
        "Create experimental data with control groups, statistical distributions, and research methodology compliance",
        "Generate longitudinal study data with time-based correlations and academic publication standards",
      ],
    };
    return basePrompts[userType] || basePrompts.simple;
  };

  const templates = [
    {
      id: "customer",
      name: "Customer Database",
      description: "User profiles with demographics and behavior",
      prompt:
        "Generate customer data including names, emails, demographics, purchase history, and behavioral patterns",
      fields: [
        "customer_id",
        "name",
        "email",
        "age",
        "location",
        "total_spent",
      ],
      tier: "basic",
    },
    {
      id: "sales",
      name: "Sales Analytics",
      description: "Transaction data with performance metrics",
      prompt:
        "Create sales transaction data with products, quantities, pricing, and performance analytics",
      fields: [
        "transaction_id",
        "product",
        "quantity",
        "price",
        "date",
        "salesperson",
      ],
      tier: "workflow",
    },
    {
      id: "financial",
      name: "Financial Records",
      description: "Banking and investment data with compliance",
      prompt:
        "Generate financial data including accounts, transactions, investments, with regulatory compliance markers",
      fields: [
        "account_id",
        "transaction_type",
        "amount",
        "date",
        "compliance_flag",
      ],
      tier: "production",
    },
  ];

  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [savedSchemas, setSavedSchemas] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tResRaw: any = await generationAPI.getTemplates();
        const sResRaw: any = await generationAPI.getSchemas();
        if (!mounted) return;
        const templatesArr = Array.isArray(tResRaw)
          ? tResRaw
          : tResRaw?.data?.templates ||
            tResRaw?.templates ||
            tResRaw?.data ||
            [];
        const schemasArr = Array.isArray(sResRaw)
          ? sResRaw
          : sResRaw?.data?.schemas || sResRaw?.schemas || sResRaw?.data || [];
        setSavedTemplates(templatesArr);
        setSavedSchemas(schemasArr);
      } catch (err) {
        // ignore for now
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedTier]);

  const availableTemplates = [...templates, ...(savedTemplates || [])].filter(
    (t) => {
      if (selectedTier === "basic") return t.tier === "basic";
      if (selectedTier === "workflow")
        return ["basic", "workflow"].includes(t.tier);
      return true;
    }
  );

  const handleGenerate = () => {
    if (!prompt.trim() && !selectedTemplate) return;

    const finalPrompt = selectedTemplate
      ? templates.find((t) => t.id === selectedTemplate)?.prompt || prompt
      : prompt;

    const config: Record<string, unknown> = {
      tier: selectedTier,
      template: selectedTemplate,
      userType,
      timestamp: Date.now(),
    };

    if (schema) config.schema = schema;

    // Optionally request an estimate before starting (parent may call generationAPI.preview)
    if (onEstimate) {
      onEstimate({
        prompt: finalPrompt,
        tier: selectedTier,
        schema,
        rowCount: previewRows ?? 5,
      });
    }

    onGenerationStart(finalPrompt, config);
  };

  const getPlaceholder = () => {
    if (selectedTier === "basic") {
      return "Describe the data you want to generate (e.g., 'customer data with names and emails')...";
    } else if (selectedTier === "workflow") {
      return "Describe your data requirements with validation needs (e.g., 'user profiles with format validation')...";
    } else {
      return "Describe enterprise data requirements with compliance and quality specifications...";
    }
  };

  const smartPrompts = getSmartPrompts();

  if (compact) {
    return (
      <div className="w-full">
        {/* Compact Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isGenerating}
            className={`w-full h-24 p-4 pr-32 bg-slate-800/40 backdrop-blur-sm border-2 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none ${
              isGenerating
                ? "border-slate-600 opacity-60"
                : "border-slate-700 focus:border-indigo-500 hover:border-slate-600"
            }`}
          />

          {/* Generate Button */}
          <div className="absolute bottom-3 right-3">
            <Button
              onClick={handleGenerate}
              disabled={(!prompt.trim() && !selectedTemplate) || isGenerating}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isGenerating
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              }`}
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 mr-2"
                  >
                    <Brain className="w-4 h-4" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tier Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 p-3 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <tierConfig.icon className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="font-medium text-white">{tierConfig.name}</span>
            <span className="text-slate-400 text-sm ml-2">
              ({tierConfig.price})
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-indigo-300 border-indigo-500/30"
          >
            {tierConfig.description}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {selectedTier !== "basic" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdvancedToggle}
              className="text-slate-400 hover:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvanced ? "Hide" : "Show"} Advanced
            </Button>
          )}
        </div>
      </motion.div>

      {/* Template Library */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-white">
              Template Library
            </span>
            <Badge variant="outline" className="text-xs text-slate-400">
              {availableTemplates.length + savedSchemas.length} available
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            {availableTemplates.map((template) => (
              <motion.div
                key={`tpl-${template.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
                onClick={() => {
                  setSelectedTemplate(
                    selectedTemplate === template.id ? null : template.id
                  );
                  if (selectedTemplate !== template.id)
                    setPrompt(template.prompt || "+");
                }}
              >
                <h4 className="font-medium text-white text-sm mb-1">
                  {template.name}
                </h4>
                <p className="text-xs text-slate-400 mb-2">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {template.fields?.length ?? 0} fields
                  </Badge>
                  <Badge variant="outline" className="text-xs text-slate-400">
                    {template.tier}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>

          {savedSchemas.length > 0 && (
            <div>
              <h5 className="text-sm text-slate-300 mb-2">
                Your Saved Schemas
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {savedSchemas.map((s: any) => (
                  <motion.div
                    key={`schema-${s.id}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className={`p-3 border rounded-lg cursor-pointer transition-all border-slate-700 hover:border-slate-600`}
                    onClick={() => {
                      setSelectedTemplate(s.id);
                      // apply schema prompt if present
                      if (s.prompt) setPrompt(s.prompt);
                    }}
                  >
                    <h4 className="font-medium text-white text-sm mb-1">
                      {s.name}
                    </h4>
                    <p className="text-xs text-slate-400 mb-2">
                      {s.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {(s.fields || []).length} fields
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs text-slate-400"
                      >
                        {s.tier}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Main Prompt Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6"
      >
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isGenerating}
            className={`w-full min-h-[120px] p-4 pr-32 bg-slate-800/40 backdrop-blur-sm border-2 rounded-2xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none ${
              isGenerating
                ? "border-slate-600 opacity-60"
                : "border-slate-700 focus:border-indigo-500 hover:border-slate-600"
            }`}
          />

          {/* Generate Button */}
          <div className="absolute bottom-4 right-4">
            <Button
              onClick={handleGenerate}
              disabled={(!prompt.trim() && !selectedTemplate) || isGenerating}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                isGenerating
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/25"
              }`}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 mr-2"
                  >
                    <Brain className="w-4 h-4" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Tier Features Indicator */}
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2">
              {tierConfig.validation && (
                <Badge
                  variant="outline"
                  className="text-xs text-emerald-300 border-emerald-500/30"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Validated
                </Badge>
              )}
              {tierConfig.compliance && (
                <Badge
                  variant="outline"
                  className="text-xs text-purple-300 border-purple-500/30"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Compliant
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-xs text-yellow-300 border-yellow-500/30"
              >
                <Brain className="w-3 h-3 mr-1" />
                Personalized
              </Badge>
            </div>
          </div>
        </div>

        {/* Character Count & Tips */}
        <div className="flex items-center justify-between mt-2 px-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <HelpCircle className="w-3 h-3" />
            <span>
              {selectedTier === "basic"
                ? "Upload docs for better context • Keep it simple for faster generation"
                : selectedTier === "workflow"
                ? "Include validation requirements • Upload docs for better context"
                : "Specify compliance needs • Upload domain docs for expert-level data"}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {prompt.length}/1000 characters
          </div>
        </div>
      </motion.div>

      {/* Smart Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">
            Smart Suggestions
          </span>
          <Badge
            variant="outline"
            className="text-xs text-yellow-300 border-yellow-500/30"
          >
            For {userType} users
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {smartPrompts.slice(0, 2).map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => setPrompt(suggestion)}
              disabled={isGenerating}
              className="text-left p-3 bg-slate-800/20 border border-slate-700/50 rounded-lg hover:border-slate-600 hover:bg-slate-800/40 transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  {suggestion}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Generation Stats Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-white">
              {tierConfig.aiLimit === 1 ? "1" : `1-${tierConfig.aiLimit}`}
            </div>
            <div className="text-xs text-slate-400">AI Models</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {selectedTier === "basic"
                ? "~2min"
                : selectedTier === "workflow"
                ? "~5min"
                : "~20min"}
            </div>
            <div className="text-xs text-slate-400">Generation Time</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {selectedTier === "basic"
                ? "85%"
                : selectedTier === "workflow"
                ? "94%"
                : "99%"}
            </div>
            <div className="text-xs text-slate-400">Quality Score</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {tierConfig.features.length}
            </div>
            <div className="text-xs text-slate-400">Features</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
