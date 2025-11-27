import { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-base-950)] px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
          <div className="mx-auto max-w-max">
            <main className="sm:flex items-center gap-6">
              <p className="text-6xl font-bold font-mono text-[var(--color-error-500)] sm:text-7xl">
                Error
              </p>
              <div>
                <div className="sm:border-l sm:border-[var(--color-border-subtle)] sm:pl-6">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
                    Something went wrong
                  </h1>
                  <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
                    An unexpected error occurred while loading this page.
                  </p>
                </div>
                <div className="mt-8 flex gap-3 sm:border-l sm:border-transparent sm:pl-6">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center rounded px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] transition-colors duration-200"
                  >
                    Reload page
                  </button>
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="inline-flex items-center rounded px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:bg-[var(--color-surface-medium)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                  >
                    Go home
                  </button>
                </div>
                {this.state.error && (
                  <div className="mt-6 sm:border-l sm:border-transparent sm:pl-6">
                    <details className="text-sm text-[var(--color-text-secondary)]">
                      <summary className="cursor-pointer font-medium hover:text-[var(--color-text-primary)]">
                        Error details
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap bg-[var(--color-base-900)] border border-[var(--color-border-subtle)] p-3 rounded text-xs font-mono text-[var(--color-error-400)]">
                        {this.state.error.message}
                        {this.state.error.stack}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}