// Performance helpers and recommended defaults for the frontend

export const REACT_QUERY_DEFAULTS = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 30, // 30 minutes
  refetchOnWindowFocus: false,
};

import React from 'react';
// Lazy-load helpers (use React.lazy + Suspense for heavy components)
export function lazyImport<T extends { default: any }>(factory: () => Promise<T>) {
  return React.lazy(factory as any);
}

// Placeholder for service worker registration
export function registerServiceWorker() {
  if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('ServiceWorker registration failed:', err);
      });
    });
  }
}

// Virtual scrolling note: use libraries like react-window or react-virtual
// for rendering large lists efficiently.
