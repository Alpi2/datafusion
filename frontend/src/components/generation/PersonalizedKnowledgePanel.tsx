"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  MessageSquare,
  Brain,
  X,
  Check,
  AlertCircle,
  BookOpen,
  Zap,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GenerationTier } from "./GenerationInterface";

interface PersonalizedKnowledgePanelProps {
  tier: GenerationTier;
  isEnabled: boolean;
  onToggle: () => void;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
  extractedInfo?: {
    topics: string[];
    keyTerms: string[];
    dataStructures: string[];
  };
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function PersonalizedKnowledgePanel({
  tier,
  isEnabled,
  onToggle,
}: PersonalizedKnowledgePanelProps) {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I can help you provide context for better synthetic data generation. Upload documents or tell me about your domain, data requirements, and specific patterns you need.",
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const isAvailable = true; // Available for all tiers now

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const newDoc: UploadedDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        status: "uploading",
      };

      setUploadedDocs((prev) => [...prev, newDoc]);

      // Simulate upload and processing
      setTimeout(() => {
        setUploadedDocs((prev) =>
          prev.map((doc) =>
            doc.id === newDoc.id ? { ...doc, status: "processing" } : doc
          )
        );

        setTimeout(() => {
          setUploadedDocs((prev) =>
            prev.map((doc) =>
              doc.id === newDoc.id
                ? {
                    ...doc,
                    status: "ready",
                    extractedInfo: {
                      topics: [
                        "Customer Data",
                        "Financial Records",
                        "User Behavior",
                      ],
                      keyTerms: [
                        "transaction_id",
                        "customer_segment",
                        "revenue",
                      ],
                      dataStructures: [
                        "JSON",
                        "Relational Tables",
                        "Time Series",
                      ],
                    },
                  }
                : doc
            )
          );
        }, 2000);
      }, 1000);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: "user",
      content: newMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: "assistant",
        content:
          "I understand. Based on your requirements, I'll help generate synthetic data that matches your domain patterns. This context will improve data quality and relevance significantly.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 1500);
  };

  const removeDocument = (docId: string) => {
    setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docId));
  };

  if (!isAvailable) {
    return null; // This section is no longer needed as the feature is available for all tiers
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Personalized Knowledge
            </h3>
            <p className="text-sm text-slate-400">
              Upload docs & provide context for better data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-purple-300 border-purple-500/30"
          >
            {tier === "production" ? "Advanced AI" : "Standard AI"}
          </Badge>
          <Button
            onClick={onToggle}
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            className={isEnabled ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            {isEnabled ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isEnabled ? "Enabled" : "Enable"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 overflow-hidden"
          >
            {/* Document Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  Upload Documentation
                </h4>

                {/* Upload Zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                    isDragOver
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-300 mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF, DOC, TXT, CSV, JSON (max 10MB each)
                    </p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.csv,.json"
                      onChange={(e) =>
                        e.target.files && handleFileUpload(e.target.files)
                      }
                      id="file-upload"
                    />
                    <Button
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      Browse Files
                    </Button>
                  </div>
                </div>

                {/* Uploaded Documents */}
                {uploadedDocs.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-slate-300">
                      Uploaded Documents
                    </h5>
                    {uploadedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
                      >
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(doc.size / 1024).toFixed(1)}KB • {doc.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === "ready" && (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                          {doc.status === "processing" && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Zap className="w-4 h-4 text-yellow-400" />
                            </motion.div>
                          )}
                          <Button
                            onClick={() => removeDocument(doc.id)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Context Chat */}
              <div className="space-y-4">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Provide Context
                </h4>

                {/* Chat Messages */}
                <div className="h-64 border border-slate-700 rounded-xl p-4 overflow-y-auto bg-slate-900/30">
                  <div className="space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.type === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            message.type === "user"
                              ? "bg-purple-600 text-white"
                              : "bg-slate-700 text-slate-200"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Describe your data requirements, domain, patterns..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Knowledge Summary */}
            {uploadedDocs.some((doc) => doc.status === "ready") && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Extracted Knowledge
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Topics</p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        "Customer Data",
                        "Financial Records",
                        "User Behavior",
                      ].map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="text-xs text-purple-300 border-purple-500/30"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Key Terms</p>
                    <div className="flex flex-wrap gap-1">
                      {["transaction_id", "customer_segment", "revenue"].map(
                        (term) => (
                          <Badge
                            key={term}
                            variant="outline"
                            className="text-xs text-blue-300 border-blue-500/30"
                          >
                            {term}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-2">
                      Data Structures
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["JSON", "Relational", "Time Series"].map(
                        (structure) => (
                          <Badge
                            key={structure}
                            variant="outline"
                            className="text-xs text-emerald-300 border-emerald-500/30"
                          >
                            {structure}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Impact Notice */}
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <h5 className="font-medium text-emerald-300 mb-1">
                  Enhanced Data Quality
                </h5>
                <p className="text-sm text-emerald-200/80">
                  Your uploaded documentation and context will be used to
                  generate more accurate, domain-specific synthetic data that
                  matches your exact requirements and patterns.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
