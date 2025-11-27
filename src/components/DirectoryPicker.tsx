import { useState, useCallback } from 'react';
import { fileSystemService } from '../services/fileSystem';

interface DirectoryPickerProps {
  onDirectorySelected: (handle: FileSystemDirectoryHandle) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  selectedDirectory?: string | null;
  isRestoring?: boolean;
  onRestoreDirectory?: () => Promise<boolean>;
}

export function DirectoryPicker({
  onDirectorySelected,
  onError,
  isLoading = false,
  selectedDirectory,
  isRestoring = false,
  onRestoreDirectory
}: DirectoryPickerProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [hasSavedDirectory, setHasSavedDirectory] = useState(false);

  const handleSelectDirectory = useCallback(async () => {
    setIsSelecting(true);

    try {
      const handle = await fileSystemService.selectDirectory();

      // Verify it's a valid .claude-trace directory
      const isValid = await fileSystemService.verifyClaudeTraceDirectory(handle);

      if (!isValid) {
        onError('Selected directory does not appear to be a valid .claude-trace directory. Please select a directory containing .jsonl log files.');
        return;
      }

      onDirectorySelected(handle);
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setIsSelecting(false);
    }
  }, [onDirectorySelected, onError]);

  const handleRestoreDirectory = useCallback(async () => {
    if (!onRestoreDirectory) return;
    
    setIsSelecting(true);
    try {
      await onRestoreDirectory();
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setIsSelecting(false);
    }
  }, [onRestoreDirectory, onError]);

  const isDisabled = isLoading || isSelecting || isRestoring;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Claude Trace Directory
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Choose a .claude-trace directory containing your Claude API logs to analyze your usage patterns and request history.
        </p>
      </div>

      {isRestoring && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Restoring previous directory...
              </p>
              <p className="text-xs text-blue-700">
                Loading your saved .claude-trace directory
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        {selectedDirectory && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md w-full">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-blue-900 font-medium truncate">
                  {selectedDirectory}
                </p>
                <p className="text-xs text-blue-700">
                  Currently selected
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSelectDirectory}
          disabled={isDisabled}
          className={`
            inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }
            transition-all duration-200
          `}
        >
          {isRestoring ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Restoring...
            </>
          ) : isSelecting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Selecting Directory...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
              {selectedDirectory ? 'Change Directory' : 'Select Directory'}
            </>
          )}
        </button>

        <div className="text-sm text-gray-500 max-w-lg text-center">
          <p className="mb-2">
            <strong>Supported browsers:</strong> Chrome, Edge, or other Chromium-based browsers
          </p>
          <p>
            Your .claude-trace directory typically contains log files named like <code className="bg-gray-100 px-1 rounded">log-YYYY-MM-DD-HH-mm-ss.jsonl</code>
          </p>
        </div>
      </div>
    </div>
  );
}

interface BrowserUnsupportedProps {
  reason?: string;
}

export function BrowserUnsupportedMessage({ reason }: BrowserUnsupportedProps) {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Browser Not Supported
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          {reason || 'Your browser does not support the File System Access API required for this application.'}
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg mx-auto">
        <h3 className="font-semibold text-yellow-800 mb-2">Supported Browsers</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Google Chrome (version 86+)</li>
          <li>• Microsoft Edge (version 86+)</li>
          <li>• Other Chromium-based browsers</li>
        </ul>
      </div>

      <p className="text-sm text-gray-500">
        Please switch to a supported browser to use the CC Trace Viewer.
      </p>
    </div>
  );
}