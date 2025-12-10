"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Rocket,
  DollarSign,
  Users,
  Target,
  Info,
  ArrowRight,
  Zap,
  Lock,
  BarChart3,
  Coins,
  CheckCircle,
  ExternalLink,
  Timer,
  Activity,
  Award,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BondingCurveExplainerPage() {
  const steps = [
    {
      id: 1,
      title: "Create & Deploy",
      description: "Deploy your dataset token on a bonding curve for 100 $INAI",
      icon: Rocket,
      color: "purple",
    },
    {
      id: 2,
      title: "Bonding Curve Trading",
      description: "Trade on the bonding curve as price increases with demand",
      icon: TrendingUp,
      color: "blue",
    },
    {
      id: 3,
      title: "Graduation at $69k",
      description: "Automatic Uniswap V3 deployment when market cap hits $69k",
      icon: Target,
      color: "emerald",
    },
    {
      id: 4,
      title: "Earn Forever",
      description: "Collect 1.5% trading fees from all transactions",
      icon: DollarSign,
      color: "yellow",
    },
  ];

  const bondingCurveFeatures = [
    {
      title: "Fair Launch",
      description: "No pre-sales or team allocations. Everyone starts equal.",
      icon: Users,
    },
    {
      title: "Price Discovery",
      description:
        "Price increases as more people buy, creating natural demand.",
      icon: LineChart,
    },
    {
      title: "Instant Liquidity",
      description: "Buy and sell anytime on the bonding curve.",
      icon: Zap,
    },
    {
      title: "Automated Graduation",
      description: "Liquidity moves to Uniswap automatically at $69k.",
      icon: Award,
    },
  ];

  const earningsBreakdown = [
    {
      phase: "Pre-Graduation",
      description: "Bonding Curve",
      tradingFee: "1.5%",
      yourShare: "100%",
      example: "$15 per $1,000 traded",
    },
    {
      phase: "Post-Graduation",
      description: "Uniswap V3",
      tradingFee: "1.5%",
      yourShare: "100%",
      example: "$150 per $10,000 traded",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
            Bonding Curve Model
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            <span className="text-gradient">
              How Dataset Tokenization Works
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transform your synthetic datasets into tradeable tokens with our
            bonding curve mechanism. Graduate to Uniswap at $69k and earn
            trading fees forever.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Tokenizing
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              size="lg"
            >
              Create Dataset First
            </Button>
          </div>
        </motion.div>

        {/* Visual Process Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            The Journey to Uniswap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="relative"
              >
                <div
                  className={`p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center hover:border-${step.color}-500/50 transition-all`}
                >
                  <div
                    className={`w-16 h-16 mx-auto mb-4 bg-${step.color}-500/10 rounded-xl flex items-center justify-center`}
                  >
                    <step.icon className={`w-8 h-8 text-${step.color}-400`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-slate-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bonding Curve Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="p-8 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">
              Bonding Curve Mechanics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Curve Visualization */}
              <div className="bg-slate-900/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  Price Discovery Curve
                </h3>
                <div className="relative h-64 border-l-2 border-b-2 border-slate-600">
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0,100 Q 50,50 100,10"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-slate-400">
                    Market Cap →
                  </div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-slate-400">
                    Price →
                  </div>
                  <div className="absolute right-4 top-4 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1 text-xs text-emerald-300">
                    $69k Graduation
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                    <span className="text-slate-300">
                      Starting price: Low entry point
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-slate-300">
                      Mid-curve: Growing interest
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-slate-300">
                      Graduation: Uniswap deployment
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Why Bonding Curves?
                </h3>
                {bondingCurveFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    className="flex items-start gap-3 p-4 bg-slate-900/30 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Earnings Model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="p-8 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-emerald-400" />
              Your Earnings Model
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {earningsBreakdown.map((phase, index) => (
                <div
                  key={index}
                  className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl"
                >
                  <Badge className="mb-3 bg-blue-500/10 text-blue-300 border-blue-500/30">
                    {phase.phase}
                  </Badge>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {phase.description}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded">
                      <span className="text-sm text-slate-400">
                        Trading Fee
                      </span>
                      <span className="font-semibold text-white">
                        {phase.tradingFee}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded">
                      <span className="text-sm text-slate-400">Your Share</span>
                      <span className="font-semibold text-emerald-400">
                        {phase.yourShare}
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded">
                      <span className="text-sm text-emerald-300">
                        Example: {phase.example}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300 mb-1">
                  Lifetime Earnings
                </h4>
                <p className="text-sm text-blue-200/80">
                  As the dataset creator, you earn 1.5% from every trade -
                  whether on the bonding curve or Uniswap. Popular datasets can
                  generate thousands in monthly passive income.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Typical Dataset Lifecycle
          </h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-slate-700" />
            {[
              {
                time: "Day 1",
                event: "Deploy to bonding curve",
                detail: "Pay 100 $INAI, set token name",
                icon: Rocket,
              },
              {
                time: "Days 1-7",
                event: "Early trading begins",
                detail: "Price discovery, first holders",
                icon: Activity,
              },
              {
                time: "Week 2-4",
                event: "Community growth",
                detail: "Trading volume increases",
                icon: Users,
              },
              {
                time: "$69k Market Cap",
                event: "Graduation to Uniswap",
                detail: "Automatic liquidity deployment",
                icon: Target,
              },
              {
                time: "Forever",
                event: "Earn trading fees",
                detail: "1.5% from all transactions",
                icon: DollarSign,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className={`relative flex items-center ${
                  index % 2 === 0 ? "justify-start" : "justify-end"
                } mb-8`}
              >
                <div
                  className={`w-1/2 ${
                    index % 2 === 0 ? "pr-8 text-right" : "pl-8"
                  }`}
                >
                  <div
                    className={`p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl ${
                      index % 2 === 0 ? "ml-auto" : ""
                    } max-w-sm`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.time}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-white mb-1">
                      {item.event}
                    </h4>
                    <p className="text-sm text-slate-400">{item.detail}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-indigo-500 rounded-full border-2 border-background" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "What happens at $69k market cap?",
                a: "The bonding curve automatically deploys liquidity to Uniswap V3, providing deeper liquidity and enabling larger trades.",
              },
              {
                q: "How much does it cost to tokenize?",
                a: "100 $INAI flat fee to deploy your dataset token on the bonding curve.",
              },
              {
                q: "Can I sell my creator rights?",
                a: "Creator fees are tied to your wallet address and cannot be transferred.",
              },
              {
                q: "What if it doesn't reach $69k?",
                a: "Your dataset continues trading on the bonding curve. You still earn 1.5% from all trades.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl"
              >
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center"
        >
          <div className="p-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Tokenize Your Dataset?
            </h2>
            <p className="text-lg text-slate-400 mb-6">
              Join hundreds of creators earning passive income from their
              synthetic data.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => (window.location.href = "/dashboard")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                size="lg"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  window.open("https://docs.inflectiv.io", "_blank")
                }
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Read Docs
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
