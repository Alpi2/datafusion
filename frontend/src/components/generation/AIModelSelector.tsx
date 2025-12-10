"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Cpu,
  Zap,
  Star,
  CheckCircle2,
  Lock,
  Sparkles,
  Award,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GenerationTier } from "./GenerationInterface";

interface AIModelSelectorProps {
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  maxModels: number;
  tier: GenerationTier;
}

export function AIModelSelector({
  selectedModels,
  onModelsChange,
  maxModels,
  tier,
}: AIModelSelectorProps) {
  const models = [
    {
      id: "gpt-4",
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      icon: Brain,
      tier: "basic",
      specialties: ["General purpose", "Creative writing", "Complex reasoning"],
      quality: 95,
      speed: "Fast",
      cost: "Free",
      description:
        "Latest GPT-4 model with enhanced capabilities for synthetic data generation",
      strengths: [
        "Natural language understanding",
        "Pattern recognition",
        "Data consistency",
      ],
      recommended: true,
    },
    {
      id: "claude-3.5",
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      icon: Sparkles,
      tier: "workflow",
      specialties: ["Analytical data", "Complex schemas", "Data validation"],
      quality: 97,
      speed: "Medium",
      cost: "$",
      description:
        "Advanced reasoning model excellent for structured data generation",
      strengths: [
        "Logical consistency",
        "Complex relationships",
        "Schema adherence",
      ],
      recommended: false,
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      provider: "Google",
      icon: Zap,
      tier: "workflow",
      specialties: ["Numerical data", "Time series", "Scientific datasets"],
      quality: 94,
      speed: "Fast",
      cost: "$",
      description:
        "Multimodal model with strong mathematical and scientific reasoning",
      strengths: [
        "Mathematical accuracy",
        "Statistical patterns",
        "Numerical relationships",
      ],
      recommended: false,
    },
    {
      id: "claude-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      icon: Award,
      tier: "production",
      specialties: ["Enterprise data", "Compliance", "High complexity"],
      quality: 99,
      speed: "Slow",
      cost: "$$",
      description:
        "Most capable model for enterprise-grade data generation with highest quality",
      strengths: [
        "Maximum accuracy",
        "Complex reasoning",
        "Regulatory compliance",
      ],
      recommended: false,
    },
    {
      id: "gpt-4-specialist",
      name: "GPT-4 Specialist",
      provider: "OpenAI",
      icon: Shield,
      tier: "production",
      specialties: ["Domain-specific", "Industry standards", "Custom schemas"],
      quality: 98,
      speed: "Medium",
      cost: "$$",
      description: "Fine-tuned GPT-4 for industry-specific data generation",
      strengths: [
        "Domain expertise",
        "Industry standards",
        "Custom validation",
      ],
      recommended: false,
    },
    {
      id: "ensemble-validator",
      name: "Ensemble Validator",
      provider: "Inflectiv",
      icon: Cpu,
      tier: "production",
      specialties: ["Validation", "Quality assurance", "Consensus checking"],
      quality: 100,
      speed: "Variable",
      cost: "$$",
      description: "Multi-model ensemble for validation and quality assurance",
      strengths: ["Consensus validation", "Quality scoring", "Error detection"],
      recommended: false,
    },
  ];

  const availableModels = models.filter((model) => {
    if (tier === "basic") return model.tier === "basic";
    if (tier === "workflow") return ["basic", "workflow"].includes(model.tier);
    return true; // production tier gets all models
  });

  const isModelSelected = (modelId: string) => selectedModels.includes(modelId);
  const canSelectMore = selectedModels.length < maxModels;

  const handleModelToggle = (modelId: string) => {
    if (isModelSelected(modelId)) {
      // Deselect model (but keep at least one)
      if (selectedModels.length > 1) {
        onModelsChange(selectedModels.filter((id) => id !== modelId));
      }
    } else if (canSelectMore) {
      // Select model
      onModelsChange([...selectedModels, modelId]);
    } else {
      // Replace last selected if at limit
      const newModels = [...selectedModels];
      newModels[newModels.length - 1] = modelId;
      onModelsChange(newModels);
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 98) return "text-emerald-400";
    if (quality >= 95) return "text-blue-400";
    return "text-yellow-400";
  };

  const getTierBadgeColor = (modelTier: string) => {
    const colors = {
      basic: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      workflow: "bg-blue-500/10 text-blue-300 border-blue-500/30",
      production: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    };
    return colors[modelTier as keyof typeof colors];
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            AI Model Selection
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Choose up to {maxModels} AI model{maxModels > 1 ? "s" : ""} for your{" "}
            {tier} tier generation
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">
            Selected: {selectedModels.length}/{maxModels}
          </div>
          {tier === "workflow" && (
            <div className="text-xs text-blue-400">
              Multi-AI validation enabled
            </div>
          )}
          {tier === "production" && (
            <div className="text-xs text-purple-400">
              Consensus validation active
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {availableModels.map((model, index) => {
          const isSelected = isModelSelected(model.id);
          const Icon = model.icon;
          const isLocked = !canSelectMore && !isSelected;

          return (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                  : isLocked
                  ? "border-slate-700/50 bg-slate-800/20 opacity-60"
                  : "border-slate-700 hover:border-slate-600 bg-slate-800/40"
              }`}
              onClick={() => !isLocked && handleModelToggle(model.id)}
            >
              {/* Selection Indicator */}
              <div className="absolute top-3 right-3">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                ) : isLocked ? (
                  <Lock className="w-5 h-5 text-slate-500" />
                ) : (
                  <div className="w-5 h-5 border-2 border-slate-600 rounded-full" />
                )}
              </div>

              {/* Recommended Badge */}
              {model.recommended && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30 text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}

              {/* Model Header */}
              <div className="flex items-start gap-3 mb-3 mt-6">
                <div className="w-10 h-10 bg-slate-900/50 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{model.name}</h4>
                    <Badge
                      variant="outline"
                      className={getTierBadgeColor(model.tier)}
                    >
                      {model.tier}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{model.provider}</p>
                </div>
              </div>

              {/* Model Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-slate-900/30 rounded-lg">
                <div className="text-center">
                  <div
                    className={`text-sm font-semibold ${getQualityColor(
                      model.quality
                    )}`}
                  >
                    {model.quality}%
                  </div>
                  <div className="text-xs text-slate-400">Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">
                    {model.speed}
                  </div>
                  <div className="text-xs text-slate-400">Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">
                    {model.cost}
                  </div>
                  <div className="text-xs text-slate-400">Cost</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 mb-3">{model.description}</p>

              {/* Specialties */}
              <div className="mb-3">
                <h5 className="text-xs font-medium text-slate-400 mb-1">
                  Specialties:
                </h5>
                <div className="flex flex-wrap gap-1">
                  {model.specialties.map((specialty, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs bg-slate-700/50 text-slate-300"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div>
                <h5 className="text-xs font-medium text-slate-400 mb-1">
                  Key Strengths:
                </h5>
                <div className="space-y-1">
                  {model.strengths.slice(0, 2).map((strength, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 text-xs text-slate-300"
                    >
                      <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                      {strength}
                    </div>
                  ))}
                </div>
              </div>

              {/* Locked Overlay */}
              {isLocked && (
                <div className="absolute inset-0 bg-slate-900/50 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      Model limit reached
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Model Selection Info */}
      <div className="bg-slate-900/30 rounded-lg p-4">
        <h4 className="font-medium text-white mb-2 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          Generation Strategy
        </h4>
        {tier === "basic" && (
          <p className="text-sm text-slate-300">
            Single model generation for fast, cost-effective data creation.
            Perfect for testing and prototyping.
          </p>
        )}
        {tier === "workflow" && (
          <p className="text-sm text-slate-300">
            Multi-model validation ensures higher quality and consistency.
            Models work together to verify accuracy and format compliance.
          </p>
        )}
        {tier === "production" && (
          <p className="text-sm text-slate-300">
            Ensemble consensus validation with up to 5 models provides
            enterprise-grade quality assurance and statistical verification.
          </p>
        )}

        {selectedModels.length > 1 && (
          <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <p className="text-sm text-indigo-300">
              <strong>Selected models:</strong>{" "}
              {selectedModels
                .map((id) => availableModels.find((m) => m.id === id)?.name)
                .join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
