import React from "react";

export default function AnalyticsPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Analytics</h1>
      <p className="text-sm text-slate-600 mb-4">
        This is a lightweight diagnostics page to show the analytics endpoint
        is present. The app posts web-vitals to <code>/api/analytics/web-vitals</code>.
      </p>
      <section className="bg-white border rounded p-4 shadow-sm">
        <p className="text-sm">Status: <strong>Enabled</strong></p>
        <p className="text-xs text-slate-500 mt-2">If you want richer analytics, we can
          implement persistence or a simple in-memory log for development.</p>
      </section>
    </main>
  );
}
