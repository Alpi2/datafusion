"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Workflow, Brain, Building2, GraduationCap } from "lucide-react";
import type { UserType } from "./GenerationInterface";

interface UserTypeDetectorProps {
  onUserTypeChange: (type: UserType) => void;
  currentType: UserType;
  compact?: boolean;
}

export default function UserTypeDetector({
  onUserTypeChange,
  currentType,
  compact = false,
}: UserTypeDetectorProps) {
  const userTypes = [
    {
      id: "simple" as UserType,
      icon: Workflow,
      title: "Quick Builder",
      description: "n8n workflows, simple automation",
      example: "Customer support tickets",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/20",
    },
    {
      id: "advanced" as UserType,
      icon: Brain,
      title: "Power User",
      description: "Custom schemas, optimization",
      example: "Healthcare patient data",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/20",
    },
    {
      id: "enterprise" as UserType,
      icon: Building2,
      title: "Enterprise",
      description: "Bulk generation, compliance",
      example: "ML training datasets",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/20",
    },
    {
      id: "academic" as UserType,
      icon: GraduationCap,
      title: "Researcher",
      description: "Reproducible, citable data",
      example: "Climate modeling data",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      borderColor: "border-orange-400/20",
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-slate-400">I'm a:</span>
        <div className="flex items-center gap-1">
          {userTypes.map((type) => {
            const isSelected = currentType === type.id;
            const Icon = type.icon;

            return (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onUserTypeChange(type.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  isSelected
                    ? `${type.bgColor} ${type.borderColor} border bg-opacity-50 text-white`
                    : "text-slate-300 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? type.color : "text-slate-400"
                  }`}
                />
                {type.title}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mb-12"
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-display font-medium text-muted-foreground mb-2">
          What brings you to Inflectiv?
        </h3>
        <p className="text-sm text-muted-foreground">
          We'll customize the interface to match your workflow
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {userTypes.map((type) => {
          const isSelected = currentType === type.id;
          const Icon = type.icon;

          return (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                onClick={() => onUserTypeChange(type.id)}
                className={`
                  h-auto p-4 flex flex-col items-center gap-3 text-center transition-all duration-200
                  ${
                    isSelected
                      ? `${type.bgColor} ${type.borderColor} border bg-opacity-50`
                      : "hover:bg-card/50 border border-transparent"
                  }
                `}
              >
                <div className={`p-3 rounded-lg ${type.bgColor}`}>
                  <Icon className={`w-6 h-6 ${type.color}`} />
                </div>

                <div>
                  <div className="font-medium text-sm mb-1">{type.title}</div>
                  <div className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    {type.description}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {type.example}
                  </Badge>
                </div>
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Smart Recommendations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-6"
      >
        <div className="text-xs text-muted-foreground">
          {currentType === "simple" &&
            "Perfect for getting started quickly with automated pricing"}
          {currentType === "advanced" &&
            "Unlock schema builders and detailed quality metrics"}
          {currentType === "enterprise" &&
            "Access bulk operations and compliance features"}
          {currentType === "academic" &&
            "Enable citation tracking and reproducibility features"}
        </div>
      </motion.div>
    </motion.div>
  );
}
