import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-red-200 rounded text-center h-full min-h-[200px]">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">UI Component Failure</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">
            {this.props.fallbackMessage || 'This section encountered an unexpected error.'}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleReset} className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3" />
            Reload Section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
