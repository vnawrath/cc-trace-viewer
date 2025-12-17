import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { DocumentHead } from '../components/DocumentHead';
import { SessionSummary } from '../components/SessionSummary';
import { RequestFilters } from '../components/RequestFilters';
import { RequestCard } from '../components/RequestCard';
import { useRequestList } from '../hooks/useRequestList';
import { useDirectory } from '../contexts/DirectoryContext';
import { useSessionData } from '../hooks/useSessionData';

export function RequestListPage() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const navigate = useNavigate();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const { isDirectorySelected, isRestoring } = useDirectory();
  const { getAdjacentSessions } = useSessionData();

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

  // Get adjacent sessions for navigation
  const { prevSessionId, nextSessionId } = getAdjacentSessions(sessionId);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Filter toggle (Ctrl/Cmd+F)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFiltersVisible(prev => !prev);
        return;
      }

      // Session navigation (Alt+Left/Right)
      if (e.altKey && e.key === 'ArrowLeft' && prevSessionId) {
        e.preventDefault();
        navigate(`/sessions/${prevSessionId}/requests`);
        return;
      }
      if (e.altKey && e.key === 'ArrowRight' && nextSessionId) {
        e.preventDefault();
        navigate(`/sessions/${nextSessionId}/requests`);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSessionId, nextSessionId, navigate]);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    if (typeof value === 'object' && 'start' in value) {
      return value.start !== null || value.end !== null;
    }
    return true;
  }).length;

  // Show restoration or no directory message
  if (isRestoring) {
    return (
      <>
        <DocumentHead title={`Session ${sessionId} - Requests`} description={`View all requests for session ${sessionId}`} />
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Restoring Directory</h2>
              <p className="text-gray-600">Loading your saved .claude-trace directory...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!isDirectorySelected) {
    return (
      <>
        <DocumentHead title={`Session ${sessionId} - Requests`} description={`View all requests for session ${sessionId}`} />
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <div className="text-orange-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Directory Selected</h2>
              <p className="text-gray-600 mb-6">Please select a .claude-trace directory to view session data.</p>
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Home Page
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

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

      {/* Flexbox layout: main content + right sidebar */}
      <div className="flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Session Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => prevSessionId && navigate(`/sessions/${prevSessionId}/requests`)}
              disabled={!prevSessionId}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
              title="Previous session (Alt+Left)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm text-gray-200">Previous Session</span>
            </button>
            <button
              onClick={() => nextSessionId && navigate(`/sessions/${nextSessionId}/requests`)}
              disabled={!nextSessionId}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
              title="Next session (Alt+Right)"
            >
              <span className="text-sm text-gray-200">Next Session</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Collapsible Filter Panel */}
          <div className="relative">
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium text-gray-200">
                  Filters {activeFilterCount > 0 && <span className="ml-2 px-2 py-0.5 bg-cyan-500 text-gray-950 rounded-full text-xs font-mono">{activeFilterCount}</span>}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+F
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${filtersVisible ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Slide-down filter panel */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                filtersVisible ? 'max-h-[800px] opacity-100 mt-2' : 'max-h-0 opacity-0'
              }`}
            >
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
            </div>
          </div>

          {/* Dense Request Table */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Request List</h2>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  {filteredRequests.length} / {sessionData.requests.length} requests
                </p>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-600 mb-4">
                  <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-gray-300 mb-2">No matching requests</h3>
                <p className="text-sm text-gray-500 mb-4">Adjust filters to see results</p>
                <button
                  onClick={clearFilters}
                  className="text-cyan-400 hover:text-cyan-300 font-medium text-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full table-fixed">
                  <thead className="bg-gray-950 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider w-16">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider w-24">
                        Timestamp
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider w-20">
                        Duration
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider w-24">
                        Tokens
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider w-24 hidden md:table-cell">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
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

        {/* Right Sidebar */}
        <div className="w-[300px] flex-shrink-0">
          <SessionSummary
            sessionId={sessionId}
            metadata={sessionData}
            aggregateMetrics={aggregateMetrics}
            variant="sidebar"
          />
        </div>
      </div>
    </>
  );
}