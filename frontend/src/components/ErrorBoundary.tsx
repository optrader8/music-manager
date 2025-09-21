import { Component, PropsWithChildren, ReactNode } from 'react';

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: unknown) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error', { error, info });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>문제가 발생했습니다.</h2>
        <p>{this.state.error?.message ?? '예기치 못한 오류가 발생했습니다.'}</p>
        <button type="button" onClick={this.handleReset}>
          다시 시도
        </button>
      </div>
    );
  }
}
