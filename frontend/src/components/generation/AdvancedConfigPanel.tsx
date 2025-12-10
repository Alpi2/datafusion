"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { AIModelSelector } from "./AIModelSelector";
import { ValidationPipeline } from "./ValidationPipeline";
import { ComplianceConfig } from "./ComplianceConfig";
import { SchemaBuilder } from "./SchemaBuilder";
import { PersonalizedKnowledgePanel } from "./PersonalizedKnowledgePanel";
import type { GenerationTier } from "./GenerationInterface";

interface AdvancedConfigPanelProps {
  tier: GenerationTier;
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  validationLevel: string;
  onValidationChange: (level: string) => void;
  complianceRequirements: string[];
  onComplianceChange: (requirements: string[]) => void;
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

export function AdvancedConfigPanel({
  tier,
  selectedModels,
  onModelsChange,
  validationLevel,
  onValidationChange,
  complianceRequirements,
  onComplianceChange,
  tierConfig,
}: AdvancedConfigPanelProps) {
  const [personalizedKnowledgeEnabled, setPersonalizedKnowledgeEnabled] =
    useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Personalized Knowledge Panel */}
      <PersonalizedKnowledgePanel
        tier={tier}
        isEnabled={personalizedKnowledgeEnabled}
        onToggle={() =>
          setPersonalizedKnowledgeEnabled(!personalizedKnowledgeEnabled)
        }
      />

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Model Selection */}
        <div className="space-y-6">
          <AIModelSelector
            tier={tier}
            selectedModels={selectedModels}
            onModelsChange={onModelsChange}
            maxModels={tierConfig.aiLimit}
          />

          {/* Schema Builder */}
          <SchemaBuilder tier={tier} />
        </div>

        {/* Validation & Compliance */}
        <div className="space-y-6">
          {tierConfig.validation && (
            <ValidationPipeline
              tier={tier}
              validationLevel={validationLevel}
              onValidationChange={onValidationChange}
            />
          )}

          {tierConfig.compliance && (
            <ComplianceConfig
              requirements={complianceRequirements}
              onRequirementsChange={onComplianceChange}
            />
          )}
        </div>
      </div>

      {/* Advanced Features Summary */}
      <div className="p-6 bg-gradient-to-r from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">
          Configuration Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {selectedModels.length}
            </div>
            <div className="text-xs text-slate-400">AI Models</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">
              {tierConfig.validation ? "Multi" : "Single"}
            </div>
            <div className="text-xs text-slate-400">Validation</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">
              {complianceRequirements.length}
            </div>
            <div className="text-xs text-slate-400">Compliance</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">
              {personalizedKnowledgeEnabled ? "On" : "Off"}
            </div>
            <div className="text-xs text-slate-400">Knowledge</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
