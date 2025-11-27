import { Link, useLocation, useParams } from 'react-router';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    if (path.startsWith('/sessions/')) {
      const sessionId = params.sessionId || 'unknown';
      breadcrumbs.push({
        label: `Session: ${sessionId}`,
        href: `/sessions/${sessionId}/requests`
      });

      if (path.includes('/requests')) {
        if (params.requestId) {
          breadcrumbs.push({
            label: 'Requests',
            href: `/sessions/${sessionId}/requests`
          });
          breadcrumbs.push({
            label: `Request: ${params.requestId}`
          });
        } else {
          breadcrumbs.push({
            label: 'Requests'
          });
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex mb-3" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-1">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-2.5 h-2.5 text-[var(--color-text-muted)] mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
            )}
            {breadcrumb.href ? (
              <Link
                to={breadcrumb.href}
                className="inline-flex items-center text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-data-400)] transition-colors duration-200"
              >
                {index === 0 && (
                  <svg
                    className="w-2.5 h-2.5 mr-1.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                  </svg>
                )}
                {breadcrumb.label}
              </Link>
            ) : (
              <span className="text-xs font-medium text-[var(--color-text-secondary)] font-mono">
                {breadcrumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}