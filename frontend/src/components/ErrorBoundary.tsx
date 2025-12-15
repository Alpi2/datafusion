"use client";

import React from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  async componentDidCatch(error: Error, info: any) {
    // Log to console / remote
    // Attempt to show a toast if react-hot-toast is available
    try {
      const toast = await import("react-hot-toast").then((m) => m.default || m.toast).catch(() => null);
      if (toast) toast.error("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
    } catch (e) {
      // ignore
    }
    // You can also send errors to a remote logging service here
    console.error("Uncaught error in ErrorBoundary:", error, info);
    this.setState({ hasError: true, error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 rounded">
          <h2 className="text-lg font-semibold">Bir hata oluştu</h2>
          <p>Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;
