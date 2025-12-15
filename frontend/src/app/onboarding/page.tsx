"use client";

import React from "react";
import OnboardingTour from "./OnboardingTour";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome to DataFusion
        </h1>
        <p className="text-slate-400 mb-6">
          Interactive onboarding to get you started.
        </p>
        <OnboardingTour />
      </div>
    </div>
  );
}
