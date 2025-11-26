import { createBrowserRouter } from 'react-router';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { RequestListPage } from './pages/RequestListPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorBoundary } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <AppLayout>
          <HomePage />
        </AppLayout>
      </ErrorBoundary>
    ),
  },
  {
    path: '/sessions/:sessionId/requests',
    element: (
      <ErrorBoundary>
        <AppLayout>
          <RequestListPage />
        </AppLayout>
      </ErrorBoundary>
    ),
  },
  {
    path: '/sessions/:sessionId/requests/:requestId',
    element: (
      <ErrorBoundary>
        <AppLayout>
          <RequestDetailPage />
        </AppLayout>
      </ErrorBoundary>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);