"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  User,
  Key,
  Shield,
  ArrowRight,
  CheckCircle,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AuthPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [inflBalance, setInflBalance] = useState(1247);

  const handleConnectWallet = () => {
    // Simulate wallet connection
    setTimeout(() => {
      setWalletAddress("0x742d35Cc6e4F3B2f1F5a8e4c1D2A7B8C3D4E5F6A");
      setIsConnected(true);
    }, 2000);
  };

  const handleCreateProfile = () => {
    // Simulate profile creation
    if (username.trim()) {
      // Redirect to dashboard after profile creation
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold">
              <span className="text-gradient">Connect & Create</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect your wallet to start tokenizing datasets and earning $INFL
            tokens from your data.
          </p>
        </motion.div>

        {/* Authentication Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          {/* Step 1: Wallet Connection */}
          <div
            className={`p-8 border rounded-2xl mb-6 transition-all ${
              isConnected
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-slate-700/50 bg-slate-800/30"
            }`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isConnected ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                {isConnected ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <Wallet className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                <p className="text-slate-400">
                  Connect your Web3 wallet to get started
                </p>
              </div>
            </div>

            {!isConnected ? (
              <Button
                onClick={handleConnectWallet}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <div className="text-sm text-slate-400">Wallet Address</div>
                    <div className="text-white font-mono text-sm">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <div className="text-sm text-slate-400">$INFL Balance</div>
                    <div className="text-white font-semibold">
                      {inflBalance.toLocaleString()} $INFL
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                    Active
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Profile Setup */}
          <div
            className={`p-8 border rounded-2xl transition-all ${
              isConnected
                ? "border-slate-700/50 bg-slate-800/30"
                : "border-slate-700/30 bg-slate-800/10 opacity-50"
            }`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isConnected ? "bg-indigo-600" : "bg-slate-700"
                }`}
              >
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create Profile</h2>
                <p className="text-slate-400">Set up your creator profile</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Creator Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username..."
                  disabled={!isConnected}
                  className="w-full p-4 bg-slate-900/40 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Creator Benefits
                  </h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Tokenize your datasets</li>
                    <li>• Earn 70% of trading fees</li>
                    <li>• Build your reputation</li>
                    <li>• Access creator tools</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-400" />
                    Publishing Process
                  </h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Generate dataset preview</li>
                    <li>• Pay 100 $INFL to publish</li>
                    <li>• Start on bonding curve</li>
                    <li>• Earn from dataset usage</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={handleCreateProfile}
                disabled={!isConnected || !username.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                size="lg"
              >
                Create Profile & Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            What You Can Do After Connecting
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">
                Publish Datasets
              </h4>
              <p className="text-sm text-slate-400">
                Turn your generated datasets into tradeable tokens with bonding
                curves
              </p>
            </div>
            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">
                Creator Dashboard
              </h4>
              <p className="text-sm text-slate-400">
                Track your published datasets, earnings, and marketplace
                performance
              </p>
            </div>
            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Earn Revenue</h4>
              <p className="text-sm text-slate-400">
                Receive 70% of trading fees when others trade your dataset
                tokens
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
