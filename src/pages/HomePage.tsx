import { useState, useEffect } from 'react';
import { DocumentHead } from '../components/DocumentHead';
import { DirectoryPicker, BrowserUnsupportedMessage } from '../components/DirectoryPicker';
import { SessionCard, SessionCardSkeleton } from '../components/SessionCard';
import { useSessionData } from '../hooks/useSessionData';
import { fileSystemService } from '../services/fileSystem';

export function HomePage() {
  const {
    selectedDirectory,
    isDirectorySelected,
    sessions,
    isDiscoveringSessions,
    discoveryError,
    selectDirectory,
    refreshSessions,
    clearError
  } = useSessionData();

  const [browserSupport, setBrowserSupport] = useState<{
    supported: boolean;
    reason?: string;
  }>({ supported: true });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const support = await fileSystemService.checkBrowserSupport();
      setBrowserSupport(support);
    };
    checkSupport();
  }, []);

  useEffect(() => {
    setError(discoveryError);
  }, [discoveryError]);

  const handleDirectorySelected = async (handle: FileSystemDirectoryHandle) => {
    try {
      await selectDirectory(handle);
      clearError();
      setError(null);
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClearDirectory = () => {
    setError(null);
    clearError();
  };

  if (!browserSupport.supported) {
    return (
      <>
        <DocumentHead title="Home" />
        <div className="bg-white rounded-lg shadow-sm p-8">
          <BrowserUnsupportedMessage reason={browserSupport.reason} />
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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 ml-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {!isDirectorySelected ? (
          <DirectoryPicker
            onDirectorySelected={handleDirectorySelected}
            onError={handleError}
            isLoading={isDiscoveringSessions}
            selectedDirectory={selectedDirectory}
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-lg font-semibold text-gray-900">
                  {selectedDirectory}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({sessions.length} sessions found)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshSessions}
                  disabled={isDiscoveringSessions}
                  className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50"
                >
                  {isDiscoveringSessions ? 'Refreshing...' : 'Refresh'}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleClearDirectory}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Change Directory
                </button>
              </div>
            </div>

            {isDiscoveringSessions ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Discovering Sessions...
                </h2>
                <div className="grid gap-4">
                  <SessionCardSkeleton count={3} />
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">No valid trace sessions found in the selected directory.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Make sure the directory contains .jsonl files with Claude API traces.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Sessions ({sessions.length})
                </h2>
                <div className="grid gap-4">
                  {sessions.map((session) => (
                    <SessionCard key={session.sessionId} session={session} />
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