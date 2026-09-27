import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Veris ErrorBoundary Caught]:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="fixed bottom-6 right-6 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 z-[80] shadow-2xl">
            Console encountered an error. Click reload to refresh.
          </div>
        )
      );
    }

    return this.props.children;
  }
}
