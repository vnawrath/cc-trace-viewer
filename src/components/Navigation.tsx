import { Link, useLocation } from 'react-router';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClass = (path: string) =>
    `px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-[var(--color-accent-600)] text-[var(--color-text-primary)] shadow-[var(--shadow-glow-accent)]'
        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-medium)]'
    }`;

  return (
    <nav className="flex gap-2">
      <Link to="/" className={linkClass('/')}>
        Home
      </Link>
    </nav>
  );
}