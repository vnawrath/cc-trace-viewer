import { useState, useEffect } from 'react';
import { DocumentHead } from '../components/DocumentHead';
import { DirectoryPicker, BrowserUnsupportedMessage } from '../components/DirectoryPicker';
import { SessionTable, SessionTableSkeleton } from '../components/SessionTable';
import { useSessionData } from '../hooks/useSessionData';
import { useDirectory } from '../contexts/DirectoryContext';
import { fileSystemService } from '../services/fileSystem';

export function HomePage() {
  const {
    sessions,
    isDiscoveringSessions,
    discoveryError,
    refreshSessions,
    clearError,
  } = useSessionData();

  const {
    directoryName,
    isDirectorySelected,
    isRestoring,
    selectDirectory: selectDir,
    clearDirectory,
    restoreSavedDirectory,
    error: directoryError
  } = useDirectory();

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
    // Combine errors from both discovery and directory
    setError(discoveryError || directoryError);
  }, [discoveryError, directoryError]);

  const handleDirectorySelected = async (handle: FileSystemDirectoryHandle) => {
    try {
      await selectDir(handle);
      clearError();
      setError(null);
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClearDirectory = async () => {
    setError(null);
    clearError();
    await clearDirectory();
  };

  if (!browserSupport.supported) {
    return (
      <>
        <DocumentHead title="Home" />
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
          <BrowserUnsupportedMessage reason={browserSupport.reason} />
        </div>
      </>
    );
  }

  return (
    <>
      <DocumentHead title="Home" />
      <div className="bg-base-900 rounded-lg border border-base-800 p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4 tracking-tight">
            CC Trace Viewer
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Analyze Claude API trace logs from your .claude-trace directory
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-900/20 border border-error-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-error-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-error-300">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-error-400 hover:text-error-300 ml-4 transition-colors"
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
            selectedDirectory={directoryName}
            isRestoring={isRestoring}
            onRestoreDirectory={restoreSavedDirectory}
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-success-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-lg font-semibold text-text-primary">
                  {directoryName}
                </span>
                <span className="ml-2 text-sm text-text-muted font-mono">
                  ({sessions.length} sessions)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshSessions}
                  disabled={isDiscoveringSessions}
                  className="text-text-secondary hover:text-data-400 text-sm disabled:opacity-50 transition-colors font-medium"
                >
                  {isDiscoveringSessions ? 'Refreshing...' : 'Refresh'}
                </button>
                <span className="text-border-default">|</span>
                <button
                  onClick={handleClearDirectory}
                  className="text-text-secondary hover:text-data-400 text-sm transition-colors font-medium"
                >
                  Change Directory
                </button>
              </div>
            </div>

            {isDiscoveringSessions ? (
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  Discovering Sessions...
                </h2>
                <SessionTableSkeleton count={10} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 border border-base-800 rounded-lg bg-base-950">
                <div className="text-text-muted mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-text-secondary">No valid trace sessions found in the selected directory.</p>
                <p className="text-sm text-text-tertiary mt-2">
                  Make sure the directory contains .jsonl files with Claude API traces.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  Sessions ({sessions.length})
                </h2>
                <SessionTable sessions={sessions} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}