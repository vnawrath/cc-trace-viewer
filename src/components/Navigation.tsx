import { Link, useLocation } from 'react-router';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <nav className="flex space-x-4">
      <Link to="/" className={linkClass('/')}>
        Home
      </Link>
      <Link
        to="/sessions/demo-session/requests"
        className={linkClass('/sessions/demo-session/requests')}
      >
        Demo Requests
      </Link>
      <Link
        to="/sessions/demo-session/requests/123"
        className={linkClass('/sessions/demo-session/requests/123')}
      >
        Demo Detail
      </Link>
    </nav>
  );
}