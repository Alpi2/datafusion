"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  Users,
  GraduationCap,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
} from "lucide-react";
import PromptBar from "./PromptBar";
import UserTypeDetector from "./UserTypeDetector";
import LiveCounter from "./LiveCounter";
import ExampleShowcase from "./ExampleShowcase";
import { CompactTierSelector } from "./CompactTierSelector";
import { QuickConfigPanel } from "./QuickConfigPanel";
import { AdvancedConfigPanel } from "./AdvancedConfigPanel";
import { GenerationProgress } from "./GenerationProgress";
import { DatasetPreview } from "./DatasetPreview";

export type UserType = "simple" | "advanced" | "enterprise" | "academic";
export type GenerationTier = "basic" | "workflow" | "production";

export default function GenerationInterface() {
  const [userType, setUserType] = useState<UserType>("simple");
  const [selectedTier, setSelectedTier] = useState<GenerationTier>("basic");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAIModels, setSelectedAIModels] = useState<string[]>(["gpt-4"]);
  const [validationLevel, setValidationLevel] = useState<string>("standard");
  const [complianceRequirements, setComplianceRequirements] = useState<
    string[]
  >([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showDatasetPreview, setShowDatasetPreview] = useState(false);
  const [generatedDatasetName, setGeneratedDatasetName] = useState("");
  const [generatedDatasetDesc, setGeneratedDatasetDesc] = useState("");

  // Auto-enable advanced mode for higher tiers or advanced users
  useEffect(() => {
    if (
      selectedTier !== "basic" ||
      userType === "advanced" ||
      userType === "enterprise"
    ) {
      setIsAdvancedMode(true);
    }
  }, [selectedTier, userType]);

  const handleStartGeneration = async (
    prompt: string,
    config: Record<string, unknown>
  ) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep("Initializing generation...");

    // Store dataset info for preview
    setGeneratedDatasetName(
      prompt
        .split(" ")
        .slice(0, 4)
        .join(" ")
        .replace(/[^\w\s]/gi, "") || "Generated Dataset"
    );
    setGeneratedDatasetDesc(prompt);

    const steps = getGenerationSteps(selectedTier);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setGenerationProgress(((i + 1) / steps.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setIsGenerating(false);
    setCurrentStep("Generation complete!");

    // Show dataset preview after completion
    setTimeout(() => {
      setShowDatasetPreview(true);
    }, 1000);
  };

  const getGenerationSteps = (tier: GenerationTier) => {
    const baseSteps = ["Analyzing prompt...", "Generating synthetic data..."];

    if (tier === "workflow") {
      return [
        ...baseSteps,
        "Multi-AI validation...",
        "Format verification...",
        "Quality testing...",
      ];
    }

    if (tier === "production") {
      return [
        ...baseSteps,
        "Multi-AI consensus...",
        "Statistical verification...",
        "Compliance checking...",
        "Enterprise QA...",
      ];
    }

    return baseSteps;
  };

  const tierConfig = {
    basic: {
      name: "Basic Test Data",
      price: "Free",
      description: "Perfect for testing",
      icon: Sparkles,
      color: "emerald",
      aiLimit: 1,
      validation: false,
      compliance: false,
      features: [
        "Single AI generation",
        "CSV/JSON formats",
        "Community quality",
        "Up to 10K rows",
        "Document upload",
        "Context chat",
      ],
    },
    workflow: {
      name: "Workflow Ready",
      price: "$",
      description: "Production-ready",
      icon: Zap,
      color: "blue",
      aiLimit: 3,
      validation: true,
      compliance: false,
      features: [
        "Multi-AI validation",
        "Premium formats",
        "Creator testing",
        "Up to 1M rows",
        "Document upload",
        "Context chat",
      ],
    },
    production: {
      name: "Production Grade",
      price: "$$",
      description: "Enterprise-grade",
      icon: Brain,
      color: "purple",
      aiLimit: 5,
      validation: true,
      compliance: true,
      features: [
        "Full compliance",
        "Statistical verification",
        "Enterprise testing",
        "Unlimited rows",
        "Advanced knowledge AI",
        "Domain expertise",
      ],
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900">
      {/* Hero Section - Compact */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12">
          {/* Compact Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
                <span className="text-gradient">Transform</span> Data
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Generate enterprise-grade synthetic datasets with AI.
                <span className="text-emerald-400 font-medium">
                  {" "}
                  Earn $INAI tokens
                </span>{" "}
                from your data.
              </p>
            </motion.div>

            {/* Compact Live Counter */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">2.4M</div>
                <div className="text-sm text-slate-400">datasets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">$1.3M</div>
                <div className="text-sm text-slate-400">earned</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-slate-400">Live</span>
              </div>
            </div>
          </div>

          {/* Compact User Type Detection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <UserTypeDetector
              onUserTypeChange={setUserType}
              currentType={userType}
              compact
            />
          </motion.div>

          {/* Main Generation Interface - Streamlined */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {/* Compact Tier Selection & Configuration */}
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CompactTierSelector
                    selectedTier={selectedTier}
                    onTierChange={setSelectedTier}
                    tierConfig={tierConfig}
                  />
                </div>
                <div className="flex flex-col items-end gap-3 ml-4">
                  <button
                    onClick={() => setShowConfigPanel(!showConfigPanel)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-200 text-slate-300 hover:text-white w-36"
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                    {showConfigPanel ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                    className={`px-3 py-2 text-sm rounded-xl border transition-all duration-200 w-36 ${
                      isAdvancedMode
                        ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700"
                        : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600 hover:text-white"
                    }`}
                    style={{ textAlign: "center" }}
                  >
                    {isAdvancedMode ? "Simple" : "Advanced"}
                  </button>
                </div>
              </div>

              {/* Expandable Configuration Panel */}
              <AnimatePresence>
                {showConfigPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 pt-6 border-t border-slate-700/50 overflow-hidden"
                  >
                    {isAdvancedMode ? (
                      <AdvancedConfigPanel
                        tier={selectedTier}
                        selectedModels={selectedAIModels}
                        onModelsChange={setSelectedAIModels}
                        validationLevel={validationLevel}
                        onValidationChange={setValidationLevel}
                        complianceRequirements={complianceRequirements}
                        onComplianceChange={setComplianceRequirements}
                        tierConfig={tierConfig[selectedTier]}
                      />
                    ) : (
                      <QuickConfigPanel
                        tier={selectedTier}
                        tierConfig={tierConfig[selectedTier]}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Streamlined Prompt Bar */}
            <PromptBar
              userType={userType}
              selectedTier={selectedTier}
              tierConfig={tierConfig[selectedTier]}
              onGenerationStart={handleStartGeneration}
              onAdvancedToggle={() => setIsAdvancedMode(!isAdvancedMode)}
              showAdvanced={isAdvancedMode}
              isGenerating={isGenerating}
              compact
            />

            {/* Generation Progress */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <GenerationProgress
                    progress={generationProgress}
                    currentStep={currentStep}
                    tier={selectedTier}
                    selectedModels={selectedAIModels}
                    compact
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Compact Stats - Only show when not generating */}
          {!isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 grid grid-cols-4 gap-6 max-w-2xl mx-auto"
            >
              {[
                {
                  label: "Quality",
                  value:
                    selectedTier === "basic"
                      ? "85%"
                      : selectedTier === "workflow"
                      ? "94%"
                      : "99%",
                },
                {
                  label: "Speed",
                  value:
                    selectedTier === "basic"
                      ? "2min"
                      : selectedTier === "workflow"
                      ? "5min"
                      : "20min",
                },
                {
                  label: "Models",
                  value: tierConfig[selectedTier].aiLimit.toString(),
                },
                {
                  label: "Compliance",
                  value: tierConfig[selectedTier].compliance ? "Full" : "Basic",
                },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Compact Example Showcase - Only for simple mode */}
          {!isAdvancedMode && !isGenerating && (
            <ExampleShowcase userType={userType} compact />
          )}
        </div>
      </div>

      {/* Dataset Preview Modal */}
      <DatasetPreview
        datasetName={generatedDatasetName}
        description={generatedDatasetDesc}
        tier={selectedTier}
        isVisible={showDatasetPreview}
        onClose={() => setShowDatasetPreview(false)}
      />
    </div>
  );
}
