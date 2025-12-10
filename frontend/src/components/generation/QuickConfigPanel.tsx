"use client";

import React from "react";
import { Brain, Shield, Zap, FileText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GenerationTier } from "./GenerationInterface";

interface QuickConfigPanelProps {
  tier: GenerationTier;
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
}

export function QuickConfigPanel({ tier, tierConfig }: QuickConfigPanelProps) {
  const getAIModels = (tier: GenerationTier) => {
    const models = {
      basic: ["GPT-4 Turbo"],
      workflow: ["GPT-4 Turbo", "Claude 3.5", "Gemini Pro"],
      production: [
        "GPT-4 Turbo",
        "Claude 3.5",
        "Gemini Pro",
        "Claude Opus",
        "Ensemble",
      ],
    };
    return models[tier] || models.basic;
  };

  const getValidation = (tier: GenerationTier) => {
    const validation = {
      basic: "Community quality check",
      workflow: "Multi-AI validation + format verification",
      production: "Full enterprise validation + statistical verification",
    };
    return validation[tier];
  };

  const getCompliance = (tier: GenerationTier) => {
    const compliance = {
      basic: "Basic data privacy",
      workflow: "Standard compliance ready",
      production: "Full regulatory compliance (GDPR, HIPAA, etc.)",
    };
    return compliance[tier];
  };

  const models = getAIModels(tier);

  return (
    <div className="border-t border-slate-700/50 pt-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AI Models */}
        <div className="bg-slate-900/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-indigo-400" />
            <h3 className="font-medium text-white text-sm">AI Models</h3>
            <Badge variant="outline" className="text-xs">
              {models.length} model{models.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="space-y-2">
            {models.slice(0, 2).map((model, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="text-sm text-slate-300">{model}</span>
              </div>
            ))}
            {models.length > 2 && (
              <div className="text-xs text-slate-400">
                +{models.length - 2} more models...
              </div>
            )}
          </div>
        </div>

        {/* Validation */}
        <div className="bg-slate-900/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="font-medium text-white text-sm">Validation</h3>
            {tierConfig.validation && (
              <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs">
                Enhanced
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-300">{getValidation(tier)}</p>
        </div>

        {/* Compliance */}
        <div className="bg-slate-900/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-purple-400" />
            <h3 className="font-medium text-white text-sm">Compliance</h3>
            {tierConfig.compliance && (
              <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs">
                Full
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-300">{getCompliance(tier)}</p>
        </div>
      </div>

      {/* Features Summary */}
      <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-indigo-300 mb-1">
              What you get with {tierConfig.name}:
            </h4>
            <div className="flex flex-wrap gap-2">
              {tierConfig.features.slice(0, 3).map((feature, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs text-indigo-300 border-indigo-500/30"
                >
                  {feature}
                </Badge>
              ))}
              {tierConfig.features.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs text-slate-400 border-slate-600/30"
                >
                  +{tierConfig.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
