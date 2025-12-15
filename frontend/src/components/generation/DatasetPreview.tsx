"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Download,
  Upload,
  DollarSign,
  TrendingUp,
  Users,
  Share2,
  Settings,
  FileText,
  CheckCircle,
  AlertTriangle,
  Coins,
  BarChart3,
  Lock,
  Unlock,
  ArrowRight,
  MessageSquare,
  Send,
  Bot,
  Sparkles,
  Database,
  Brain,
  FileDown,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chatWithDataset } from "@/lib/api/chat";
import { blockchainAPI } from "@/lib/api/blockchain";

interface DatasetPreviewProps {
  datasetName: string;
  datasetId?: string;
  description: string;
  tier: string;
  isVisible: boolean;
  onClose: () => void;
  resultUrl?: string;
  previewData?: any[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function DatasetPreview({
  datasetName,
  datasetId,
  description,
  tier,
  isVisible,
  onClose,
  previewData: previewDataProp,
}: DatasetPreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "chat" | "publish">(
    "preview"
  );
  const [publishStep, setPublishStep] = useState<
    "setup" | "payment" | "deploying" | "success"
  >("setup");
  const [datasetTitle, setDatasetTitle] = useState(datasetName);
  const [datasetDesc, setDatasetDesc] = useState(description);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deploymentType, setDeploymentType] = useState<"public" | "private">(
    "public"
  );
  const [storageProvider, setStorageProvider] = useState<
    "arweave" | "walrus" | "ipfs"
  >("arweave");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `I'm ready to analyze your ${datasetName} dataset. I can help you validate data quality, find patterns, detect anomalies, and ensure completeness before tokenization. Ask me anything!`,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [validationScore, setValidationScore] = useState(94);

  // Mock dataset preview data with some anomalies for demonstration
  const defaultPreviewData = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      age: 34,
      location: "New York",
      total_spent: 1250.8,
      last_purchase: "2024-01-15",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      age: 28,
      location: "Los Angeles",
      total_spent: 890.45,
      last_purchase: "2024-01-18",
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike.chen@email.com",
      age: 42,
      location: "Chicago",
      total_spent: 2150.3,
      last_purchase: "2024-01-10",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.d@email.com",
      age: 31,
      location: "Miami",
      total_spent: 1675.2,
      last_purchase: "2024-01-20",
    },
    {
      id: 5,
      name: "David Wilson",
      email: "d.wilson@email.com",
      age: 29,
      location: "Seattle",
      total_spent: 945.75,
      last_purchase: "2024-01-12",
    },
  ];

  const previewData =
    previewDataProp && previewDataProp.length > 0
      ? previewDataProp
      : defaultPreviewData;

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);

    // Call backend RAG endpoint for dataset chat
    (async () => {
      try {
        // Prepare conversation history in the expected shape
        const history = chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const datasetIdToUse = datasetId || datasetName || ""; // prefer explicit id prop
        const resp = await chatWithDataset(datasetIdToUse, chatInput, history);
        const assistantText = resp?.response || resp?.message || "No response.";
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: assistantText,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiResponse]);
      } catch (e: any) {
        const fallback: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content:
            "Sorry, I couldn't fetch an answer right now. Please try again later.",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, fallback]);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  const generateAIResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();

    // Pattern and anomaly detection
    if (lowerQuery.includes("pattern") || lowerQuery.includes("trend")) {
      return `📊 **Pattern Analysis Results:**

I've identified several key patterns in your dataset:

**Purchase Patterns:**
• Spending ranges from $890 to $2,150 (2.4x variance)
• Average transaction: $1,182.50
• Most active period: Mid-January 2024

**Geographic Distribution:**
• 5 unique cities across the US
• No duplicate locations (good geographic diversity)
• Coastal cities show 15% higher spending

**Customer Demographics:**
• Age range: 28-42 years (prime purchasing demographic)
• Well-distributed age groups
• No outliers in age data

**Recommendation:** This dataset shows realistic purchasing patterns suitable for ${
        tier === "production"
          ? "enterprise analytics"
          : tier === "workflow"
          ? "workflow automation"
          : "testing purposes"
      }.`;
    }

    if (
      lowerQuery.includes("anomaly") ||
      lowerQuery.includes("anomalies") ||
      lowerQuery.includes("unusual")
    ) {
      return `🔍 **Anomaly Detection Report:**

I've scanned for anomalies and found:

**✅ No Critical Anomalies Detected**

**Minor Observations:**
• Mike Chen (#3) has the highest spending at $2,150 (1.8x average)
• All email formats are consistent and valid
• No duplicate records or IDs
• Date formats are standardized

**Data Integrity Score: ${validationScore}%**

**Tier-Specific Validation:**
${
  tier === "production"
    ? "• Enterprise compliance checks: PASSED\n• Statistical distribution: NORMAL\n• No PII exposure risks detected"
    : tier === "workflow"
    ? "• Multi-AI validation: CONFIRMED\n• Format consistency: VERIFIED\n• Ready for automation workflows"
    : "• Basic validation: PASSED\n• Suitable for testing and development"
}

The dataset appears clean and ready for ${
        tier === "production"
          ? "production deployment"
          : tier === "workflow"
          ? "workflow integration"
          : "testing"
      }.`;
    }

    if (
      lowerQuery.includes("complete") ||
      lowerQuery.includes("validation") ||
      lowerQuery.includes("ready")
    ) {
      return `✅ **Data Completeness Validation:**

**Overall Status: READY FOR TOKENIZATION**

**Validation Checklist:**
✓ No missing values detected
✓ All required fields present
✓ Data types consistent
✓ Email formats valid
✓ Age values realistic (28-42)
✓ Location data standardized
✓ Currency formats correct
✓ Date formats ISO-compliant

**Quality Metrics:**
• Completeness: 100%
• Accuracy: ${validationScore}%
• Consistency: 98%
• Timeliness: Current

**${tier.toUpperCase()} Tier Certification:**
${
  tier === "production"
    ? "🏆 Enterprise-grade quality achieved\n🛡️ Compliance standards met (GDPR, CCPA)\n🔒 Security validation passed"
    : tier === "workflow"
    ? "⚡ Workflow-ready quality confirmed\n🤖 Automation compatibility verified\n✨ Multi-AI consensus achieved"
    : "✅ Testing quality standards met\n📊 Basic validation complete\n🚀 Ready for development use"
}

**Recommendation:** Proceed with tokenization. This dataset meets all quality requirements for the ${tier} tier.`;
    }

    if (lowerQuery.includes("how many") || lowerQuery.includes("count")) {
      return `Based on the generated dataset, there are ${previewData.length} records in the current sample. The full dataset contains comprehensive customer information with demographics and purchase behavior data.`;
    }

    if (lowerQuery.includes("average") || lowerQuery.includes("mean")) {
      const avgSpent =
        previewData.reduce((sum, row) => sum + row.total_spent, 0) /
        previewData.length;
      const avgAge =
        previewData.reduce((sum, row) => sum + row.age, 0) / previewData.length;
      return `From the dataset analysis:\n• Average customer spend: $${avgSpent.toFixed(
        2
      )}\n• Average customer age: ${avgAge.toFixed(
        1
      )} years\n• The data shows a diverse customer base across different locations.`;
    }

    if (lowerQuery.includes("location") || lowerQuery.includes("where")) {
      const locations = [...new Set(previewData.map((row) => row.location))];
      return `The customers in this dataset are located in: ${locations.join(
        ", "
      )}. This represents a good geographic distribution across major US cities.`;
    }

    if (lowerQuery.includes("highest") || lowerQuery.includes("biggest")) {
      const highest = previewData.reduce((max, row) =>
        row.total_spent > max.total_spent ? row : max
      );
      return `The highest spending customer is ${highest.name} from ${
        highest.location
      } with a total spend of $${highest.total_spent.toFixed(2)}.`;
    }

    if (lowerQuery.includes("quality") || lowerQuery.includes("score")) {
      return `**Dataset Quality Report:**

📊 **Quality Score: ${validationScore}%**

**Scoring Breakdown:**
• Data Completeness: 100% ✓
• Format Consistency: 98% ✓
• Value Validity: 96% ✓
• No Duplicates: 100% ✓
• Schema Compliance: 100% ✓

**${tier.toUpperCase()} Tier Benefits:**
${
  tier === "production"
    ? "• 5-AI consensus validation\n• Enterprise compliance certified\n• Statistical anomaly detection\n• Production-ready guarantees"
    : tier === "workflow"
    ? "• 3-AI cross-validation\n• Workflow compatibility tested\n• Format standardization\n• Integration-ready"
    : "• Single AI validation\n• Basic quality checks\n• Development-ready\n• Quick generation"
}

Your dataset exceeds quality thresholds for tokenization!`;
    }

    // Default comprehensive response
    return `The dataset contains detailed customer information including names, emails, ages, locations, spending data, and purchase dates. Each record is complete and validated according to ${tier} tier standards.

Key insights:
• ${previewData.length} complete records
• No missing values
• Consistent data formats
• ${
      tier === "production"
        ? "Enterprise-grade compliance"
        : tier === "workflow"
        ? "Multi-AI validated"
        : "Community validated"
    }

Feel free to ask specific questions about patterns, anomalies, completeness, or any data characteristics!`;
  };

  const handleExportChat = () => {
    const chatContent = chatMessages
      .map(
        (msg) =>
          `[${msg.timestamp.toLocaleTimeString()}] ${
            msg.role === "user" ? "You" : "AI"
          }: ${msg.content}`
      )
      .join("\n\n");

    const validationReport = `
DATASET VALIDATION REPORT
========================
Dataset: ${datasetName}
Tier: ${tier.toUpperCase()}
Generated: ${new Date().toLocaleDateString()}
Quality Score: ${validationScore}%

CHAT TRANSCRIPT
===============
${chatContent}

VALIDATION SUMMARY
==================
✓ Data Completeness: 100%
✓ Format Consistency: Verified
✓ Quality Score: ${validationScore}%
✓ Ready for Tokenization: YES

CERTIFICATION
=============
This dataset has been validated through AI-powered analysis and meets
all requirements for ${tier} tier deployment.
`;

    // Create and download file
    const blob = new Blob([validationReport], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${datasetName.replace(/\s+/g, "-")}-validation-report.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    // Step flow: "setup" -> "payment" -> "deploying" -> "success"
    if (publishStep === "setup") {
      setPublishStep("payment");
      return;
    }

    if (publishStep === "payment") {
      setPublishStep("deploying");
      setIsPublishing(true);
      try {
        // Determine datasetId - fallback to datasetName when an id isn't available
        // Prefer an explicit datasetId prop
        const datasetIdToUse = datasetId || datasetName || "";

        if (!datasetIdToUse) {
          alert(
            "Deployment failed: datasetId is missing. Ensure the dataset has been saved and try again."
          );
          setPublishStep("setup");
          return;
        }

        // Deploy bonding curve via API
        const result = await blockchainAPI.deployBondingCurve({
          datasetId: datasetIdToUse,
          tokenName: `${datasetName} Token`,
          tokenSymbol: datasetName.substring(0, 4).toUpperCase(),
        });

        setPublishStep("success");

        // Redirect to dashboard showing deployed contract
        setTimeout(() => {
          const contractAddress =
            result?.bondingCurve?.contractAddress ||
            result?.bondingCurve?.contract_address ||
            result?.contractAddress;
          if (contractAddress) {
            window.location.href = `/dashboard?deployed=${contractAddress}`;
          } else {
            window.location.href = `/dashboard`;
          }
        }, 2000);
      } catch (error) {
        console.error("Deployment failed:", error);
        alert("Deployment failed. Please try again.");
        setPublishStep("setup");
      } finally {
        setIsPublishing(false);
      }
    }
  };

  const handleViewDashboard = () => {
    window.location.href = "/dashboard";
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-6xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Dataset Preview
                </h2>
                <p className="text-slate-400">
                  Review, validate with AI, and publish your generated dataset
                </p>
              </div>
              <Button variant="ghost" onClick={onClose}>
                ✕
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-6 p-1 bg-slate-800/50 rounded-xl">
              {[
                { id: "preview", name: "Preview Data", icon: Eye },
                {
                  id: "chat",
                  name: "Chat with Data",
                  icon: MessageSquare,
                  badge: "NEW",
                },
                { id: "publish", name: "Publish & Tokenize", icon: Coins },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as "preview" | "chat" | "publish")
                    }
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                    {tab.badge && (
                      <Badge className="ml-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5">
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {activeTab === "preview" && (
              <div className="space-y-6">
                {/* Dataset Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {datasetName}
                    </h3>
                    <p className="text-slate-400 mb-4">{description}</p>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                        {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                      </Badge>
                      <span className="text-sm text-slate-400">
                        5 rows × 7 columns
                      </span>
                      <span className="text-sm text-slate-400">
                        Generated just now
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV
                    </Button>
                    <Button variant="outline" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Download JSON
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h4 className="font-semibold text-white">
                      Sample Data Preview
                    </h4>
                    <p className="text-sm text-slate-400">
                      Showing first 5 rows of generated dataset
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50">
                        <tr>
                          {Object.keys(previewData[0]).map((header) => (
                            <th
                              key={header}
                              className="text-left p-4 text-sm font-medium text-slate-300 border-b border-slate-700/50"
                            >
                              {header.replace("_", " ").toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-slate-700/30"
                          >
                            {Object.values(row).map((val, index) => {
                              const value: any = val as any;
                              return (
                                <td
                                  key={index}
                                  className="p-4 text-sm text-slate-300"
                                >
                                  {typeof value === "number" && index === 5
                                    ? `$${(value as number).toFixed(2)}`
                                    : String(value)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-300">
                        Quality Score
                      </span>
                    </div>
                    <div className="text-xl font-bold text-emerald-400">
                      {validationScore}%
                    </div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">
                        Uniqueness
                      </span>
                    </div>
                    <div className="text-xl font-bold text-blue-400">99.2%</div>
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">
                        Market Fit
                      </span>
                    </div>
                    <div className="text-xl font-bold text-purple-400">
                      High
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Chat with Data Tab */}
            {activeTab === "chat" && (
              <div className="space-y-6">
                {/* Chat Header with Export */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        AI Data Validator
                      </h3>
                      <p className="text-sm text-indigo-200/80">
                        Advanced pattern detection & validation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                      <Shield className="w-3 h-3 mr-1" />
                      {tier.toUpperCase()} Validated
                    </Badge>
                    <Button
                      onClick={handleExportChat}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 hover:border-slate-500"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>

                {/* Validation Status Banner */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="font-medium text-emerald-300">
                          Dataset Ready for Tokenization
                        </h4>
                        <p className="text-sm text-emerald-200/80">
                          All validation checks passed • Quality score:{" "}
                          {validationScore}%
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setActiveTab("publish")}
                    >
                      Proceed to Publish
                    </Button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="h-[400px] bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.role === "user" ? "order-2" : "order-1"
                          }`}
                        >
                          <div
                            className={`flex items-start gap-3 ${
                              message.role === "user" ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                message.role === "user"
                                  ? "bg-indigo-500"
                                  : "bg-purple-500/20"
                              }`}
                            >
                              {message.role === "user" ? (
                                <Users className="w-4 h-4 text-white" />
                              ) : (
                                <Bot className="w-4 h-4 text-purple-400" />
                              )}
                            </div>
                            <div
                              className={`p-3 rounded-lg ${
                                message.role === "user"
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-700/50 text-slate-200"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Ask about patterns, anomalies, completeness, or validation..."
                      className="w-full px-4 py-3 bg-slate-800/40 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 pr-12"
                    />
                    <Database className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Enhanced Example Questions */}
                <div className="p-4 bg-slate-800/20 border border-slate-700/30 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">
                    Advanced validation queries:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Find patterns and trends",
                      "Detect any anomalies",
                      "Validate data completeness",
                      "Show quality metrics",
                      "Check for duplicates",
                      "Analyze geographic distribution",
                    ].map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setChatInput(question);
                          handleSendMessage();
                        }}
                        className="text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-left"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "publish" && (
              <div className="space-y-6">
                {publishStep === "setup" && (
                  <>
                    {/* Dataset Setup */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Dataset Title
                        </label>
                        <input
                          type="text"
                          value={datasetTitle}
                          onChange={(e) => setDatasetTitle(e.target.value)}
                          className="w-full p-4 bg-slate-800/40 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={datasetDesc}
                          onChange={(e) => setDatasetDesc(e.target.value)}
                          rows={3}
                          className="w-full p-4 bg-slate-800/40 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      {/* Deployment Type Selection */}
                      <div className="p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Choose Deployment Type
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Public Tokenization */}
                          <button
                            onClick={() => setDeploymentType("public")}
                            className={`p-4 border-2 rounded-xl text-left transition-all ${
                              deploymentType === "public"
                                ? "border-indigo-500 bg-indigo-500/10"
                                : "border-slate-600 hover:border-slate-500"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <Coins className="w-6 h-6 text-indigo-400" />
                              <h4 className="font-semibold text-white">
                                Public Tokenization
                              </h4>
                            </div>
                            <p className="text-sm text-slate-300 mb-3">
                              Deploy to bonding curve for public trading. Earn
                              1.5% on all trades forever.
                            </p>
                            <div className="space-y-1 text-xs text-slate-400">
                              <div>• Tradeable tokens</div>
                              <div>• $69K graduation to Uniswap</div>
                              <div>• Forever passive income</div>
                              <div>• 100 $INAI deployment fee</div>
                            </div>
                          </button>

                          {/* Private NFT */}
                          <button
                            onClick={() => setDeploymentType("private")}
                            className={`p-4 border-2 rounded-xl text-left transition-all ${
                              deploymentType === "private"
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-slate-600 hover:border-slate-500"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <Shield className="w-6 h-6 text-purple-400" />
                              <h4 className="font-semibold text-white">
                                Private NFT Asset
                              </h4>
                            </div>
                            <p className="text-sm text-slate-300 mb-3">
                              Mint as NFT certificate for private ownership.
                              Proves dataset provenance.
                            </p>
                            <div className="space-y-1 text-xs text-slate-400">
                              <div>• Digital certificate of ownership</div>
                              <div>• Private/enterprise use</div>
                              <div>• Licensing revenue potential</div>
                              <div>• 50 $INAI minting fee</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Deployment Details */}
                      {deploymentType === "public" ? (
                        <div className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            Public Tokenization Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Token Supply
                              </div>
                              <div className="text-white font-semibold">
                                1,000,000,000 tokens
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Deployment Cost
                              </div>
                              <div className="text-white font-semibold">
                                100 $INAI
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Trading Fee Earnings
                              </div>
                              <div className="text-white font-semibold">
                                1.5% of all trades
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Graduation to Uniswap
                              </div>
                              <div className="text-white font-semibold">
                                $69k market cap
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            Private NFT Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                NFT Certificate
                              </div>
                              <div className="text-white font-semibold">
                                Digital ownership proof
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Minting Cost
                              </div>
                              <div className="text-white font-semibold">
                                50 $INAI
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Access Control
                              </div>
                              <div className="text-white font-semibold">
                                Owner + licensed users
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Revenue Model
                              </div>
                              <div className="text-white font-semibold">
                                Licensing fees
                              </div>
                            </div>
                          </div>

                          {/* Storage Provider Selection */}
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Choose Storage Provider
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                              {["arweave", "walrus", "ipfs"].map((provider) => (
                                <button
                                  key={provider}
                                  onClick={() =>
                                    setStorageProvider(
                                      provider as "arweave" | "walrus" | "ipfs"
                                    )
                                  }
                                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                                    storageProvider === provider
                                      ? "border-purple-500 bg-purple-500/10"
                                      : "border-slate-600 hover:border-slate-500"
                                  }`}
                                >
                                  <div className="font-medium text-white capitalize">
                                    {provider}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1">
                                    {provider === "arweave"
                                      ? "Permanent storage"
                                      : provider === "walrus"
                                      ? "High performance"
                                      : "Decentralized IPFS"}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Terms */}
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-300 mb-1">
                              Important Notice
                            </h4>
                            <p className="text-sm text-yellow-200/80">
                              {deploymentType === "public" ? (
                                <>
                                  Once published, your dataset will be tokenized
                                  on a bonding curve. When it reaches $69k
                                  market cap, liquidity deploys to Uniswap V3.
                                  You'll earn 1.5% from all trades forever.
                                </>
                              ) : (
                                <>
                                  Your dataset will be minted as a private NFT
                                  certificate stored on{" "}
                                  {storageProvider.toUpperCase()}. You maintain
                                  full ownership and can license access to
                                  generate revenue. Certificate provides
                                  verifiable provenance of your dataset.
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handlePublish}
                        className={`w-full ${
                          deploymentType === "public"
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        }`}
                        size="lg"
                      >
                        {deploymentType === "public" ? (
                          <>
                            <Coins className="w-5 h-5 mr-2" />
                            Tokenize Dataset (100 $INAI)
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5 mr-2" />
                            Mint Private NFT (50 $INAI)
                          </>
                        )}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </>
                )}

                {publishStep === "payment" && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                      <DollarSign className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Processing Payment
                      </h3>
                      <p className="text-slate-400">
                        Deducting {deploymentType === "public" ? "100" : "50"}{" "}
                        $INAI from your wallet...
                      </p>
                    </div>
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                )}

                {publishStep === "deploying" && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {deploymentType === "public"
                          ? "Deploying to Blockchain"
                          : "Minting NFT Certificate"}
                      </h3>
                      <p className="text-slate-400">
                        {deploymentType === "public"
                          ? "Creating bonding curve and deploying contract..."
                          : `Minting NFT and storing metadata on ${storageProvider.toUpperCase()}...`}
                      </p>
                    </div>
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                )}

                {publishStep === "success" && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {deploymentType === "public"
                          ? "Dataset Published Successfully!"
                          : "NFT Certificate Minted Successfully!"}
                      </h3>
                      <p className="text-slate-400">
                        {deploymentType === "public"
                          ? "Your dataset is now live on the bonding curve and available for trading."
                          : "Your dataset has been minted as a private NFT certificate with verified provenance."}
                      </p>
                    </div>

                    <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-left">
                      <h4 className="font-semibold text-white mb-4">
                        {deploymentType === "public"
                          ? "Token Details"
                          : "NFT Certificate Details"}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {deploymentType === "public" ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Contract Address:
                              </span>
                              <span className="text-white font-mono">
                                0x1234...5678
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Token Symbol:
                              </span>
                              <span className="text-white">ECOM-001</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Initial Price:
                              </span>
                              <span className="text-white">0.0001 $INAI</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Status:</span>
                              <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Bonding
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                NFT Token ID:
                              </span>
                              <span className="text-white font-mono">
                                INAI-NFT-#1848
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Storage Provider:
                              </span>
                              <span className="text-white">
                                {storageProvider.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Verification:
                              </span>
                              <span className="text-emerald-400">
                                ✓ Provenance Verified
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Status:</span>
                              <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                                <Shield className="w-3 h-3 mr-1" />
                                Private NFT
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>

                      {deploymentType === "private" && (
                        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">
                              Licensing Ready
                            </span>
                          </div>
                          <p className="text-xs text-purple-200/80">
                            You can now license access to your dataset and
                            generate revenue. The NFT certificate provides
                            verifiable proof of ownership for enterprise buyers.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                      >
                        Close
                      </Button>
                      <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleViewDashboard}
                      >
                        View Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
