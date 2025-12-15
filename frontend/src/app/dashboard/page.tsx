"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  Database,
  Rocket,
  Brain,
  Download,
  Activity,
  RefreshCw,
  ArrowUp,
  Target,
  Sparkles,
  Info,
  Shield,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Dataset {
  id: string;
  name: string;
  description: string;
  tier: string;
  status: string;
  category: string;
  marketCap: number;
  fdv?: number;
  earnings: number;
  createdAt: string;
  volume24h?: number;
  downloads?: number;
  holders?: number;
  qualityScore?: number;
  bondingProgress?: number;
  graduationThreshold?: number;
  deploymentType?: "public" | "private"; // New: tracks deployment type
  nftTokenId?: string; // New: for private NFT datasets
  storageProvider?: "arweave" | "walrus" | "ipfs"; // New: storage platform
  licenseRevenue?: number; // New: earnings from licensing
}

export default function DashboardPage() {
  /*
    TODO (UX roadmap):
    - Dashboard should subscribe to real-time earnings via socket; add `useEarningsSocket(userId)` hook.
    - Provide a prop or context hook for `onboardingMode` so onboarding can highlight dashboard widgets.
    - Expose `refreshDataset(id)` function to allow other components (onboarding/sample walkthrough) to trigger dataset refresh.
  */

  const [activeTab, setActiveTab] = useState<
    "overview" | "create" | "datasets" | "earnings" | "analytics"
  >("overview");

  // Real data state
  const [userStats, setUserStats] = useState<any | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<any | null>(null);

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Per-area errors to provide precise user-visible messages
  const [statsError, setStatsError] = useState<string | null>(null);
  const [datasetsError, setDatasetsError] = useState<string | null>(null);
  const [earningsError, setEarningsError] = useState<string | null>(null);

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") || "" : "";

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Sample fallback datasets to display when in demo mode and backend is unreachable
  const sampleDatasets: Dataset[] = [
    {
      id: "sample-1",
      name: "E-commerce Customer Analytics",
      description:
        "Comprehensive customer behavior and purchase data for retail analytics",
      tier: "production",
      status: "graduated",
      category: "Retail",
      marketCap: 186000,
      fdv: undefined,
      earnings: 5856,
      createdAt: new Date().toISOString(),
      volume24h: 15420,
      downloads: 342,
      holders: 156,
      qualityScore: 94,
      bondingProgress: 100,
      graduationThreshold: 69000,
      deploymentType: "public",
    },
    {
      id: "sample-2",
      name: "Financial Transaction Dataset",
      description: "Synthetic banking and transaction data for fintech applications",
      tier: "workflow",
      status: "bonding",
      category: "Finance",
      marketCap: 45300,
      fdv: undefined,
      earnings: 3127,
      createdAt: new Date().toISOString(),
      volume24h: 8920,
      downloads: 189,
      holders: 89,
      qualityScore: 91,
      bondingProgress: 66,
      graduationThreshold: 69000,
      deploymentType: "public",
    },
    {
      id: "sample-3",
      name: "Healthcare Records Dataset",
      description: "Anonymized patient data for medical research and analysis",
      tier: "production",
      status: "bonding",
      category: "Healthcare",
      marketCap: 28700,
      fdv: undefined,
      earnings: 2340,
      createdAt: new Date().toISOString(),
      volume24h: 5640,
      downloads: 124,
      holders: 67,
      qualityScore: 96,
      bondingProgress: 42,
      graduationThreshold: 69000,
      deploymentType: "public",
    },
    {
      id: "sample-4",
      name: "Enterprise Customer Database",
      description: "Private enterprise customer analytics for internal use",
      tier: "production",
      status: "private",
      category: "Enterprise",
      marketCap: 0,
      fdv: undefined,
      earnings: 2890,
      createdAt: new Date().toISOString(),
      volume24h: 0,
      downloads: 0,
      holders: 1,
      qualityScore: 98,
      bondingProgress: 0,
      graduationThreshold: 69000,
      deploymentType: "private",
      nftTokenId: "INAI-NFT-#1847",
      storageProvider: "arweave",
    },
    {
      id: "sample-5",
      name: "Social Media Analytics",
      description: "User engagement and content performance metrics",
      tier: "workflow",
      status: "draft",
      category: "Marketing",
      marketCap: 0,
      fdv: undefined,
      earnings: 0,
      createdAt: new Date().toISOString(),
      volume24h: 0,
      downloads: 0,
      holders: 0,
      qualityScore: 0,
      bondingProgress: 0,
      graduationThreshold: 69000,
      deploymentType: "public",
    },
  ];

  // Decide which datasets to display: prefer backend results; fall back to demo only when demo mode is enabled
  const displayedDatasets = datasets.length ? datasets : (isDemoMode ? sampleDatasets : []);

  const fetchUserStats = useCallback(async () => {
    if (!userId) return;
    setLoadingStats(true);
    setError(null);
    setStatsError(null);
    try {
      const { getUserStats } = await import("@/lib/api/dashboardClient");
      const data = await getUserStats(userId);
      setUserStats(data);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setStatsError(msg);
      setError(msg);
    } finally {
      setLoadingStats(false);
    }
  }, [userId]);

  const fetchUserDatasets = useCallback(async () => {
    if (!userId) return;
    setLoadingDatasets(true);
    setError(null);
    setDatasetsError(null);
    try {
      const { getUserDatasets } = await import("@/lib/api/dashboardClient");
      const data = await getUserDatasets(userId);
      setDatasets(data || []);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setDatasetsError(msg);
      setError(msg);
      // In demo mode, provide a sample dataset list so the UI remains useful
      if (isDemoMode) {
        setDatasets(sampleDatasets);
      }
    } finally {
      setLoadingDatasets(false);
    }
  }, [userId]);

  const fetchActivityFeed = useCallback(async () => {
    if (!userId) return;
    setLoadingActivity(true);
    setError(null);
    try {
      const { getActivityFeed } = await import("@/lib/api/dashboardClient");
      const data = await getActivityFeed(userId, 20);
      setActivityFeed(data);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoadingActivity(false);
    }
  }, [userId]);

  const fetchEarningsSummary = useCallback(async () => {
    if (!userId) return;
    setLoadingEarnings(true);
    setError(null);
    setEarningsError(null);
    try {
      const { getEarningsSummary } = await import("@/lib/api/dashboardClient");
      const data = await getEarningsSummary(userId);
      setEarningsSummary(data);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setEarningsError(msg);
      setError(msg);
    } finally {
      setLoadingEarnings(false);
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchUserStats(), fetchUserDatasets(), fetchActivityFeed()]);
      } catch (e) {
        // errors are handled in individual fetch functions and surfaced via state
      }
    })();
  }, [fetchUserStats, fetchUserDatasets, fetchActivityFeed]);
  

  // Subscribe to earnings socket updates to refresh earnings and activity in real-time
  // Use a dynamic require/import to avoid SSR issues in Next.js app router
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const useEarningsSocket = require("@/hooks/useEarningsSocket").default;
    // call the hook which will manage the socket lifecycle and invoke callbacks
    useEarningsSocket(userId || null, {
      onEarningsUpdate: (_payload: any) => {
        // Refresh earnings summary and recent activity when an update arrives
        try {
          fetchEarningsSummary();
          fetchActivityFeed();
        } catch (e) {
          // ignore
        }
      },
    });
  } catch (e) {
    // If the hook cannot be loaded (server-side) we silently ignore; page will still fetch on tab change
  }

  useEffect(() => {
    (async () => {
      if (activeTab === "earnings") {
        try {
          await fetchEarningsSummary();
        } catch (e) {
          // error set in fetchEarningsSummary
        }
      }
      if (activeTab === "analytics") {
        // lazy-load analytics when tab opens
        const { getPerformanceMetrics } = await import(
          "@/lib/api/dashboardClient"
        );
        try {
          await getPerformanceMetrics(userId);
        } catch (e) {
          // ignore for now
        }
      }
    })();
  }, [activeTab, fetchEarningsSummary, userId]);

  const handleStartCreation = () => {
    window.location.href = "/";
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "basic":
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
      case "workflow":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";
      case "production":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
      case "bonding":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";
      case "graduated":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "private":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
      case "failed":
        return "bg-red-500/10 text-red-300 border-red-500/30";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Creator Dashboard
          </h1>
          <p className="text-slate-400">
            Manage your datasets, track earnings, and monitor performance
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 p-1 bg-slate-800/50 rounded-xl overflow-x-auto">
          {[
            { id: "overview", name: "Overview", icon: BarChart3 },
            { id: "create", name: "Create & Deploy", icon: Rocket },
            { id: "datasets", name: "My Datasets", icon: Database },
            { id: "earnings", name: "Earnings", icon: DollarSign },
            { id: "analytics", name: "Analytics", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "overview"
                      | "create"
                      | "datasets"
                      | "earnings"
                      | "analytics"
                  )
                }
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
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
        <div>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Earnings Chart */}
                <div className="lg:col-span-2 p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      Earnings Overview
                    </h3>
                    <select className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 90 days</option>
                    </select>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    {loadingStats ? (
                      <div className="text-slate-400">
                        İstatistikler yükleniyor...
                      </div>
                    ) : userStats ? (
                      <div className="w-full grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800/20 rounded">
                          <div className="text-sm text-slate-400">
                            Toplam Kazanç
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {userStats.totalEarnings ?? 0}
                          </div>
                        </div>
                        <div className="p-4 bg-slate-800/20 rounded">
                          <div className="text-sm text-slate-400">Aylık</div>
                          <div className="text-2xl font-bold text-white">
                            {userStats.monthlyEarnings ?? 0}
                          </div>
                        </div>
                        <div className="p-4 bg-slate-800/20 rounded">
                          <div className="text-sm text-slate-400">
                            Yayınlanan Datasets
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {userStats.publishedDatasets ?? 0}
                          </div>
                        </div>
                        <div className="p-4 bg-slate-800/20 rounded">
                          <div className="text-sm text-slate-400">Sıralama</div>
                          <div className="text-2xl font-bold text-white">
                            {userStats.rankingPosition ?? "-"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400">
                        İstatistik bulunamadı
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        $3,456
                      </div>
                      <div className="text-sm text-slate-400">
                        Total this week
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ArrowUp className="w-4 h-4" />
                      <span className="font-medium">+23.5%</span>
                    </div>
                  </div>
                </div>

                {/* Top Performing Dataset */}
                <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Top Performer
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">
                          E-commerce Analytics
                        </h4>
                        <p className="text-sm text-slate-400">ECOM token</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          Market Cap
                        </span>
                        <span className="text-sm font-medium text-white">
                          $186K
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          Your Earnings
                        </span>
                        <span className="text-sm font-medium text-emerald-400">
                          5,856 $INAI
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          24h Volume
                        </span>
                        <span className="text-sm font-medium text-white">
                          $15.4K
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Live Activity
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  </h3>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      type: "trade",
                      user: "0x742d...5678",
                      action: "bought 1,000 ECOM",
                      value: "+15 $INAI",
                      time: "2 min ago",
                      color: "emerald",
                    },
                    {
                      type: "download",
                      user: "0x9abc...def0",
                      action: "downloaded Financial Dataset",
                      value: "+25 $INAI",
                      time: "5 min ago",
                      color: "blue",
                    },
                    {
                      type: "trade",
                      user: "0x1234...abcd",
                      action: "sold 500 FINX",
                      value: "+7.5 $INAI",
                      time: "12 min ago",
                      color: "yellow",
                    },
                    {
                      type: "milestone",
                      user: "System",
                      action: "Healthcare Dataset reached 100 holders!",
                      value: "Milestone",
                      time: "18 min ago",
                      color: "purple",
                    },
                    {
                      type: "trade",
                      user: "0x5678...9012",
                      action: "bought 2,000 HLTH",
                      value: "+30 $INAI",
                      time: "23 min ago",
                      color: "emerald",
                    },
                  ].map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 bg-${activity.color}-500/10 rounded-lg flex items-center justify-center`}
                        >
                          {activity.type === "trade" ? (
                            <TrendingUp
                              className={`w-4 h-4 text-${activity.color}-400`}
                            />
                          ) : activity.type === "download" ? (
                            <Download
                              className={`w-4 h-4 text-${activity.color}-400`}
                            />
                          ) : (
                            <Target
                              className={`w-4 h-4 text-${activity.color}-400`}
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-white">
                            <span className="font-mono text-slate-400">
                              {activity.user}
                            </span>{" "}
                            {activity.action}
                          </div>
                          <div className="text-xs text-slate-500">
                            {activity.time}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={`bg-${activity.color}-500/10 text-${activity.color}-300 border-${activity.color}-500/30`}
                      >
                        {activity.value}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View All Activity
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  onClick={handleStartCreation}
                  className="h-24 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex flex-col items-center justify-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  <span>New Dataset</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveTab("datasets")}
                >
                  <Database className="w-6 h-6" />
                  <span>My Datasets</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveTab("earnings")}
                >
                  <DollarSign className="w-6 h-6" />
                  <span>Earnings</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => (window.location.href = "/intelligence")}
                >
                  <Brain className="w-6 h-6" />
                  <span>Business Intel</span>
                </Button>
              </div>

              {/* Market Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h4 className="font-semibold text-white mb-4">
                    Trending Categories
                  </h4>
                  <div className="space-y-3">
                    {[
                      { category: "E-commerce", growth: "+45%", datasets: 234 },
                      { category: "Healthcare", growth: "+32%", datasets: 189 },
                      { category: "Finance", growth: "+28%", datasets: 156 },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-slate-300">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {item.datasets}
                          </span>
                          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs">
                            {item.growth}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h4 className="font-semibold text-white mb-4">
                    Platform Stats
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Total Volume (24h)
                      </span>
                      <span className="text-sm font-medium text-white">
                        $2.8M
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Active Traders
                      </span>
                      <span className="text-sm font-medium text-white">
                        15,234
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        New Datasets
                      </span>
                      <span className="text-sm font-medium text-white">
                        89 today
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h4 className="font-semibold text-white mb-4">
                    Your Ranking
                  </h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-400 mb-1">
                      #{loadingStats ? "…" : userStats?.rankingPosition ?? "-"}
                    </div>
                    <div className="text-sm text-slate-400 mb-3">
                      Creator Leaderboard
                    </div>
                    <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                      Top 5% Creator
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create & Deploy Tab */}
          {activeTab === "create" && (
            <div className="space-y-8">
              {/* Create New Dataset Section */}
              <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Create New Dataset
                    </h2>
                    <p className="text-slate-400">
                      Generate, validate, and tokenize your synthetic data
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                    <Brain className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="font-semibold text-white mb-2">
                      AI Generation
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Use advanced AI models to generate high-quality synthetic
                      data
                    </p>
                    <div className="text-sm text-blue-400">2-20 minutes</div>
                  </div>
                  <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                    <Shield className="w-8 h-8 text-emerald-400 mb-4" />
                    <h3 className="font-semibold text-white mb-2">
                      Validation & Compliance
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Multi-tier validation with enterprise compliance checking
                    </p>
                    <div className="text-sm text-emerald-400">3-30 minutes</div>
                  </div>
                  <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                    <Coins className="w-8 h-8 text-purple-400 mb-4" />
                    <h3 className="font-semibold text-white mb-2">
                      Tokenization
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Deploy to bonding curve and start earning
                    </p>
                    <div className="text-sm text-purple-400">100 $INAI fee</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleStartCreation}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Creating Dataset
                    <Rocket className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    onClick={() =>
                      (window.location.href = "/auto-price-engine")
                    }
                    variant="outline"
                    size="lg"
                  >
                    <Info className="w-5 h-5 mr-2" />
                    How It Works
                  </Button>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="p-8 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <h3 className="text-xl font-bold text-white mb-6">
                  Quick Start Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "E-commerce Analytics",
                      category: "Retail",
                      tier: "workflow",
                      earnings: "1.2K/mo",
                    },
                    {
                      name: "Financial Transactions",
                      category: "Finance",
                      tier: "production",
                      earnings: "2.8K/mo",
                    },
                    {
                      name: "Healthcare Records",
                      category: "Medical",
                      tier: "production",
                      earnings: "3.5K/mo",
                    },
                    {
                      name: "IoT Sensor Data",
                      category: "Industrial",
                      tier: "workflow",
                      earnings: "1.8K/mo",
                    },
                    {
                      name: "Social Media Analytics",
                      category: "Marketing",
                      tier: "basic",
                      earnings: "0.8K/mo",
                    },
                    {
                      name: "Custom Dataset",
                      category: "Custom",
                      tier: "workflow",
                      earnings: "Variable",
                    },
                  ].map((template, index) => (
                    <button
                      key={index}
                      onClick={handleStartCreation}
                      className="p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-all text-left"
                    >
                      <h4 className="font-semibold text-white mb-2">
                        {template.name}
                      </h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">
                          {template.category}
                        </span>
                        <Badge
                          className={getTierColor(template.tier)}
                          variant="outline"
                        >
                          {template.tier}
                        </Badge>
                      </div>
                      <div className="text-sm text-emerald-400">
                        Est. {template.earnings}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Datasets Tab */}
          {activeTab === "datasets" && (
            <div className="space-y-6">
              {/* Dataset Cards */}
              {loadingDatasets ? (
                <div className="text-center py-16">
                  <div className="loader mb-4">Loading datasets...</div>
                  <p className="text-slate-400">Please wait while we fetch your datasets.</p>
                </div>
              ) : datasetsError ? (
                <div className="text-center py-16">
                  <div className="text-red-400 mb-4">{datasetsError}</div>
                  {isDemoMode ? (
                    <div className="text-slate-400 mb-4">Showing demo datasets because demo mode is enabled.</div>
                  ) : (
                    <div className="text-slate-400 mb-4">No datasets could be loaded. If this persists, contact support.</div>
                  )}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDatasetsError(null);
                        setError(null);
                        setPage(1);
                        fetchUserDatasets();
                      }}
                    >
                      Retry
                    </Button>
                    {!isDemoMode && (
                      <Button onClick={handleStartCreation} className="bg-indigo-600 hover:bg-indigo-700">
                        Create First Dataset
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                displayedDatasets.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-slate-400 mb-4">You don't have any datasets yet.</div>
                    <div className="text-slate-400 mb-4">Start by creating a dataset to see it here.</div>
                    <Button onClick={handleStartCreation} className="bg-indigo-600 hover:bg-indigo-700">
                      Create First Dataset
                    </Button>
                  </div>
                ) : (
                  displayedDatasets.map((dataset) => (
                    <motion.div
                      key={dataset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-all"
                    >
                
                  ))
                )
              )}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Dataset Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <Database className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">
                              {dataset.name}
                            </h3>
                            <Badge className={getStatusColor(dataset.status)}>
                              {dataset.status === "graduated"
                                ? "🎓 Graduated"
                                : dataset.status === "bonding"
                                ? "📈 Bonding"
                                : dataset.status === "private"
                                ? "🔒 Private NFT"
                                : dataset.status === "draft"
                                ? "📝 Draft"
                                : dataset.status}
                            </Badge>
                            {dataset.deploymentType === "private" && (
                              <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 ml-2">
                                NFT Asset
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mt-1">
                            {dataset.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <Badge className={getTierColor(dataset.tier)}>
                          {dataset.tier.charAt(0).toUpperCase() +
                            dataset.tier.slice(1)}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {dataset.category}
                        </span>
                        <span className="text-sm text-slate-500">
                          Created {dataset.createdAt}
                        </span>
                      </div>

                      {/* Quality Score */}
                      {dataset.qualityScore! > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-400">
                              Quality Score
                            </span>
                            <span className="text-sm font-medium text-white">
                              {dataset.qualityScore}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/30 rounded-full h-2">
                            <div
                              className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${dataset.qualityScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bonding Progress */}
                    <div>
                      <h4 className="font-medium text-white mb-3">
                        {dataset.status === "graduated"
                          ? "Graduated 🎓"
                          : dataset.status === "private"
                          ? "NFT Certificate 🔒"
                          : "Bonding Progress"}
                      </h4>
                      {dataset.status === "graduated" ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <div className="text-sm text-emerald-300 mb-1">
                            Uniswap V3
                          </div>
                          <div className="text-lg font-semibold text-emerald-400">
                            Deployed!
                          </div>
                          <div className="text-xs text-emerald-300 mt-1">
                            Earning 1.5% forever
                          </div>
                        </div>
                      ) : dataset.status === "private" ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <div className="text-sm text-indigo-300 mb-1">
                              NFT Token ID
                            </div>
                            <div className="text-lg font-semibold text-indigo-400 font-mono">
                              {dataset.nftTokenId}
                            </div>
                            <div className="text-xs text-indigo-300 mt-1">
                              Stored on {dataset.storageProvider?.toUpperCase()}
                            </div>
                          </div>
                          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="text-sm text-purple-300 mb-1">
                              Verification
                            </div>
                            <div className="text-sm font-medium text-purple-400">
                              ✓ Provenance Verified
                            </div>
                            <div className="text-xs text-purple-300 mt-1">
                              Digital certificate of ownership
                            </div>
                          </div>
                        </div>
                      ) : dataset.status === "bonding" ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="text-sm text-blue-300 mb-1">
                              Progress to $69K
                            </div>
                            <div className="text-lg font-semibold text-blue-400">
                              ${dataset.marketCap.toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-300 mt-1">
                              ${(69000 - dataset.marketCap).toLocaleString()} to
                              go
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-slate-400">
                                Graduation Progress
                              </span>
                              <span className="text-xs text-white">
                                {dataset.bondingProgress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-700/30 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${dataset.bondingProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-700/20 border border-slate-600/30 rounded-lg">
                          <div className="text-sm text-slate-400 mb-1">
                            Status
                          </div>
                          <div className="text-lg font-semibold text-slate-300">
                            Draft
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Ready to publish
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trading Metrics */}
                    <div>
                      <h4 className="font-medium text-white mb-3">
                        Trading Metrics
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-900/40 rounded-lg">
                          <div className="text-sm text-slate-400">
                            24h Volume
                          </div>
                          <div className="text-lg font-semibold text-white">
                            ${dataset.volume24h?.toLocaleString() || "0"}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Downloads:</span>
                          <span className="text-white font-medium">
                            {dataset.downloads}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Holders:</span>
                          <span className="text-white font-medium">
                            {dataset.holders}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Earnings */}
                    <div>
                      <h4 className="font-medium text-white mb-3">
                        Your Earnings
                      </h4>
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-3">
                        <div className="text-sm text-emerald-300 mb-1">
                          Total Earned
                        </div>
                        <div className="text-xl font-bold text-emerald-400">
                          {dataset.earnings.toLocaleString()} $INAI
                        </div>
                      </div>

                      {dataset.status !== "draft" && (
                        <div className="space-y-2 text-xs">
                          {dataset.deploymentType === "private" ? (
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                License Revenue:
                              </span>
                              <span className="text-indigo-400">
                                {dataset.licenseRevenue?.toLocaleString()} $INAI
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  Trading Fees (1.5%):
                                </span>
                                <span className="text-blue-400">
                                  {Math.floor(
                                    dataset.earnings * 0.6
                                  ).toLocaleString()}{" "}
                                  $INAI
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  Downloads:
                                </span>
                                <span className="text-emerald-400">
                                  {Math.floor(
                                    dataset.earnings * 0.4
                                  ).toLocaleString()}{" "}
                                  $INAI
                                </span>
                              </div>
                            </>
                          )}
                          {dataset.status === "graduated" && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Graduation Bonus:
                              </span>
                              <span className="text-purple-400">
                                3,000 $INAI
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-700/50">
                    {dataset.status === "draft" ? (
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Rocket className="w-4 h-4 mr-2" />
                        Publish & Tokenize
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download Data
                        </Button>
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === "earnings" && (
            <div className="space-y-6">
              {/* Earnings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-400 mb-2">
                    {loadingStats
                      ? "Loading..."
                      : userStats
                      ? `${Number(
                          userStats.totalEarnings
                        ).toLocaleString()} $INAI`
                      : "0 $INAI"}
                  </div>
                  <div className="text-slate-400">Total Earned</div>
                  <div className="text-xs text-emerald-300 mt-1">
                    +12.5% this month
                  </div>
                </div>
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {loadingEarnings
                      ? "Loading..."
                      : earningsSummary
                      ? `${earningsSummary.monthly} $INAI`
                      : "0 $INAI"}
                  </div>
                  <div className="text-slate-400">This Month</div>
                  <div className="text-xs text-blue-300 mt-1">
                    From{" "}
                    {loadingStats ? "..." : userStats?.publishedDatasets ?? 0}{" "}
                    datasets
                  </div>
                </div>
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {loadingStats
                      ? "Loading..."
                      : userStats
                      ? `${userStats.weeklyEarnings} $INAI`
                      : "0 $INAI"}
                  </div>
                  <div className="text-slate-400">This Week</div>
                  <div className="text-xs text-purple-300 mt-1">
                    Trading fees & downloads
                  </div>
                </div>
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">
                    1.5%
                  </div>
                  <div className="text-slate-400">Trading Fee Rate</div>
                  <div className="text-xs text-yellow-300 mt-1">
                    Forever on all trades
                  </div>
                </div>
              </div>

              {/* Earnings by Dataset */}
              <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Earnings by Dataset
                </h3>
                <div className="space-y-4">
                  {datasets
                    .filter((d) => d.earnings > 0)
                    .map((dataset) => (
                      <div
                        key={dataset.id}
                        className="p-4 bg-slate-900/30 border border-slate-700/30 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-indigo-400" />
                            <div>
                              <h4 className="font-medium text-white">
                                {dataset.name}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={getStatusColor(dataset.status)}
                                >
                                  {dataset.status === "graduated"
                                    ? "🎓 Graduated"
                                    : "📈 Bonding"}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {dataset.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-emerald-400">
                              {dataset.earnings.toLocaleString()} $INAI
                            </div>
                            <div className="text-xs text-slate-400">
                              Total earned
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-slate-400">Trading Fees</div>
                            <div className="text-blue-400 font-medium">
                              {Math.floor(
                                dataset.earnings * 0.6
                              ).toLocaleString()}{" "}
                              $INAI
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Downloads</div>
                            <div className="text-emerald-400 font-medium">
                              {Math.floor(
                                dataset.earnings * 0.3
                              ).toLocaleString()}{" "}
                              $INAI
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Market Cap</div>
                            <div className="text-white font-medium">
                              ${dataset.marketCap.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">24h Volume</div>
                            <div className="text-white font-medium">
                              ${dataset.volume24h?.toLocaleString() || "0"}
                            </div>
                          </div>
                        </div>

                        {dataset.status === "graduated" && (
                          <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-400" />
                              <span className="text-sm text-purple-300">
                                Graduation Bonus: 3,000 $INAI
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Earnings Breakdown by Type */}
              <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Earnings by Type
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="text-white">Trading Fees (1.5%)</span>
                        <div className="text-xs text-slate-400">
                          Forever on all trades
                        </div>
                      </div>
                    </div>
                    <span className="text-blue-400 font-semibold">
                      8,420 $INAI
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-white">Download Fees</span>
                        <div className="text-xs text-slate-400">
                          Per dataset access
                        </div>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-semibold">
                      3,127 $INAI
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-white">Graduation Bonuses</span>
                        <div className="text-xs text-slate-400">
                          3,000 $INAI per graduation
                        </div>
                      </div>
                    </div>
                    <span className="text-purple-400 font-semibold">
                      3,000 $INAI
                    </span>
                  </div>
                </div>
              </div>

              {/* Passive Income Information */}
              <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">
                  💰 Passive Income Stream
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-emerald-300 mb-2">
                      Trading Fee Earnings
                    </h4>
                    <p className="text-sm text-slate-300 mb-3">
                      Earn 1.5% on every trade of your tokenized datasets
                      forever. No expiration, no limits - true passive income.
                    </p>
                    <div className="text-2xl font-bold text-emerald-400">
                      8,420 $INAI earned
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-300 mb-2">
                      Graduation Milestones
                    </h4>
                    <p className="text-sm text-slate-300 mb-3">
                      Receive 3,000 $INAI bonus when your dataset reaches $69K
                      market cap and graduates to Uniswap V3.
                    </p>
                    <div className="text-2xl font-bold text-blue-400">
                      1 graduated dataset
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-8">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h4 className="font-medium text-white mb-2">Total Revenue</h4>
                  <div className="text-2xl font-bold text-emerald-400 mb-1">
                    $47,230
                  </div>
                  <div className="text-sm text-emerald-300">
                    +18.5% vs last month
                  </div>
                </div>
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h4 className="font-medium text-white mb-2">
                    Active Datasets
                  </h4>
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    12
                  </div>
                  <div className="text-sm text-blue-300">
                    4 on bonding curve
                  </div>
                </div>
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h4 className="font-medium text-white mb-2">Graduated</h4>
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    3
                  </div>
                  <div className="text-sm text-purple-300">
                    Reached $69K cap
                  </div>
                </div>
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h4 className="font-medium text-white mb-2">
                    Avg Performance
                  </h4>
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    87%
                  </div>
                  <div className="text-sm text-yellow-300">Quality index</div>
                </div>
              </div>

              {/* Dataset Comparison Tool */}
              <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Dataset Comparison
                  </h3>
                  <Button variant="outline" size="sm">
                    Export Analysis
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[
                    {
                      name: "E-commerce Analytics",
                      status: "graduated",
                      marketCap: "$92,000",
                      volume24h: "$15,420",
                      earnings: "5,856 $INAI",
                      downloads: 342,
                      holders: 156,
                      qualityScore: 94,
                      performanceIndex: 92,
                    },
                    {
                      name: "Financial Dataset",
                      status: "bonding",
                      marketCap: "$45,300",
                      volume24h: "$8,920",
                      earnings: "3,127 $INAI",
                      downloads: 189,
                      holders: 89,
                      qualityScore: 91,
                      performanceIndex: 78,
                    },
                    {
                      name: "Healthcare Records",
                      status: "bonding",
                      marketCap: "$28,700",
                      volume24h: "$5,640",
                      earnings: "2,340 $INAI",
                      downloads: 124,
                      holders: 67,
                      qualityScore: 96,
                      performanceIndex: 85,
                    },
                  ].map((dataset, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-white">
                          {dataset.name}
                        </h4>
                        <Badge
                          className={
                            dataset.status === "graduated"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                          }
                        >
                          {dataset.status === "graduated"
                            ? "Graduated"
                            : "Bonding"}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">
                            Market Cap
                          </span>
                          <span className="text-sm font-medium text-white">
                            {dataset.marketCap}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">
                            24h Volume
                          </span>
                          <span className="text-sm font-medium text-white">
                            {dataset.volume24h}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">
                            Your Earnings
                          </span>
                          <span className="text-sm font-medium text-emerald-400">
                            {dataset.earnings}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">
                            Downloads
                          </span>
                          <span className="text-sm font-medium text-white">
                            {dataset.downloads}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">
                            Holders
                          </span>
                          <span className="text-sm font-medium text-white">
                            {dataset.holders}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-slate-700/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-400">
                              Quality Score
                            </span>
                            <span className="text-sm font-medium text-white">
                              {dataset.qualityScore}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/30 rounded-full h-2">
                            <div
                              className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${dataset.qualityScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-400">
                              Performance Index
                            </span>
                            <span className="text-sm font-medium text-white">
                              {dataset.performanceIndex}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/30 rounded-full h-2">
                            <div
                              className="bg-indigo-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${dataset.performanceIndex}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <h4 className="font-medium text-indigo-300 mb-2">
                    🤖 AI Insights
                  </h4>
                  <p className="text-sm text-indigo-200/80">
                    E-commerce Analytics is your top performer with graduation
                    to Uniswap! Healthcare Records shows strong quality metrics
                    (96%) and could be next to graduate. Consider optimizing
                    Financial Dataset promotion to boost holder count.
                  </p>
                </div>
              </div>

              {/* Category Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Category Distribution
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        category: "E-commerce",
                        count: 4,
                        revenue: "$18,420",
                        color: "emerald",
                      },
                      {
                        category: "Finance",
                        count: 3,
                        revenue: "$14,230",
                        color: "blue",
                      },
                      {
                        category: "Healthcare",
                        count: 2,
                        revenue: "$9,870",
                        color: "purple",
                      },
                      {
                        category: "Marketing",
                        count: 2,
                        revenue: "$3,940",
                        color: "yellow",
                      },
                      {
                        category: "Industrial",
                        count: 1,
                        revenue: "$770",
                        color: "slate",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full bg-${item.color}-400`}
                          />
                          <span className="text-white">{item.category}</span>
                          <span className="text-sm text-slate-400">
                            ({item.count})
                          </span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {item.revenue}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    User Engagement
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Avg Session Duration
                      </span>
                      <span className="text-white font-medium">8m 34s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pages per Session</span>
                      <span className="text-white font-medium">4.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bounce Rate</span>
                      <span className="text-white font-medium">23%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Return Visitors</span>
                      <span className="text-white font-medium">67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Conversion Rate</span>
                      <span className="text-emerald-400 font-medium">
                        12.8%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Generate Report
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Date Range:</span>
                  <select className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white">
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last year</option>
                    <option>All time</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
