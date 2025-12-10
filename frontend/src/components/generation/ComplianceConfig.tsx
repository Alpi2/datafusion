"use client";

import { motion } from "framer-motion";
import {
  Shield,
  AlertCircle,
  CheckCircle2,
  FileText,
  Globe,
  Users,
  Lock,
  Award,
  Eye,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ComplianceConfigProps {
  requirements: string[];
  onRequirementsChange: (requirements: string[]) => void;
}

export function ComplianceConfig({
  requirements,
  onRequirementsChange,
}: ComplianceConfigProps) {
  const complianceStandards = [
    {
      id: "gdpr",
      name: "GDPR",
      fullName: "General Data Protection Regulation",
      region: "EU",
      description: "European data protection and privacy regulation",
      icon: Globe,
      category: "Privacy",
      requirements: [
        "Data minimization principles",
        "Purpose limitation",
        "Storage limitation",
        "Pseudonymization support",
        "Right to be forgotten compliance",
        "Consent management",
      ],
      impact: "Ensures EU privacy compliance for European users",
      mandatory: ["financial", "healthcare", "retail"],
    },
    {
      id: "hipaa",
      name: "HIPAA",
      fullName: "Health Insurance Portability and Accountability Act",
      region: "US",
      description: "US healthcare data protection standard",
      icon: FileText,
      category: "Healthcare",
      requirements: [
        "PHI protection standards",
        "Access control implementation",
        "Audit trail requirements",
        "Data encryption standards",
        "Business associate agreements",
        "Breach notification procedures",
      ],
      impact: "Required for US healthcare data processing",
      mandatory: ["healthcare", "medical-research"],
    },
    {
      id: "ccpa",
      name: "CCPA",
      fullName: "California Consumer Privacy Act",
      region: "US-CA",
      description: "California consumer privacy protection",
      icon: Users,
      category: "Privacy",
      requirements: [
        "Consumer right to know",
        "Right to delete personal information",
        "Right to opt-out of sale",
        "Non-discrimination requirements",
        "Data category disclosure",
        "Third-party sharing transparency",
      ],
      impact: "Covers California residents and businesses",
      mandatory: ["retail", "marketing", "advertising"],
    },
    {
      id: "sox",
      name: "SOX",
      fullName: "Sarbanes-Oxley Act",
      region: "US",
      description: "Financial reporting and corporate governance",
      icon: Scale,
      category: "Financial",
      requirements: [
        "Financial data accuracy",
        "Internal control assessment",
        "Audit trail maintenance",
        "Data retention policies",
        "Change management controls",
        "Executive certification",
      ],
      impact: "Required for public companies and financial reporting",
      mandatory: ["financial", "accounting", "public-company"],
    },
    {
      id: "pci-dss",
      name: "PCI DSS",
      fullName: "Payment Card Industry Data Security Standard",
      region: "Global",
      description: "Credit card data protection standard",
      icon: Lock,
      category: "Payment",
      requirements: [
        "Secure network maintenance",
        "Cardholder data protection",
        "Vulnerability management",
        "Access control measures",
        "Network monitoring",
        "Information security policy",
      ],
      impact: "Required for credit card data processing",
      mandatory: ["payment", "e-commerce", "financial"],
    },
    {
      id: "iso-27001",
      name: "ISO 27001",
      fullName: "Information Security Management System",
      region: "Global",
      description: "International information security standard",
      icon: Award,
      category: "Security",
      requirements: [
        "Information security policy",
        "Risk assessment procedures",
        "Security control implementation",
        "Incident management",
        "Business continuity planning",
        "Continuous improvement",
      ],
      impact: "Global information security best practices",
      mandatory: ["enterprise", "government", "critical-infrastructure"],
    },
  ];

  const isSelected = (standardId: string) => requirements.includes(standardId);

  const handleToggle = (standardId: string) => {
    if (isSelected(standardId)) {
      onRequirementsChange(requirements.filter((id) => id !== standardId));
    } else {
      onRequirementsChange([...requirements, standardId]);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Privacy: "bg-blue-500/10 text-blue-300 border-blue-500/30",
      Healthcare: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      Financial: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
      Payment: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      Security: "bg-red-500/10 text-red-300 border-red-500/30",
    };
    return (
      colors[category as keyof typeof colors] ||
      "bg-slate-500/10 text-slate-300 border-slate-500/30"
    );
  };

  const selectedStandards = complianceStandards.filter((std) =>
    isSelected(std.id)
  );
  const estimatedTime = selectedStandards.length * 5; // 5 minutes per standard
  const complianceScore =
    selectedStandards.length > 0 ? 95 + selectedStandards.length * 0.8 : 0;

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Compliance Configuration
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Select compliance standards for your production-grade dataset
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">
            {requirements.length} standard{requirements.length !== 1 ? "s" : ""}{" "}
            selected
          </div>
          {requirements.length > 0 && (
            <div className="text-xs text-purple-400">
              ~{estimatedTime} min validation
            </div>
          )}
        </div>
      </div>

      {/* Compliance Standards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {complianceStandards.map((standard, index) => {
          const isChecked = isSelected(standard.id);
          const Icon = standard.icon;

          return (
            <motion.div
              key={standard.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                isChecked
                  ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                  : "border-slate-700 hover:border-slate-600"
              }`}
              onClick={() => handleToggle(standard.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900/50 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">
                        {standard.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className={getCategoryColor(standard.category)}
                      >
                        {standard.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      {standard.fullName}
                    </p>
                    <p className="text-xs text-slate-500">{standard.region}</p>
                  </div>
                </div>
                <div>
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-slate-600 rounded-full" />
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 mb-3">
                {standard.description}
              </p>

              {/* Key Requirements */}
              <div className="mb-3">
                <h5 className="text-xs font-medium text-slate-400 mb-2">
                  Key Requirements:
                </h5>
                <div className="space-y-1">
                  {standard.requirements.slice(0, 3).map((req, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-300"
                    >
                      <div className="w-1 h-1 bg-indigo-400 rounded-full flex-shrink-0" />
                      {req}
                    </div>
                  ))}
                  {standard.requirements.length > 3 && (
                    <p className="text-xs text-slate-400 ml-3">
                      +{standard.requirements.length - 3} more requirements...
                    </p>
                  )}
                </div>
              </div>

              {/* Impact */}
              <div className="p-2 bg-slate-900/30 rounded-lg">
                <p className="text-xs text-slate-400">
                  <strong>Impact:</strong> {standard.impact}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Compliance Summary */}
      {requirements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/30 rounded-lg p-4 mb-4"
        >
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Compliance Summary
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-800/30 rounded-lg">
              <div className="text-lg font-semibold text-white">
                {requirements.length}
              </div>
              <div className="text-xs text-slate-400">Standards Selected</div>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-lg">
              <div className="text-lg font-semibold text-emerald-400">
                {complianceScore.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">Compliance Score</div>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-lg">
              <div className="text-lg font-semibold text-white">
                ~{estimatedTime}min
              </div>
              <div className="text-xs text-slate-400">Validation Time</div>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-medium text-slate-400">
              Selected Standards:
            </h5>
            <div className="flex flex-wrap gap-2">
              {selectedStandards.map((standard) => (
                <Badge
                  key={standard.id}
                  variant="outline"
                  className="text-xs border-indigo-500/30 text-indigo-300"
                >
                  {standard.name} ({standard.region})
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Compliance Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-300 mb-1">
              Compliance Notice
            </h4>
            <p className="text-sm text-yellow-200/80">
              Compliance validation adds significant processing time but ensures
              your dataset meets regulatory requirements.
              {requirements.length === 0 &&
                " Select at least one standard for production-grade compliance."}
            </p>
            {requirements.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-500/5 rounded border border-yellow-500/10">
                <p className="text-xs text-yellow-200/70">
                  Your dataset will be validated against {requirements.length}{" "}
                  compliance standard{requirements.length !== 1 ? "s" : ""}
                  and include automated compliance documentation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
