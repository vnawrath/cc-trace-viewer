import { Link } from 'react-router';
import { Navigation } from './Navigation';

export function Header() {
  return (
    <header className="bg-[var(--color-base-900)] border-b border-[var(--color-border-subtle)] sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 group hover:opacity-80 transition-opacity duration-200"
            >
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-[var(--color-accent-600)] rounded flex items-center justify-center group-hover:shadow-[var(--shadow-glow-accent)] transition-shadow duration-200">
                  <svg
                    className="h-3.5 w-3.5 text-[var(--color-text-primary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
                  CC Trace Viewer
                </h1>
                <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono hidden sm:block leading-none">
                  Debug trace analysis
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden md:block">
            <Navigation />
          </div>

          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-medium)] transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="md:hidden pb-2">
          <Navigation />
        </div>
      </div>
    </header>
  );
}