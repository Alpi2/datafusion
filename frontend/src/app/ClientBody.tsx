"use client";

import { useEffect } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import mixpanel from "mixpanel-browser";
import { getCLS, getFID, getLCP } from "web-vitals";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  useEffect(() => {
    // Dynamically load `same-runtime` after hydration to avoid it mutating
    // the documentElement before React hydrates (prevents hydration mismatch).
    try {
      if (typeof window !== "undefined" && !document.getElementById("same-runtime-script")) {
        const s = document.createElement("script");
        s.id = "same-runtime-script";
        s.src = "https://unpkg.com/same-runtime/dist/index.global.js";
        s.crossOrigin = "anonymous";
        s.async = true;
        document.head.appendChild(s);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Initialize Sentry on client
    try {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      if (dsn) {
        Sentry.init({ dsn });
      }
    } catch (e) {
      // ignore
    }

    // Initialize Mixpanel if token provided
    try {
      const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
      if (token && typeof window !== "undefined") {
        mixpanel.init(token);
      }
    } catch (e) {
      // ignore
    }

    // Report web vitals to analytics endpoint or console
    const reportMetric = (metric: any) => {
      try {
        // You can forward metrics to an analytics provider here
        // e.g., mixpanel.track or send to your backend
        if ((window as any).mixpanel) {
          (window as any).mixpanel.track("web_vital", metric);
        } else {
          // fallback: send to /api/analytics/web-vitals if implemented
          navigator.sendBeacon(
            `${process.env.NEXT_PUBLIC_API_URL || ""}/api/analytics/web-vitals`,
            JSON.stringify(metric)
          );
        }
      } catch (e) {
        // ignore
      }
    };
    getCLS(reportMetric);
    getFID(reportMetric);
    getLCP(reportMetric);
  }, []);

  // Show onboarding prompt for new users (client-only)
  useEffect(() => {
    try {
      const completed = localStorage.getItem("hasCompletedOnboarding");
      if (!completed) setShowOnboardingPrompt(true);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = () => setShowOnboardingPrompt(false);
    window.addEventListener("onboarding:completed", handler);
    window.addEventListener("onboarding:skipped", handler);
    return () => {
      window.removeEventListener("onboarding:completed", handler);
      window.removeEventListener("onboarding:skipped", handler);
    };
  }, []);

  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="antialiased">
        {showOnboardingPrompt && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="text-sm text-white">
              New here? Try the onboarding tour.
            </div>
            <a
              href="/onboarding"
              className="px-3 py-2 bg-emerald-600 rounded text-sm text-white"
              onClick={() => {
                try {
                  localStorage.setItem("hasCompletedOnboarding", "0");
                } catch (e) {}
              }}
            >
              Start
            </a>
            <button
              onClick={() => {
                try {
                  localStorage.setItem("hasCompletedOnboarding", "1");
                } catch (e) {}
                setShowOnboardingPrompt(false);
                // emit analytics
                try {
                  // @ts-ignore
                  if ((window as any).gtag)
                    (window as any).gtag("event", "onboarding_prompt_dismiss", {
                      event_category: "onboarding",
                    });
                } catch (_) {}
              }}
              className="px-2 py-1 bg-slate-700 rounded text-sm text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
        {children}
      </div>
    </QueryClientProvider>
  );
}
