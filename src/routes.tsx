import { createBrowserRouter } from 'react-router';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { RequestListPage } from './pages/RequestListPage';
import { RequestDetailPage } from './pages/RequestDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppLayout>
        <HomePage />
      </AppLayout>
    ),
  },
  {
    path: '/sessions/:sessionId/requests',
    element: (
      <AppLayout>
        <RequestListPage />
      </AppLayout>
    ),
  },
  {
    path: '/sessions/:sessionId/requests/:requestId',
    element: (
      <AppLayout>
        <RequestDetailPage />
      </AppLayout>
    ),
  },
]);