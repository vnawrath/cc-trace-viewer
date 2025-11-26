import { Link } from 'react-router';

export function HomePage() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to CC Trace Viewer
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A powerful tool for exploring and analyzing request traces. Navigate through sessions and examine detailed request information.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            View Sessions
          </h2>
          <p className="text-blue-700 mb-4">
            Browse through different session traces and their associated requests.
          </p>
          <Link
            to="/sessions/demo-session/requests"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Demo Session
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-xl font-semibold text-green-900 mb-3">
            Request Details
          </h2>
          <p className="text-green-700 mb-4">
            Examine individual requests with detailed trace information.
          </p>
          <Link
            to="/sessions/demo-session/requests/123"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            View Demo Request
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm text-gray-600">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-2">1. Select Session</div>
            Choose a session to explore its request traces
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-2">2. Browse Requests</div>
            View the list of requests within the session
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-2">3. Analyze Details</div>
            Dive deep into individual request information
          </div>
        </div>
      </div>
    </div>
  );
}