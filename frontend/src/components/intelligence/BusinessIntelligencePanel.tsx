"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Target,
  DollarSign,
  Zap,
  ExternalLink,
  Brain,
  BarChart3,
  Users,
  Building,
  Sparkles,
  ArrowRight,
  Calculator,
  Search,
  Lightbulb,
  Globe,
  Filter,
  Star,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BusinessIntelligencePanelProps {
  datasetDescription: string;
  tier: string;
  isVisible: boolean;
}

interface AutomationMatch {
  id: string;
  platform: "n8n" | "make" | "zapier";
  name: string;
  description: string;
  useCase: string;
  compatibility: number;
  monthlyRevenue: { min: number; max: number };
  difficulty: "Easy" | "Medium" | "Advanced";
  integrations: string[];
  directLink: string;
  color: string;
}

interface MarketGap {
  id: string;
  title: string;
  description: string;
  opportunity: string;
  marketSize: string;
  competition: "Low" | "Medium" | "High";
  revenue: { min: number; max: number };
  timeToMarket: string;
  confidence: number;
}

interface EnterpriseOpportunity {
  id: string;
  industry: string;
  useCase: string;
  description: string;
  marketValue: string;
  buyers: string[];
  revenue: { min: number; max: number };
  requirements: string[];
}

export function BusinessIntelligencePanel({
  datasetDescription,
  tier,
  isVisible,
}: BusinessIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<
    "automations" | "gaps" | "enterprise"
  >("automations");
  const [automationMatches, setAutomationMatches] = useState<AutomationMatch[]>(
    []
  );
  const [marketGaps, setMarketGaps] = useState<MarketGap[]>([]);
  const [enterpriseOps, setEnterpriseOps] = useState<EnterpriseOpportunity[]>(
    []
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalRevenuePotential, setTotalRevenuePotential] = useState(0);

  // Simulate AI analysis of data monetization opportunities
  useEffect(() => {
    if (isVisible && datasetDescription) {
      setIsAnalyzing(true);

      // Simulate analysis delay
      setTimeout(() => {
        generateAutomationMatches();
        generateMarketGaps();
        generateEnterpriseOpportunities();
        setIsAnalyzing(false);
      }, 2000);
    }
  }, [isVisible, datasetDescription]);

  const generateAutomationMatches = () => {
    const matches: AutomationMatch[] = [
      {
        id: "crm-sync",
        platform: "zapier",
        name: "CRM Data Sync",
        description: "Automated customer data synchronization for CRM systems",
        useCase: "Sales pipeline automation with enriched customer profiles",
        compatibility: 94,
        monthlyRevenue: { min: 500, max: 2500 },
        difficulty: "Easy",
        integrations: ["Salesforce", "HubSpot", "Pipedrive"],
        directLink: "https://zapier.com/apps/salesforce/integrations",
        color: "orange",
      },
      {
        id: "workflow-automation",
        platform: "n8n",
        name: "Data Workflow Builder",
        description: "Custom workflow automation for data processing",
        useCase: "Enterprise data validation and enrichment pipelines",
        compatibility: 88,
        monthlyRevenue: { min: 1000, max: 5000 },
        difficulty: "Medium",
        integrations: ["PostgreSQL", "MongoDB", "APIs"],
        directLink: "https://n8n.io/workflows/",
        color: "red",
      },
      {
        id: "marketing-automation",
        platform: "make",
        name: "Marketing Data Engine",
        description: "Automated marketing campaign data management",
        useCase: "Personalized marketing automation with synthetic personas",
        compatibility: 92,
        monthlyRevenue: { min: 800, max: 3500 },
        difficulty: "Easy",
        integrations: ["Mailchimp", "Meta Ads", "Google Analytics"],
        directLink: "https://www.make.com/en/templates",
        color: "purple",
      },
    ];
    setAutomationMatches(matches);

    // Calculate total revenue potential
    const total = matches.reduce(
      (sum, match) => sum + match.monthlyRevenue.max,
      0
    );
    setTotalRevenuePotential(total);
  };

  const generateMarketGaps = () => {
    const gaps: MarketGap[] = [
      {
        id: "ai-training-data",
        title: "AI Training Dataset Marketplace",
        description: "Specialized datasets for machine learning model training",
        opportunity:
          "Create niche AI training datasets for emerging industries",
        marketSize: "$2.8B by 2025",
        competition: "Low",
        revenue: { min: 2000, max: 15000 },
        timeToMarket: "2-3 months",
        confidence: 87,
      },
      {
        id: "compliance-testing",
        title: "Compliance Testing Data",
        description: "Synthetic data for regulatory compliance testing",
        opportunity: "GDPR, HIPAA compliant test datasets for enterprises",
        marketSize: "$1.2B annually",
        competition: "Medium",
        revenue: { min: 5000, max: 25000 },
        timeToMarket: "3-4 months",
        confidence: 92,
      },
      {
        id: "simulation-modeling",
        title: "Digital Twin Simulation Data",
        description: "IoT and simulation modeling datasets",
        opportunity: "Manufacturing and smart city simulation data",
        marketSize: "$4.1B by 2026",
        competition: "Low",
        revenue: { min: 3000, max: 20000 },
        timeToMarket: "4-6 months",
        confidence: 79,
      },
    ];
    setMarketGaps(gaps);
  };

  const generateEnterpriseOpportunities = () => {
    const opportunities: EnterpriseOpportunity[] = [
      {
        id: "fintech-risk",
        industry: "Financial Services",
        useCase: "Risk Assessment Modeling",
        description:
          "Synthetic financial transaction data for risk model training",
        marketValue: "$500K - $2M per enterprise",
        buyers: ["JPMorgan Chase", "Goldman Sachs", "Wells Fargo"],
        revenue: { min: 10000, max: 50000 },
        requirements: ["SOX Compliance", "PCI DSS", "Advanced Validation"],
      },
      {
        id: "healthcare-research",
        industry: "Healthcare",
        useCase: "Medical Research Data",
        description: "HIPAA-compliant patient data for pharmaceutical research",
        marketValue: "$1M - $5M per study",
        buyers: ["Pfizer", "Johnson & Johnson", "Moderna"],
        revenue: { min: 25000, max: 100000 },
        requirements: [
          "HIPAA Compliance",
          "IRB Approval",
          "Statistical Validation",
        ],
      },
      {
        id: "retail-personalization",
        industry: "Retail & E-commerce",
        useCase: "Customer Behavior Analytics",
        description:
          "Synthetic customer journey data for personalization engines",
        marketValue: "$200K - $1M per implementation",
        buyers: ["Amazon", "Walmart", "Target"],
        revenue: { min: 5000, max: 30000 },
        requirements: [
          "GDPR Compliance",
          "Real-time Processing",
          "API Integration",
        ],
      },
    ];
    setEnterpriseOps(opportunities);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "zapier":
        return "⚡";
      case "n8n":
        return "🔗";
      case "make":
        return "🔧";
      default:
        return "🔧";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "zapier":
        return "orange";
      case "n8n":
        return "red";
      case "make":
        return "purple";
      default:
        return "blue";
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 p-6 bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Business Data Intelligence
            </h2>
            <p className="text-sm text-slate-400">
              AI-powered monetization opportunities for your data
            </p>
          </div>
        </div>

        {/* Revenue Potential */}
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">
            ${totalRevenuePotential.toLocaleString()}/mo
          </div>
          <div className="text-xs text-slate-400">Potential Revenue</div>
        </div>
      </div>

      {/* Analysis Status */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-5 h-5 text-blue-400" />
              </motion.div>
              <div>
                <h4 className="font-medium text-blue-300">
                  AI Analysis in Progress
                </h4>
                <p className="text-sm text-blue-200/80">
                  Analyzing market opportunities, automation matches, and
                  revenue potential...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-slate-800/50 rounded-xl">
        {[
          { id: "automations", name: "Automation Matches", icon: Zap },
          { id: "gaps", name: "Market Gaps", icon: Target },
          { id: "enterprise", name: "Enterprise Sales", icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "automations" | "gaps" | "enterprise")
              }
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Automation Matches */}
        {activeTab === "automations" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Compatible Automations
              </h3>
              <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                {automationMatches.length} matches found
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {automationMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-all"
                >
                  {/* Platform Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getPlatformIcon(match.platform)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs text-${getPlatformColor(
                          match.platform
                        )}-300 border-${getPlatformColor(
                          match.platform
                        )}-500/30`}
                      >
                        {match.platform.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-400">
                        {match.compatibility}% match
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h4 className="font-semibold text-white mb-2">
                    {match.name}
                  </h4>
                  <p className="text-sm text-slate-400 mb-3">
                    {match.description}
                  </p>

                  {/* Use Case */}
                  <div className="p-3 bg-slate-900/40 rounded-lg mb-4">
                    <p className="text-xs text-slate-300">{match.useCase}</p>
                  </div>

                  {/* Revenue & Difficulty */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        ${match.monthlyRevenue.min.toLocaleString()} - $
                        {match.monthlyRevenue.max.toLocaleString()}/mo
                      </div>
                      <div className="text-xs text-slate-400">
                        Potential Revenue
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        match.difficulty === "Easy"
                          ? "text-emerald-300 border-emerald-500/30"
                          : match.difficulty === "Medium"
                          ? "text-yellow-300 border-yellow-500/30"
                          : "text-red-300 border-red-500/30"
                      }`}
                    >
                      {match.difficulty}
                    </Badge>
                  </div>

                  {/* Integrations */}
                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">
                      Integrations:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {match.integrations.map((integration) => (
                        <Badge
                          key={integration}
                          variant="outline"
                          className="text-xs"
                        >
                          {integration}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => window.open(match.directLink, "_blank")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    size="sm"
                  >
                    View on {match.platform}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Market Gaps */}
        {activeTab === "gaps" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                AI-Identified Market Opportunities
              </h3>
              <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30">
                {marketGaps.length} opportunities
              </Badge>
            </div>

            <div className="space-y-4">
              {marketGaps.map((gap) => (
                <motion.div
                  key={gap.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {gap.title}
                          </h4>
                          <p className="text-slate-400 mb-3">
                            {gap.description}
                          </p>
                          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <h5 className="font-medium text-purple-300 mb-1">
                              Opportunity
                            </h5>
                            <p className="text-sm text-purple-200/80">
                              {gap.opportunity}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`ml-4 ${
                            gap.confidence >= 90
                              ? "text-emerald-300 border-emerald-500/30"
                              : gap.confidence >= 80
                              ? "text-yellow-300 border-yellow-500/30"
                              : "text-orange-300 border-orange-500/30"
                          }`}
                        >
                          {gap.confidence}% confidence
                        </Badge>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900/40 rounded-lg">
                        <h5 className="font-medium text-white mb-3">
                          Market Metrics
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-slate-400">
                              Market Size
                            </div>
                            <div className="text-lg font-semibold text-emerald-400">
                              {gap.marketSize}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">
                              Competition
                            </div>
                            <Badge
                              variant="outline"
                              className={`${
                                gap.competition === "Low"
                                  ? "text-emerald-300 border-emerald-500/30"
                                  : gap.competition === "Medium"
                                  ? "text-yellow-300 border-yellow-500/30"
                                  : "text-red-300 border-red-500/30"
                              }`}
                            >
                              {gap.competition}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">
                              Revenue Potential
                            </div>
                            <div className="text-sm font-semibold text-white">
                              ${gap.revenue.min.toLocaleString()} - $
                              {gap.revenue.max.toLocaleString()}/mo
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">
                              Time to Market
                            </div>
                            <div className="text-sm text-white">
                              {gap.timeToMarket}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Build This Opportunity
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Enterprise Opportunities */}
        {activeTab === "enterprise" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Enterprise Sales Opportunities
              </h3>
              <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                High-value targets
              </Badge>
            </div>

            <div className="space-y-6">
              {enterpriseOps.map((op) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Opportunity Details */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Building className="w-5 h-5 text-blue-400" />
                        <Badge
                          variant="outline"
                          className="text-blue-300 border-blue-500/30"
                        >
                          {op.industry}
                        </Badge>
                      </div>

                      <h4 className="text-lg font-semibold text-white mb-2">
                        {op.useCase}
                      </h4>
                      <p className="text-slate-400 mb-4">{op.description}</p>

                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                        <h5 className="font-medium text-blue-300 mb-2">
                          Market Value
                        </h5>
                        <div className="text-lg font-bold text-white">
                          {op.marketValue}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-white mb-2">
                          Requirements
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {op.requirements.map((req) => (
                            <Badge
                              key={req}
                              variant="outline"
                              className="text-xs"
                            >
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Buyers & Revenue */}
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900/40 rounded-lg">
                        <h5 className="font-medium text-white mb-3">
                          Potential Buyers
                        </h5>
                        <div className="space-y-2">
                          {op.buyers.map((buyer) => (
                            <div
                              key={buyer}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-slate-300">
                                {buyer}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <h5 className="font-medium text-emerald-300 mb-2">
                          Revenue Potential
                        </h5>
                        <div className="text-xl font-bold text-white">
                          ${op.revenue.min.toLocaleString()} - $
                          {op.revenue.max.toLocaleString()}/mo
                        </div>
                        <div className="text-sm text-emerald-200/80 mt-1">
                          Per enterprise client
                        </div>
                      </div>

                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Globe className="w-4 h-4 mr-2" />
                        Generate Sales Proposal
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>AI analysis updated in real-time based on your dataset</span>
          </div>
          <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
            <Calculator className="w-4 h-4 mr-2" />
            Generate Data & Start Building
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
