"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  BarChart3,
  FileCheck,
  Zap,
  Clock,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GenerationTier } from "./GenerationInterface";

interface ValidationPipelineProps {
  validationLevel: string;
  onValidationChange: (level: string) => void;
  tier: GenerationTier;
}

export function ValidationPipeline({
  validationLevel,
  onValidationChange,
  tier,
}: ValidationPipelineProps) {
  const validationLevels = {
    workflow: [
      {
        id: "standard",
        name: "Standard Validation",
        description: "Multi-AI cross-validation with format checking",
        duration: "2-3 minutes",
        checks: [
          "Schema compliance verification",
          "Data type consistency",
          "Format validation (CSV, JSON, Parquet)",
          "Basic statistical tests",
          "Duplicate detection",
          "Missing value analysis",
        ],
        quality: 94,
        recommended: true,
      },
      {
        id: "enhanced",
        name: "Enhanced Validation",
        description: "Advanced validation with domain-specific checks",
        duration: "4-6 minutes",
        checks: [
          "All standard checks",
          "Domain-specific validation rules",
          "Advanced statistical analysis",
          "Outlier detection",
          "Correlation analysis",
          "Data distribution verification",
          "Creator testing suite",
        ],
        quality: 97,
        recommended: false,
      },
    ],
    production: [
      {
        id: "enterprise",
        name: "Enterprise Validation",
        description: "Comprehensive validation for production systems",
        duration: "10-15 minutes",
        checks: [
          "Multi-model consensus validation",
          "Statistical significance testing",
          "Data quality scoring",
          "Bias detection and mitigation",
          "Edge case validation",
          "Performance benchmarking",
          "Regression testing",
          "Data lineage verification",
        ],
        quality: 99,
        recommended: true,
      },
      {
        id: "regulatory",
        name: "Regulatory Compliance",
        description: "Maximum validation for regulated industries",
        duration: "20-30 minutes",
        checks: [
          "All enterprise checks",
          "Regulatory compliance verification",
          "Audit trail generation",
          "Privacy impact assessment",
          "Data governance validation",
          "Industry standard compliance",
          "Third-party verification",
          "Certification documentation",
        ],
        quality: 99.5,
        recommended: false,
      },
    ],
  };

  const availableLevels =
    validationLevels[tier as keyof typeof validationLevels] || [];

  const validationSteps = [
    {
      name: "Schema Validation",
      description: "Verify data structure and types",
      icon: FileCheck,
      status: "active",
    },
    {
      name: "Multi-AI Cross-Check",
      description: "Compare outputs across models",
      icon: Zap,
      status: tier === "workflow" ? "active" : "enhanced",
    },
    {
      name: "Statistical Testing",
      description: "Analyze distributions and patterns",
      icon: BarChart3,
      status: tier === "production" ? "active" : "optional",
    },
    {
      name: "Compliance Check",
      description: "Verify regulatory requirements",
      icon: Shield,
      status: tier === "production" ? "active" : "disabled",
    },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      active: "text-emerald-400 bg-emerald-400/10",
      enhanced: "text-blue-400 bg-blue-400/10",
      optional: "text-yellow-400 bg-yellow-400/10",
      disabled: "text-slate-500 bg-slate-500/10",
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusIcon = (status: string) => {
    if (status === "active" || status === "enhanced") return CheckCircle2;
    if (status === "optional") return AlertTriangle;
    return Clock;
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Validation Pipeline
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Configure validation and quality assurance for your {tier} tier
            dataset
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-indigo-300 border-indigo-500/30"
        >
          {tier === "workflow"
            ? "Multi-AI Validation"
            : "Enterprise Validation"}
        </Badge>
      </div>

      {/* Validation Level Selection */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-white">Validation Level</h4>
        {availableLevels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
              validationLevel === level.id
                ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                : "border-slate-700 hover:border-slate-600"
            }`}
            onClick={() => onValidationChange(level.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h5 className="font-semibold text-white">{level.name}</h5>
                  {level.recommended && (
                    <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30 text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-2">
                  {level.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {level.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {level.quality}% Quality Score
                  </div>
                </div>
              </div>
              <div className="text-right">
                {validationLevel === level.id ? (
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-slate-600 rounded-full" />
                )}
              </div>
            </div>

            {/* Validation Checks */}
            <div className="space-y-2">
              <h6 className="text-xs font-medium text-slate-400">
                Validation Checks:
              </h6>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                {level.checks.slice(0, 6).map((check, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    {check}
                  </div>
                ))}
              </div>
              {level.checks.length > 6 && (
                <p className="text-xs text-slate-400 ml-5">
                  +{level.checks.length - 6} additional checks...
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Validation Pipeline Overview */}
      <div className="bg-slate-900/30 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Pipeline Steps
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {validationSteps.map((step, index) => {
            const Icon = step.icon;
            const StatusIcon = getStatusIcon(step.status);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`relative p-3 rounded-lg border ${
                  step.status === "disabled"
                    ? "border-slate-700/50 opacity-60"
                    : "border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(
                      step.status
                    )}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <StatusIcon
                    className={`w-4 h-4 ${
                      getStatusColor(step.status).split(" ")[0]
                    }`}
                  />
                </div>
                <h5 className="font-medium text-white text-sm mb-1">
                  {step.name}
                </h5>
                <p className="text-xs text-slate-400">{step.description}</p>

                {step.status === "disabled" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
                    <Badge
                      variant="outline"
                      className="text-xs text-slate-500 border-slate-600"
                    >
                      Upgrade Required
                    </Badge>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quality Guarantee */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">Quality Guarantee</h4>
            <p className="text-sm text-slate-300">
              {tier === "workflow"
                ? "Multi-AI validation ensures 94%+ quality score with format verification"
                : "Enterprise validation provides 99%+ quality with full compliance checking"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
