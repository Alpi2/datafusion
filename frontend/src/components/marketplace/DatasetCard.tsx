"use client";
import React from "react";
import Link from "next/link";
import { getAuthHeader, getAuthToken } from "@/lib/auth";
import marketplaceAPI from "@/lib/api/marketplace";

import {
  Star,
  Download,
  Eye,
  Calendar,
  Database,
  FileText,
  HardDrive,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Dataset {
  id: string;
  title: string;
  description: string;
  creator: string;
  category: string;
  price: number;
  downloads: number;
  rating: number;
  quality: number;
  lastUpdated: string;
  tags: string[];
  preview: {
    rows: number;
    columns: number;
    size: string;
  };
  isPurchased?: boolean;
}

interface DatasetCardProps {
  dataset: Dataset;
  viewMode: "grid" | "list";
  isCompared?: boolean;
  onCompareToggle?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}

export function DatasetCard({
  dataset,
  viewMode,
  isCompared,
  onCompareToggle,
  isWishlisted,
  onToggleWishlist,
}: DatasetCardProps) {
  const handleCardClick = () => {
    window.location.href = `/marketplace/${dataset.id}`;
  };
  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = getAuthToken();
      if (!token) {
        alert(
          "You must be signed in to purchase datasets. Redirecting to auth..."
        );
        window.location.href = "/auth";
        return;
      }

      try {
        const res = await marketplaceAPI.purchaseDataset(dataset.id);
        // res may contain sessionId or unsignedTx depending on backend
        alert("Purchase initiated. Proceed to payment.");
        console.log("Purchase initiated:", res);
      } catch (err: any) {
        const message = err?.message || "Purchase failed";
        alert(message);
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Purchase failed. Please try again later.");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = getAuthToken();
      if (!token) {
        alert(
          "You must be signed in to download datasets. Redirecting to auth..."
        );
        window.location.href = "/auth";
        return;
      }
      try {
        const body = await marketplaceAPI.downloadDataset(dataset.id);
        const downloadUrl = (body as any)?.downloadUrl;
        if (downloadUrl) window.open(downloadUrl, "_blank");
        else alert("Download URL not available");
      } catch (err: any) {
        alert(err?.message || "Download failed");
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again later.");
    }
  };
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 95) return "bg-emerald-500";
    if (quality >= 90) return "bg-blue-500";
    if (quality >= 80) return "bg-yellow-500";
    return "bg-orange-500";
  };

  if (viewMode === "list") {
    return (
      <div
        className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/50 transition-all duration-300 group cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {dataset.title}
                </h3>
                <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                  {dataset.description}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Badge
                  variant="secondary"
                  className={`${getQualityColor(
                    dataset.quality
                  )} text-white font-medium`}
                >
                  {dataset.quality}% Quality
                </Badge>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompareToggle && onCompareToggle();
                    }}
                    className={`p-1 rounded ${
                      isCompared ? "bg-indigo-600 text-white" : "text-slate-400"
                    }`}
                    title={
                      isCompared ? "Remove from compare" : "Add to compare"
                    }
                  >
                    <Database className="w-4 h-4" />
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`ml-2 ${
                      isWishlisted ? "text-pink-400" : "text-slate-400"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleWishlist) onToggleWishlist();
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
              <div className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                {formatNumber(dataset.preview.rows)} rows
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {dataset.preview.columns} columns
              </div>
              <div className="flex items-center gap-1">
                <HardDrive className="w-4 h-4" />
                {dataset.preview.size}
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {formatNumber(dataset.downloads)} downloads
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {dataset.rating}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {dataset.lastUpdated}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">
                  by {dataset.creator}
                </span>
                <Badge variant="outline" className="text-xs">
                  {dataset.category}
                </Badge>
                {dataset.isPurchased && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDownload(e)}
                    className="text-slate-400 hover:text-indigo-300 ml-2"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <div className="flex gap-1">
                  {dataset.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {dataset.tags.length > 2 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-slate-500/10 text-slate-400"
                    >
                      +{dataset.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">
                  ${dataset.price}
                </span>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={(e) => handlePurchase(e)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Purchase
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:bg-slate-800/50 transition-all duration-300 group hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-1">
              {dataset.title}
            </h3>
            <p className="text-slate-300 text-sm line-clamp-2 mb-3">
              {dataset.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompareToggle && onCompareToggle();
              }}
              className={`p-1 rounded ${
                isCompared ? "bg-indigo-600 text-white" : "text-slate-400"
              }`}
              title={isCompared ? "Remove from compare" : "Add to compare"}
            >
              <Database className="w-4 h-4" />
            </button>
            <Button
              size="sm"
              variant="ghost"
              className={`text-slate-400 hover:text-pink-400 ml-2 ${
                isWishlisted ? "text-pink-400" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleWishlist) onToggleWishlist();
              }}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant="secondary"
            className={`${getQualityColor(
              dataset.quality
            )} text-white font-medium text-xs`}
          >
            {dataset.quality}% Quality
          </Badge>
          <Badge variant="outline" className="text-xs">
            {dataset.category}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 mb-4">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            {formatNumber(dataset.preview.rows)} rows
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {dataset.preview.columns} cols
          </div>
          <div className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {dataset.preview.size}
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {formatNumber(dataset.downloads)}
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {dataset.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
            >
              {tag}
            </Badge>
          ))}
          {dataset.tags.length > 2 && (
            <Badge
              variant="secondary"
              className="text-xs bg-slate-500/10 text-slate-400"
            >
              +{dataset.tags.length - 2}
            </Badge>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-400">by {dataset.creator}</div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {dataset.rating}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            {dataset.lastUpdated}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">
              ${dataset.price}
            </span>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={(e) => handlePurchase(e)}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Buy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
