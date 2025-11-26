import { createBrowserRouter } from 'react-router';

// Placeholder components - will be created in Phase 4
const HomePage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">CC Trace Viewer</h1>
    <p className="text-gray-600">Welcome to the trace viewer application.</p>
  </div>
);

const RequestListPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Request List</h1>
    <p className="text-gray-600">Session requests will be displayed here.</p>
  </div>
);

const RequestDetailPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Detail</h1>
    <p className="text-gray-600">Request details will be displayed here.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/sessions/:sessionId/requests',
    element: <RequestListPage />,
  },
  {
    path: '/sessions/:sessionId/requests/:requestId',
    element: <RequestDetailPage />,
  },
]);