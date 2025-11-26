import { Link, useParams } from 'react-router';
import { DocumentHead } from '../components/DocumentHead';

interface MockRequest {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: string;
}

const mockRequests: MockRequest[] = [
  {
    id: '123',
    method: 'GET',
    url: '/api/users',
    status: 200,
    duration: 145,
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    id: '124',
    method: 'POST',
    url: '/api/users/create',
    status: 201,
    duration: 289,
    timestamp: '2024-01-15T10:31:15Z',
  },
  {
    id: '125',
    method: 'PUT',
    url: '/api/users/456',
    status: 200,
    duration: 198,
    timestamp: '2024-01-15T10:32:30Z',
  },
  {
    id: '126',
    method: 'DELETE',
    url: '/api/users/789',
    status: 404,
    duration: 67,
    timestamp: '2024-01-15T10:33:45Z',
  },
  {
    id: '127',
    method: 'GET',
    url: '/api/orders',
    status: 500,
    duration: 1250,
    timestamp: '2024-01-15T10:35:00Z',
  },
];

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'text-green-600 bg-green-100';
  if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-100';
  if (status >= 400 && status < 500) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

function getMethodColor(method: string) {
  switch (method) {
    case 'GET': return 'text-blue-600 bg-blue-100';
    case 'POST': return 'text-green-600 bg-green-100';
    case 'PUT': return 'text-orange-600 bg-orange-100';
    case 'DELETE': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function RequestListPage() {
  const params = useParams();
  const sessionId = params.sessionId!;

  return (
    <>
      <DocumentHead title={`Session ${sessionId} - Requests`} description={`View all requests for session ${sessionId}`} />
      <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session Requests</h1>
            <p className="text-gray-600 mt-2">
              Session ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</span>
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {mockRequests.length} requests found
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(request.method)}`}>
                      {request.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {request.url}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.duration}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {new Date(request.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/sessions/${sessionId}/requests/${request.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}