"use client";

import React, { useState, useEffect } from "react";
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
import { uploadDocument, getUserDocuments } from "@/lib/api/embeddings";
import type { GenerationTier } from "./GenerationInterface";

interface PersonalizedKnowledgePanelProps {
  tier: GenerationTier;
  isEnabled: boolean;
  onToggle: () => void;
}

interface UploadedDocument {
  id: string;
  filename: string;
  fileType?: string;
  fileSize: number;
  status: "uploading" | "processing" | "ready" | "error";
  selected?: boolean;
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

  // Load user documents on mount
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    (async () => {
      try {
        const resp = await getUserDocuments();
        if (resp && resp.success && Array.isArray(resp.documents)) {
          const docs = resp.documents.map((d: any) => ({
            id: d.id,
            filename: d.filename,
            fileType: d.fileType,
            fileSize: Number(d.fileSize || 0),
            status: d.processed ? "ready" : "processing",
            selected: false,
            extractedInfo: d.metadata || undefined,
          }));
          // restore selection from localStorage
          const sel = JSON.parse(
            localStorage.getItem("knowledgeDocumentIds") || "[]"
          );
          if (Array.isArray(sel) && sel.length > 0) {
            setUploadedDocs(
              docs.map((p: any) => ({ ...p, selected: sel.includes(p.id) }))
            );
          } else {
            setUploadedDocs(docs as UploadedDocument[]);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleFileUpload = async (files: FileList) => {
    const token = localStorage.getItem("token") || "";
    Array.from(files).forEach(async (file) => {
      const tempId = Math.random().toString(36).substr(2, 9);
      const newDoc: UploadedDocument = {
        id: tempId,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: "uploading",
        selected: true,
      };

      setUploadedDocs((prev) => [newDoc, ...prev]);

      try {
        const resp = await uploadDocument(file);
        if (resp && resp.success && resp.document) {
          const doc = resp.document;
          const mapped: UploadedDocument = {
            id: doc.id,
            filename: doc.filename || file.name,
            fileType: doc.fileType || file.type,
            fileSize: Number(doc.fileSize || file.size),
            status: doc.processed ? "ready" : "processing",
            selected: true,
            extractedInfo: doc.metadata || undefined,
          };
          setUploadedDocs((prev) => [
            mapped,
            ...prev.filter((d) => d.id !== tempId),
          ]);
          // persist selection set
          try {
            const existing = JSON.parse(
              localStorage.getItem("knowledgeDocumentIds") || "[]"
            );
            const ids = Array.from(new Set([mapped.id, ...(existing || [])]));
            localStorage.setItem("knowledgeDocumentIds", JSON.stringify(ids));
          } catch (e) {}
        } else {
          setUploadedDocs((prev) =>
            prev.map((d) => (d.id === tempId ? { ...d, status: "error" } : d))
          );
        }
      } catch (e) {
        setUploadedDocs((prev) =>
          prev.map((d) => (d.id === tempId ? { ...d, status: "error" } : d))
        );
      }
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
    // Persist chat context for generation job
    try {
      const existing = localStorage.getItem("chatContext") || "";
      const next = [existing, newMessage].filter(Boolean).join("\n");
      localStorage.setItem("chatContext", next);
    } catch (e) {
      // ignore
    }
  };

  const removeDocument = (docId: string) => {
    // Attempt backend delete but fail gracefully
    const token = localStorage.getItem("token") || "";
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      }/api/embeddings/documents/${docId}`,
      {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    ).catch(() => {});
    setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docId));
    // update persisted selection
    try {
      const sel = JSON.parse(
        localStorage.getItem("knowledgeDocumentIds") || "[]"
      );
      const next = (sel || []).filter((id: string) => id !== docId);
      localStorage.setItem("knowledgeDocumentIds", JSON.stringify(next));
    } catch (e) {}
  };

  const toggleSelectDocument = (docId: string) => {
    setUploadedDocs((prev) => {
      const out = prev.map((d) =>
        d.id === docId ? { ...d, selected: !d.selected } : d
      );
      try {
        const ids = out.filter((d) => d.selected).map((d) => d.id);
        localStorage.setItem("knowledgeDocumentIds", JSON.stringify(ids));
      } catch (e) {}
      return out;
    });
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
                            {doc.filename}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(doc.fileSize / 1024).toFixed(1)}KB • {doc.status}
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
                            onClick={() => toggleSelectDocument(doc.id)}
                            variant={doc.selected ? "default" : "outline"}
                            size="sm"
                            className={
                              doc.selected ? "bg-purple-600" : "text-slate-400"
                            }
                          >
                            {doc.selected ? "Selected" : "Select"}
                          </Button>
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
