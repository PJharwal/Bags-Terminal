'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 bg-[#0A0A0A] border border-[#FF003C]/30">
          <AlertTriangle size={20} className="text-[#FF003C]" />
          <p className="text-[11px] text-[#FF003C] font-mono text-center">
            {this.props.fallbackMessage || 'Something went wrong'}
          </p>
          {this.state.error && (
            <p className="text-[9px] text-[#666] font-mono max-w-sm text-center">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="btn-press flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase text-[#888] border border-[#333] hover:border-[#EDEDED] hover:text-[#EDEDED]"
          >
            <RotateCcw size={10} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
