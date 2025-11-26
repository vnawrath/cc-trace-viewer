import { Link, useParams } from 'react-router';
import { DocumentHead } from '../components/DocumentHead';

interface MockRequestDetail {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  traceSpans: {
    name: string;
    duration: number;
    startTime: number;
    level: number;
  }[];
}

const mockRequestDetail: MockRequestDetail = {
  id: '123',
  method: 'GET',
  url: '/api/users',
  status: 200,
  duration: 145,
  timestamp: '2024-01-15T10:30:00Z',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJI...',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json, text/plain, */*',
  },
  queryParams: {
    'page': '1',
    'limit': '20',
    'sort': 'created_at',
  },
  responseBody: JSON.stringify({
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ],
    pagination: { page: 1, limit: 20, total: 2 },
  }, null, 2),
  traceSpans: [
    { name: 'HTTP Request', duration: 145, startTime: 0, level: 0 },
    { name: 'Auth Middleware', duration: 12, startTime: 2, level: 1 },
    { name: 'Database Query', duration: 89, startTime: 15, level: 1 },
    { name: 'User.findMany()', duration: 78, startTime: 18, level: 2 },
    { name: 'Response Serialization', duration: 23, startTime: 105, level: 1 },
  ],
};

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

export function RequestDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const requestId = params.requestId!;
  const request = mockRequestDetail;

  return (
    <>
      <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Session: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</span></span>
              <span>Request: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{requestId}</span></span>
            </div>
          </div>
          <Link
            to={`/sessions/${sessionId}/requests`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Requests
          </Link>
        </div>

        {/* Request Overview */}
        <div className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getMethodColor(request.method)}`}>
              {request.method}
            </span>
          </div>
          <div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Duration: <span className="font-semibold">{request.duration}ms</span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-mono">{new Date(request.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-1">URL</div>
          <div className="font-mono text-lg bg-gray-100 px-3 py-2 rounded">{request.url}</div>
        </div>
      </div>

      {/* Request Details Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Headers */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Headers</h3>
            <div className="space-y-2">
              {Object.entries(request.headers).map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded">
                  <span className="font-semibold text-gray-700 min-w-32">{key}:</span>
                  <span className="font-mono text-sm text-gray-600 break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Query Parameters */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Query Parameters</h3>
            <div className="space-y-2">
              {Object.entries(request.queryParams).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="font-semibold text-gray-700 min-w-16">{key}:</span>
                  <span className="font-mono text-sm text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Response Body */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Body</h3>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
          {request.responseBody}
        </pre>
      </div>

      {/* Trace Spans */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Execution Trace</h3>
        <div className="space-y-2">
          {request.traceSpans.map((span, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded"
              style={{ marginLeft: `${span.level * 20}px` }}
            >
              <div className="flex-1">
                <span className="font-medium text-gray-900">{span.name}</span>
              </div>
              <div className="text-sm text-gray-600">
                {span.duration}ms
              </div>
              <div className="text-xs text-gray-500">
                +{span.startTime}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}