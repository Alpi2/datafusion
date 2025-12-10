"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Brain,
  Shield,
  BarChart3,
  FileCheck,
  Zap,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GenerationTier } from "./GenerationInterface";

interface GenerationProgressProps {
  progress: number;
  currentStep: string;
  tier: GenerationTier;
  selectedModels: string[];
  compact?: boolean;
}

export function GenerationProgress({
  progress,
  currentStep,
  tier,
  selectedModels,
  compact = false,
}: GenerationProgressProps) {
  const getSteps = (tier: GenerationTier) => {
    const baseSteps = [
      {
        name: "Analyzing prompt",
        icon: Brain,
        description: "Understanding your data requirements",
      },
      {
        name: "Generating synthetic data",
        icon: Zap,
        description: "Creating dataset using AI models",
      },
    ];

    if (tier === "workflow") {
      return [
        ...baseSteps,
        {
          name: "Running multi-AI validation",
          icon: CheckCircle2,
          description: "Cross-validating with multiple models",
        },
        {
          name: "Verifying data format",
          icon: FileCheck,
          description: "Ensuring format compliance",
        },
        {
          name: "Creator quality testing",
          icon: Award,
          description: "Final quality assurance checks",
        },
      ];
    }

    if (tier === "production") {
      return [
        ...baseSteps,
        {
          name: "Multi-AI consensus validation",
          icon: CheckCircle2,
          description: "Achieving model consensus",
        },
        {
          name: "Statistical verification",
          icon: BarChart3,
          description: "Validating statistical properties",
        },
        {
          name: "Compliance checking",
          icon: Shield,
          description: "Ensuring regulatory compliance",
        },
        {
          name: "Enterprise quality assurance",
          icon: Award,
          description: "Comprehensive QA testing",
        },
        {
          name: "Final validation",
          icon: CheckCircle2,
          description: "Completing validation pipeline",
        },
      ];
    }

    return baseSteps;
  };

  const steps = getSteps(tier);
  const currentStepIndex = Math.floor((progress / 100) * steps.length);
  const isComplete = progress >= 100;

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "active";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "text-emerald-400 bg-emerald-400/10",
      active: "text-indigo-400 bg-indigo-400/10",
      pending: "text-slate-500 bg-slate-500/10",
    };
    return colors[status as keyof typeof colors];
  };

  const modelNames: Record<string, string> = {
    "gpt-4": "GPT-4 Turbo",
    "claude-3.5": "Claude 3.5",
    "gemini-pro": "Gemini Pro",
    "claude-opus": "Claude Opus",
    "gpt-4-specialist": "GPT-4 Specialist",
    "ensemble-validator": "Ensemble",
  };

  const estimatedTime = {
    basic: "1-2 minutes",
    workflow: "3-8 minutes",
    production: "15-30 minutes",
  };

  if (compact) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <div>
              <h3 className="font-medium text-white">{currentStep}</h3>
              <p className="text-xs text-slate-400">
                {tier} tier • {Math.round(progress)}% complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedModels.map((modelId) => (
              <Badge
                key={modelId}
                variant="outline"
                className="text-xs text-indigo-300 border-indigo-500/30"
              >
                {modelNames[modelId] || modelId}
              </Badge>
            ))}
          </div>
        </div>

        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            Generating Dataset
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {tier.charAt(0).toUpperCase() + tier.slice(1)} tier generation in
            progress
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {Math.round(progress)}%
          </div>
          <div className="text-xs text-slate-400">
            ETA: {estimatedTime[tier]}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-white">
            Overall Progress
          </span>
          <span className="text-sm text-slate-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-slate-900/30 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          </div>
          <div>
            <h4 className="font-medium text-white">{currentStep}</h4>
            <p className="text-sm text-slate-400">
              {isComplete
                ? "Generation completed successfully!"
                : "This may take a few moments..."}
            </p>
          </div>
        </div>

        {/* Active Models */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-400">Active models:</span>
          {selectedModels.map((modelId) => (
            <Badge
              key={modelId}
              variant="outline"
              className="text-xs text-indigo-300 border-indigo-500/30"
            >
              {modelNames[modelId] || modelId}
            </Badge>
          ))}
        </div>
      </div>

      {/* Step Progress */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-white">Generation Steps</h4>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;
          const isCurrentStep = index === currentStepIndex && !isComplete;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                status === "active"
                  ? "border-indigo-500/30 bg-indigo-500/5"
                  : "border-slate-700/50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(
                  status
                )}`}
              >
                {status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : status === "active" ? (
                  <Icon
                    className={`w-4 h-4 ${
                      isCurrentStep ? "animate-pulse" : ""
                    }`}
                  />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5
                    className={`font-medium ${
                      status === "completed"
                        ? "text-emerald-300"
                        : status === "active"
                        ? "text-white"
                        : "text-slate-400"
                    }`}
                  >
                    {step.name}
                  </h5>
                  {status === "completed" && (
                    <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs">
                      Complete
                    </Badge>
                  )}
                  {status === "active" && (
                    <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-xs">
                      In Progress
                    </Badge>
                  )}
                </div>
                <p
                  className={`text-sm ${
                    status === "completed"
                      ? "text-emerald-300/70"
                      : status === "active"
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  {step.description}
                </p>
              </div>
              <div className="text-right">
                {status === "completed" && (
                  <div className="text-xs text-emerald-400">✓</div>
                )}
                {status === "active" && (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Generation Info */}
      <div className="bg-slate-900/30 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {selectedModels.length}
            </div>
            <div className="text-xs text-slate-400">AI Models</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {tier === "basic" ? "85%" : tier === "workflow" ? "94%" : "99%"}
            </div>
            <div className="text-xs text-slate-400">Target Quality</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {tier === "basic"
                ? "CSV"
                : tier === "workflow"
                ? "Multiple"
                : "All"}
            </div>
            <div className="text-xs text-slate-400">Formats</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {tier === "basic"
                ? "No"
                : tier === "workflow"
                ? "Standard"
                : "Full"}
            </div>
            <div className="text-xs text-slate-400">Compliance</div>
          </div>
        </div>
      </div>

      {/* Complete State */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="font-medium text-emerald-300">
                  Generation Complete!
                </h4>
                <p className="text-sm text-emerald-300/70">
                  Your {tier} tier dataset has been successfully generated and
                  validated.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Download Dataset
              </Button>
              <Button
                variant="outline"
                className="border-emerald-500/30 text-emerald-300"
              >
                View Details
              </Button>
              <Button
                variant="outline"
                className="border-emerald-500/30 text-emerald-300"
              >
                Generate Another
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
