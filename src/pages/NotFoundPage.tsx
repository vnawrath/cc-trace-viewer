import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--color-base-950)] px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="mx-auto max-w-max">
        <main className="sm:flex items-center gap-6">
          <p className="text-6xl font-bold font-mono text-[var(--color-error-500)] sm:text-7xl">
            404
          </p>
          <div>
            <div className="sm:border-l sm:border-[var(--color-border-subtle)] sm:pl-6">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
                Page not found
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
                Sorry, we couldn't find the page you're looking for.
              </p>
            </div>
            <div className="mt-8 flex gap-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link
                to="/"
                className="inline-flex items-center rounded px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] transition-colors duration-200"
              >
                Go back home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}