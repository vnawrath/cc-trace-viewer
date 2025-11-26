import { Link } from 'react-router';
import { DocumentHead } from '../components/DocumentHead';
import { useFileSystem } from '../hooks/useFileSystem';
import { traceParserService } from '../services/traceParser';

export function HomePage() {
  const {
    directoryHandle,
    directoryInfo,
    sessions,
    isLoading,
    error,
    browserSupport,
    selectDirectory,
    clearDirectory
  } = useFileSystem();

  const handleSelectDirectory = async () => {
    try {
      await selectDirectory();
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  if (!browserSupport.supported) {
    return (
      <>
        <DocumentHead title="Home" />
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Browser Not Supported
            </h1>
            <p className="text-xl text-red-600 mb-4 max-w-2xl mx-auto">
              {browserSupport.reason}
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              CC Trace Viewer requires the File System Access API to read .claude-trace directories.
              Please use Chrome, Edge, or another Chromium-based browser.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DocumentHead title="Home" />
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CC Trace Viewer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Analyze Claude API trace logs from your .claude-trace directory
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {!directoryHandle ? (
          <div className="text-center">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-gray-600 mb-6">
                Select your .claude-trace directory to begin analyzing your API traces
              </p>
            </div>
            <button
              onClick={handleSelectDirectory}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Select .claude-trace Directory
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-lg font-semibold text-gray-900">
                  {directoryInfo?.name}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({directoryInfo?.jsonlFileCount} JSONL files)
                </span>
              </div>
              <button
                onClick={clearDirectory}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Change Directory
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No valid trace sessions found in the selected directory.</p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Sessions ({sessions.length})
                </h2>
                <div className="grid gap-4">
                  {sessions.map((session) => (
                    <div key={session.sessionId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              Session {session.sessionId.slice(0, 8)}...
                            </h3>
                            {session.metadata.hasErrors && (
                              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                Has Errors
                              </span>
                            )}
                          </div>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <div className="font-medium">Requests</div>
                                <div>{session.metadata.requestCount}</div>
                              </div>
                              <div>
                                <div className="font-medium">Total Tokens</div>
                                <div className="font-semibold text-blue-600">
                                  {traceParserService.formatTokenCount(session.metadata.totalTokens)}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">Duration</div>
                                <div>{traceParserService.formatDuration(session.metadata.duration)}</div>
                              </div>
                              <div>
                                <div className="font-medium">Models</div>
                                <div>{Array.from(session.metadata.modelsUsed).join(', ')}</div>
                              </div>
                            </div>

                            {/* Token Breakdown */}
                            <div className="border-t border-gray-100 pt-3">
                              <div className="text-xs text-gray-500 mb-2">Token Breakdown</div>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                                <div>
                                  <div className="text-gray-500">Input</div>
                                  <div className="font-medium">
                                    {traceParserService.formatTokenCount(session.metadata.totalInputTokens)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Output</div>
                                  <div className="font-medium">
                                    {traceParserService.formatTokenCount(session.metadata.totalOutputTokens)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Cache Create</div>
                                  <div className="font-medium text-orange-600">
                                    {traceParserService.formatTokenCount(session.metadata.totalCacheCreationTokens)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Cache Read</div>
                                  <div className="font-medium text-green-600">
                                    {traceParserService.formatTokenCount(session.metadata.totalCacheReadTokens)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Cache 5m</div>
                                  <div className="font-medium text-purple-600">
                                    {traceParserService.formatTokenCount(session.metadata.totalCacheCreation5mTokens)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Cache 1h</div>
                                  <div className="font-medium text-purple-600">
                                    {traceParserService.formatTokenCount(session.metadata.totalCacheCreation1hTokens)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link
                            to={`/sessions/${session.sessionId}/requests`}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            View
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm text-gray-600">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900 mb-2">1. Select Directory</div>
              Choose your .claude-trace directory containing JSONL trace files
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900 mb-2">2. Browse Sessions</div>
              View discovered sessions with token usage and performance metrics
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900 mb-2">3. Analyze Requests</div>
              Dive into individual requests to understand API interactions
            </div>
          </div>
        </div>
      </div>
    </>
  );
}