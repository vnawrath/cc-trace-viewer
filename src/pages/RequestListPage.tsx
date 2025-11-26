import { useState } from 'react';
import { useParams } from 'react-router';
import { DocumentHead } from '../components/DocumentHead';
import { SessionSummary } from '../components/SessionSummary';
import { RequestFilters } from '../components/RequestFilters';
import { RequestCard } from '../components/RequestCard';
import { useRequestList } from '../hooks/useRequestList';

export function RequestListPage() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const {
    sessionData,
    filteredRequests,
    loading,
    error,
    filters,
    sortField,
    sortDirection,
    availableModels,
    availableToolsAvailable,
    availableToolsUsed,
    aggregateMetrics,
    setFilters,
    setSort,
    clearFilters
  } = useRequestList(sessionId);

  if (loading) {
    return (
      <>
        <DocumentHead title={`Session ${sessionId} - Requests`} description={`View all requests for session ${sessionId}`} />
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-6"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-md"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DocumentHead title={`Session ${sessionId} - Requests`} description={`View all requests for session ${sessionId}`} />
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Session</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!sessionData) {
    return (
      <>
        <DocumentHead title={`Session ${sessionId} - Requests`} description={`View all requests for session ${sessionId}`} />
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
              <p className="text-gray-600">The requested session could not be found.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DocumentHead title={`Session ${sessionId} - Requests`} description={`View all requests for session ${sessionId}`} />
      <div className="space-y-6">
        {/* Session Summary */}
        <SessionSummary
          sessionId={sessionId}
          metadata={sessionData}
          aggregateMetrics={aggregateMetrics}
        />

        {/* Filters */}
        <RequestFilters
          availableModels={availableModels}
          availableToolsAvailable={availableToolsAvailable}
          availableToolsUsed={availableToolsUsed}
          filters={filters}
          sortField={sortField}
          sortDirection={sortDirection}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          onClearFilters={clearFilters}
          totalCount={sessionData.requests.length}
          filteredCount={filteredRequests.length}
        />

        {/* View Mode Toggle & Request List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Requests</h2>
              <p className="text-gray-600 text-sm mt-1">
                Showing {filteredRequests.length} of {sessionData.requests.length} requests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Card View
              </button>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests match your filters</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters to see more results.</p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-900 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="p-6 space-y-4">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  sessionId={sessionId}
                  showDetailedView={true}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tools
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      sessionId={sessionId}
                      showDetailedView={false}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}