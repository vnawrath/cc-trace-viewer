import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fileSystemService } from '../services/fileSystem';
import { sessionManagerService } from '../services/sessionManager';
import { storageService } from '../services/storage';

export interface DirectoryContextValue {
  // Directory state
  directoryHandle: FileSystemDirectoryHandle | null;
  directoryName: string | null;
  isDirectorySelected: boolean;

  // Loading states
  isRestoring: boolean;
  restorationAttempted: boolean;

  // Error state
  error: string | null;

  // Actions
  selectDirectory: (handle: FileSystemDirectoryHandle) => Promise<void>;
  clearDirectory: () => Promise<void>;
  restoreSavedDirectory: () => Promise<boolean>;
  clearError: () => void;
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null);

export function useDirectory(): DirectoryContextValue {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
}

interface DirectoryProviderProps {
  children: ReactNode;
}

export function DirectoryProvider({ children }: DirectoryProviderProps) {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Select a new directory and sync with services
   */
  const selectDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
      setError(null);

      // Verify it's a valid Claude trace directory
      const info = await fileSystemService.getDirectoryInfo(handle);
      if (!info.isClaudeTraceDirectory) {
        setError('Selected directory does not appear to be a .claude-trace directory');
        return;
      }

      // Update state
      setDirectoryHandle(handle);
      setDirectoryName(handle.name);

      // Sync with services
      fileSystemService.setCurrentDirectory(handle);
      sessionManagerService.setCurrentDirectory(handle);

      // Save to IndexedDB for persistence
      await storageService.saveDirectoryHandle(handle);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select directory';
      setError(errorMessage);
      console.error('Error selecting directory:', err);
    }
  }, []);

  /**
   * Clear the current directory and sync with services
   */
  const clearDirectory = useCallback(async () => {
    try {
      // Clear from IndexedDB
      await storageService.clearDirectoryHandle();

      // Clear state
      setDirectoryHandle(null);
      setDirectoryName(null);
      setError(null);

      // Clear services (they'll set their directory to null internally via their cache clearing)
      sessionManagerService.clearCache();
      fileSystemService.setCurrentDirectory(null as any);
    } catch (err) {
      console.error('Error clearing directory:', err);
    }
  }, []);

  /**
   * Restore saved directory from IndexedDB
   */
  const restoreSavedDirectory = useCallback(async (): Promise<boolean> => {
    setIsRestoring(true);
    setError(null);

    try {
      // Try to load saved handle
      const savedHandle = await storageService.loadDirectoryHandle();

      if (!savedHandle) {
        setRestorationAttempted(true);
        setIsRestoring(false);
        return false;
      }

      // Verify the handle is still valid
      const isValid = await fileSystemService.verifyHandleValid(savedHandle);
      if (!isValid) {
        await storageService.clearDirectoryHandle();
        setError('Saved directory is no longer accessible');
        setRestorationAttempted(true);
        setIsRestoring(false);
        return false;
      }

      // Check permission status
      const permission = await fileSystemService.checkPermission(savedHandle);

      if (permission === 'denied') {
        await storageService.clearDirectoryHandle();
        setError('Permission to access the saved directory was denied');
        setRestorationAttempted(true);
        setIsRestoring(false);
        return false;
      }

      if (permission === 'prompt') {
        // Need user interaction to request permission
        setRestorationAttempted(true);
        setIsRestoring(false);
        return false;
      }

      // Permission is granted, restore the directory
      const info = await fileSystemService.getDirectoryInfo(savedHandle);
      if (!info.isClaudeTraceDirectory) {
        await storageService.clearDirectoryHandle();
        setError('Saved directory is no longer a valid .claude-trace directory');
        setRestorationAttempted(true);
        setIsRestoring(false);
        return false;
      }

      // Update state
      setDirectoryHandle(savedHandle);
      setDirectoryName(savedHandle.name);

      // Sync with services
      fileSystemService.setCurrentDirectory(savedHandle);
      sessionManagerService.setCurrentDirectory(savedHandle);

      setRestorationAttempted(true);
      setIsRestoring(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore directory';
      setError(`Failed to restore directory: ${errorMessage}`);
      setRestorationAttempted(true);
      setIsRestoring(false);
      return false;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Attempt to restore saved directory on mount
   */
  useEffect(() => {
    if (!restorationAttempted && !directoryHandle) {
      restoreSavedDirectory();
    }
  }, [restorationAttempted, directoryHandle, restoreSavedDirectory]);

  const value: DirectoryContextValue = {
    directoryHandle,
    directoryName,
    isDirectorySelected: directoryHandle !== null,
    isRestoring,
    restorationAttempted,
    error,
    selectDirectory,
    clearDirectory,
    restoreSavedDirectory,
    clearError,
  };

  return (
    <DirectoryContext.Provider value={value}>
      {children}
    </DirectoryContext.Provider>
  );
}

