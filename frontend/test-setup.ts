import "@testing-library/jest-dom";

// Polyfill for window.matchMedia if needed
if (!window.matchMedia) {
  (window as any).matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  });
}
