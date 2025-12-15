"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/auth";
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
import generationAPI from "@/lib/api/generation";

export type UserType = "simple" | "advanced" | "enterprise" | "academic";
export type GenerationTier = "basic" | "workflow" | "production";

/*
  TODO (UX roadmap):
  - Add `previewRows` prop (number) to allow parent components or onboarding to request a small preview before full generation.
  - Add `onEstimate` callback prop to receive cost/ETA estimates from the estimator UI.
  - Consider extracting Preview and Estimator into separate components under `components/generation/preview`.
  Implementation notes:
  - Wire preview flow to `generationAPI.validate` or a lightweight preview endpoint.
  - Estimator should read selected `tier`, `aiModels`, and requested `rowCount`.
*/

type GenerationInterfaceProps = {
  previewRows?: number;
  onEstimate?: (est: any) => void;
};

export default function GenerationInterface({
  previewRows = 5,
  onEstimate,
}: GenerationInterfaceProps) {
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
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [estimate, setEstimate] = useState<any | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generatedDatasetName, setGeneratedDatasetName] = useState("");
  const [generatedDatasetDesc, setGeneratedDatasetDesc] = useState("");
  const [generatedDatasetId, setGeneratedDatasetId] = useState<string | null>(
    null
  );
  const [currentSchema, setCurrentSchema] = useState<any>(null);
  const [availableSchemas, setAvailableSchemas] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showValidationPanel, setShowValidationPanel] = useState(false);

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

  // load schemas, templates and job history
  useEffect(() => {
    (async () => {
      try {
        const schemas = await generationAPI.getSchemas();
        setAvailableSchemas(Array.isArray(schemas) ? schemas : []);
      } catch (e) {
        // ignore
      }
      try {
        const templates = await generationAPI.getTemplates();
        setAvailableTemplates(Array.isArray(templates) ? templates : []);
      } catch (e) {
        // ignore
      }
      try {
        const history = await generationAPI.getHistory(1, 20);
        setJobHistory(history?.jobs || history || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Initialize socket.io client
  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token = getAuthToken();
    const s = io(backendUrl, { auth: { token } });
    setSocket(s);
    s.on("connect", () => {
      console.info("Socket connected", s.id);
    });
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  // Resume any active job from localStorage
  useEffect(() => {
    const storedJobId = localStorage.getItem("activeJobId");
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    if (storedJobId) {
      setActiveJobId(storedJobId);
      // subscribe to socket room
      socket?.emit("subscribe-job", storedJobId);
      // live progress listener will be attached by effect when `socket` and `activeJobId` are set
      // fetch current status
      (async () => {
        try {
          const status = await generationAPI.getStatus(storedJobId);
          const job = status;
          setGenerationProgress(job.progress || 0);
          setCurrentStep(job.currentStep || "");
          if (job.status === "completed") {
            setResultUrl(job.resultUrl || null);
            setShowDatasetPreview(true);
            setIsGenerating(false);
            localStorage.removeItem("activeJobId");
          } else if (job.status === "failed") {
            setIsGenerating(false);
            setCurrentStep(
              job.errorMessage || job.currentStep || "Generation failed"
            );
            localStorage.removeItem("activeJobId");
          } else {
            setIsGenerating(true);
          }
        } catch (e) {
          console.warn("Could not resume job", e);
        }
      })();
    }
  }, [socket]);

  // Keep a ref copy of activeJobId for stable handler access
  useEffect(() => {
    activeJobIdRef.current = activeJobId;
  }, [activeJobId]);

  // Stable job-progress handler
  const jobProgressHandler = useCallback((payload: any) => {
    if (!payload) return;
    const incomingId = payload?.jobId ?? payload?.id;
    // If payload provides an id, ensure it matches the active job id
    if (incomingId && incomingId !== activeJobIdRef.current) return;

    setGenerationProgress(payload.progress ?? 0);
    setCurrentStep(payload.currentStep ?? "");

    if (payload.status === "completed") {
      setResultUrl(payload.resultUrl || null);
      if (payload.datasetId) setGeneratedDatasetId(payload.datasetId as string);
      setShowDatasetPreview(true);
      setIsGenerating(false);
      localStorage.removeItem("activeJobId");
    }

    if (payload.status === "failed") {
      setIsGenerating(false);
      setCurrentStep(
        payload?.errorMessage ?? payload.currentStep ?? "Generation failed"
      );
      localStorage.removeItem("activeJobId");
    }
  }, []);

  // Register/unregister the stable handler when socket and activeJobId change
  useEffect(() => {
    const s = socket;
    if (!s || !activeJobId) return;

    s.emit("subscribe-job", activeJobId);
    s.on("job-progress", jobProgressHandler);

    return () => {
      if (s) {
        s.off("job-progress", jobProgressHandler);
        s.emit("unsubscribe-job", activeJobId);
      }
    };
  }, [socket, activeJobId, jobProgressHandler]);

  const handleStartGeneration = async (
    prompt: string,
    config: Record<string, unknown>
  ) => {
    try {
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

      // apiClient / generationAPI handles auth headers via centralized auth helper

      // run lightweight preview/estimation first
      const previewBody = {
        prompt,
        tier: selectedTier,
        schema: (config as any)?.schema ?? undefined,
        rowCount: previewRows,
      };
      try {
        const previewRes = await generationAPI.preview(previewBody);
        setEstimate(previewRes?.estimate ?? null);
        setPreviewData(previewRes?.preview ?? null);
        if (onEstimate) onEstimate(previewRes?.estimate ?? null);
      } catch (e) {
        // ignore preview failures, continue to full generation
      }

      const body = {
        prompt,
        tier: selectedTier,
        schema: (config as any)?.schema ?? undefined,
        aiModels: selectedAIModels,
        validationLevel,
        complianceRequirements,
        // attach knowledge/context if present
        knowledgeDocumentIds: JSON.parse(
          localStorage.getItem("knowledgeDocumentIds") || "[]"
        ),
        chatContext: localStorage.getItem("chatContext") || undefined,
      };

      const { jobId } = await generationAPI.create(body);
      setActiveJobId(jobId);
      localStorage.setItem("activeJobId", jobId);

      // push to local job history
      setJobHistory((h) => [
        { jobId, status: "pending", progress: 0, prompt },
        ...h,
      ]);

      // Subscribe to socket room and attach shared progress listener
      if (socket) {
        socket.emit("subscribe-job", jobId);
        // effect will attach the shared job-progress listener
      }
    } catch (error: any) {
      console.error("Generation start error", error);
      setIsGenerating(false);
      setCurrentStep("Generation failed");
    }
  };

  // Listen for onboarding sample run events (dispatched by OnboardingTour)
  useEffect(() => {
    const listener = (e: any) => {
      try {
        const detail = e?.detail || {};
        const prompt = detail.prompt || "Generate 5 realistic sample rows";
        if (detail.tier) setSelectedTier(detail.tier as GenerationTier);
        // kick off generation using default previewRows (prop)
        // pass schema or other config via detail
        handleStartGeneration(prompt, { schema: detail.schema });
      } catch (err) {
        console.warn("onboarding run sample handler error", err);
      }
    };

    window.addEventListener("onboarding:run-sample", listener as EventListener);
    return () =>
      window.removeEventListener(
        "onboarding:run-sample",
        listener as EventListener
      );
  }, [handleStartGeneration]);

  const handleCancelJob = async (jobId: string) => {
    try {
      const res = await generationAPI.cancelJob(jobId);
      if ((res as any)?.success) {
        setJobHistory((h) =>
          h.map((j) => (j.jobId === jobId ? { ...j, status: "cancelled" } : j))
        );
        if (activeJobId === jobId) {
          setIsGenerating(false);
          setActiveJobId(null);
          localStorage.removeItem("activeJobId");
        }
      }
    } catch (e) {
      console.warn("Cancel job failed", e);
    }
  };

  const handleValidate = async (previewConfig: any) => {
    try {
      const res = await generationAPI.validate(previewConfig);
      setValidationResult(res);
      setValidationError(null);
      setShowValidationPanel(true);
      return res;
    } catch (e: any) {
      console.warn("Validation failed", e);
      setValidationResult(null);
      setValidationError(e?.message || "Validation failed");
      setShowValidationPanel(true);
      return null;
    }
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
                        validationResult={validationResult}
                        complianceRequirements={complianceRequirements}
                        onComplianceChange={setComplianceRequirements}
                        tierConfig={tierConfig[selectedTier]}
                        onSchemaChange={setCurrentSchema}
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
            {/* Estimator Banner (shows after preview) */}
            {estimate && (
              <div className="mb-3 p-3 rounded-lg border border-slate-700/30 bg-slate-800/30 flex items-center justify-between">
                <div className="text-sm text-slate-200">
                  <div>
                    <strong>Estimate:</strong>{" "}
                    {estimate?.estimatedCost !== undefined
                      ? `$${estimate.estimatedCost}`
                      : "n/a"}
                  </div>
                  <div className="text-xs text-slate-400">
                    ETA:{" "}
                    {estimate?.etaSeconds ? `${estimate.etaSeconds}s` : "--"} •
                    tokens: {estimate?.tokens ?? "--"}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => {
                      if (previewData && previewData.length > 0) {
                        setShowDatasetPreview(true);
                      }
                    }}
                    className="px-3 py-1 bg-indigo-600 rounded text-white text-sm"
                  >
                    View Preview ({previewData ? previewData.length : 0})
                  </button>
                </div>
              </div>
            )}
            <PromptBar
              userType={userType}
              selectedTier={selectedTier}
              tierConfig={tierConfig[selectedTier]}
              onGenerationStart={handleStartGeneration}
              schema={currentSchema}
              onAdvancedToggle={() => setIsAdvancedMode(!isAdvancedMode)}
              showAdvanced={isAdvancedMode}
              isGenerating={isGenerating}
              compact
            />

            {/* Validation feedback panel (replaces alerts) */}
            {showValidationPanel && (validationResult || validationError) && (
              <div className="mt-4 p-4 rounded-lg border border-slate-700/40 bg-slate-800/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      Validation Result
                    </div>
                    {validationError ? (
                      <div className="text-sm text-rose-400 mt-1">
                        {validationError}
                      </div>
                    ) : validationResult ? (
                      <div className="mt-2 text-xs text-slate-300">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-lg font-semibold">
                            Score:{" "}
                            {validationResult.score?.toFixed
                              ? validationResult.score.toFixed(1)
                              : validationResult.score}
                          </div>
                          <div className="text-sm text-slate-400">
                            {validationResult.isValid
                              ? "Valid"
                              : "Issues found"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">
                              Critical Errors
                            </div>
                            <ul className="text-xs text-slate-300 list-disc ml-4 max-h-40 overflow-auto">
                              {(validationResult.errors || [])
                                .slice(0, 6)
                                .map((e: string, i: number) => (
                                  <li key={i}>{e}</li>
                                ))}
                              {(validationResult.errors || []).length === 0 && (
                                <li className="text-xs text-slate-500">None</li>
                              )}
                            </ul>
                          </div>

                          <div>
                            <div className="text-xs text-slate-400 mb-1">
                              Top Warnings
                            </div>
                            <ul className="text-xs text-slate-300 list-disc ml-4 max-h-40 overflow-auto">
                              {(validationResult.warnings || [])
                                .slice(0, 6)
                                .map((w: string, i: number) => (
                                  <li key={i}>{w}</li>
                                ))}
                              {(validationResult.warnings || []).length ===
                                0 && (
                                <li className="text-xs text-slate-500">None</li>
                              )}
                            </ul>
                          </div>

                          <div>
                            <div className="text-xs text-slate-400 mb-1">
                              Per-column Health
                            </div>
                            <div className="space-y-2 max-h-40 overflow-auto text-xs text-slate-300">
                              {(validationResult.fieldMetrics || []).map(
                                (m: any) => (
                                  <div
                                    key={m.fieldName}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="truncate max-w-[140px]">
                                      {m.fieldName}
                                    </div>
                                    <div className="text-slate-400">
                                      Null {(m.nullRate * 100).toFixed(1)}% •
                                      Unique{" "}
                                      {(m.uniquenessRate * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                )
                              )}
                              {!(validationResult.fieldMetrics || [])
                                .length && (
                                <div className="text-xs text-slate-500">
                                  No field metrics
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowValidationPanel(false);
                        setValidationResult(null);
                        setValidationError(null);
                      }}
                      className="px-2 py-1 bg-slate-700 rounded text-sm text-slate-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent job history (last 5) */}
            {jobHistory && jobHistory.length > 0 && (
              <div className="mt-4 p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-white">
                    Recent Jobs
                  </div>
                  <div className="text-xs text-slate-400">Showing latest 5</div>
                </div>
                <ul className="space-y-3">
                  {jobHistory.slice(0, 5).map((job: any) => (
                    <li
                      key={job.jobId || job.id}
                      className="flex items-center justify-between gap-3 p-2 bg-slate-900/30 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-200 truncate">
                            {String(job.prompt || job.jobId).slice(0, 60)}
                          </div>
                          <div className="text-xs text-slate-400 ml-4">
                            {String(job.jobId || job.id).slice(0, 8)}
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-slate-800/50 h-2 rounded overflow-hidden">
                            <div
                              className="h-2 bg-emerald-400"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (job.progress || 0) * 1
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                            <div>
                              {(job.progress || 0).toFixed
                                ? `${(job.progress || 0).toFixed(0)}%`
                                : `${job.progress || 0}%`}
                            </div>
                            <div className="capitalize">
                              {job.status || "unknown"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {["pending", "processing"].includes(
                          (job.status || "").toLowerCase()
                        ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelJob(job.jobId || job.id);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white rounded text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
        datasetId={generatedDatasetId || undefined}
        description={generatedDatasetDesc}
        tier={selectedTier}
        isVisible={showDatasetPreview}
        onClose={() => setShowDatasetPreview(false)}
        resultUrl={resultUrl || undefined}
        previewData={previewData || undefined}
      />
    </div>
  );
}
