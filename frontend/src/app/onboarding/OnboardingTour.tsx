"use client";

import React, { useEffect, useState } from "react";

export default function OnboardingTour() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // simple steps for the card UI (Shepherd will show the in-page tour)
  const steps = [
    {
      title: "Create a dataset",
      desc: "We'll walk you through creating a sample dataset.",
    },
    {
      title: "Generate sample rows",
      desc: "Preview a few rows before running a full job.",
    },
    {
      title: "Publish & Earn",
      desc: "Publish to the marketplace and see earnings.",
    },
  ];

  // Trigger analytics event if gtag available
  const track = (action: string) => {
    try {
      // @ts-ignore
      if (typeof window !== "undefined" && (window as any).gtag) {
        // @ts-ignore
        (window as any).gtag("event", action, { event_category: "onboarding" });
      }
    } catch (e) {
      // ignore
    }
  };

  // Run a sample generation by dispatching a global event so GenerationInterface can pick it up
  const runSampleWalkthrough = async () => {
    setIsRunning(true);
    track("onboarding_start");

    // dispatch a CustomEvent that GenerationInterface listens to
    try {
      const payload = {
        prompt:
          "Generate 5 realistic customer records with name, email, age, location, and total_spent",
        tier: "basic",
        previewRows: 5,
      };
      window.dispatchEvent(
        new CustomEvent("onboarding:run-sample", { detail: payload })
      );
      track("onboarding_run_sample");
    } catch (e) {
      console.warn("Failed to dispatch onboarding sample event", e);
    }
  };

  // Complete / skip handlers
  const completeOnboarding = () => {
    try {
      localStorage.setItem("hasCompletedOnboarding", "1");
      track("onboarding_complete");
      // notify other parts of the app
      window.dispatchEvent(new CustomEvent("onboarding:completed"));
    } catch (e) {
      // ignore
    }
  };

  const skipOnboarding = () => {
    try {
      localStorage.setItem("hasCompletedOnboarding", "1");
      track("onboarding_skipped");
      window.dispatchEvent(new CustomEvent("onboarding:skipped"));
    } catch (e) {
      // ignore
    }
  };

  // Optionally, we could lazy-load a Shepherd tour here and attach to DOM selectors.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      try {
        // Dynamically import Shepherd to avoid SSR issues
        const Shepherd = (await import("shepherd.js")).default;
        // basic styles are needed; app likely already includes them via global CSS, otherwise user can add.
        // we only prepare the object — actual start is left to user clicking Run sample or other triggers
      } catch (e) {
        // Sheperd optional; ignore if not available
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
      <h3 className="text-lg font-semibold text-white mb-2">Quick Tour</h3>
      <div className="mb-4">
        <div className="text-white font-medium">{steps[currentStep].title}</div>
        <div className="text-slate-400 text-sm">{steps[currentStep].desc}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          className="px-3 py-2 bg-slate-700 rounded text-white"
        >
          Previous
        </button>
        <button
          onClick={() =>
            setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
          }
          className="px-3 py-2 bg-indigo-600 rounded text-white"
        >
          Next
        </button>
        <button
          onClick={runSampleWalkthrough}
          className="ml-auto px-3 py-2 bg-emerald-600 rounded text-white"
          disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run sample walkthrough"}
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <a
          href="https://example.com/tutorial-video"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-slate-400 underline"
        >
          Watch a short tutorial video
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={skipOnboarding}
            className="px-3 py-2 bg-slate-700 rounded text-white text-sm"
          >
            Skip
          </button>
          <button
            onClick={completeOnboarding}
            className="px-3 py-2 bg-blue-600 rounded text-white text-sm"
          >
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}
