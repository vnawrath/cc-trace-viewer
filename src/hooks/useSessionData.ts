import { useState, useEffect, useCallback } from 'react';
import type { SessionData } from '../types/trace';
import type { SessionSummary } from '../services/sessionManager';
import { sessionManagerService } from '../services/sessionManager';
import { fileSystemService } from '../services/fileSystem';

export interface UseSessionDataReturn {
  // Directory state
  selectedDirectory: string | null;
  isDirectorySelected: boolean;

  // Session discovery
  sessions: SessionSummary[];
  isDiscoveringSessions: boolean;
  discoveryError: string | null;

  // Session loading
  loadedSession: SessionData | null;
  isLoadingSession: boolean;
  sessionLoadError: string | null;

  // Actions
  selectDirectory: (handle: FileSystemDirectoryHandle) => Promise<void>;
  refreshSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<SessionData>;
  clearError: () => void;
}

export function useSessionData(): UseSessionDataReturn {
  // Directory state
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);

  // Session discovery state
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isDiscoveringSessions, setIsDiscoveringSessions] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  // Session loading state
  const [loadedSession, setLoadedSession] = useState<SessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  // Select directory and discover sessions
  const selectDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
      // Update directory state
      setDirectoryHandle(handle);
      setSelectedDirectory(handle.name);

      // Clear previous state
      setSessions([]);
      setLoadedSession(null);
      setDiscoveryError(null);
      setSessionLoadError(null);

      // Update services
      fileSystemService.setCurrentDirectory(handle);
      sessionManagerService.setCurrentDirectory(handle);

      // Start discovering sessions
      setIsDiscoveringSessions(true);
      const discoveredSessions = await sessionManagerService.discoverSessions();
      setSessions(discoveredSessions);
    } catch (error) {
      setDiscoveryError((error as Error).message);
      setSessions([]);
    } finally {
      setIsDiscoveringSessions(false);
    }
  }, []);

  // Refresh session list
  const refreshSessions = useCallback(async () => {
    if (!directoryHandle) {
      setDiscoveryError('No directory selected');
      return;
    }

    setIsDiscoveringSessions(true);
    setDiscoveryError(null);

    try {
      const discoveredSessions = await sessionManagerService.discoverSessions();
      setSessions(discoveredSessions);
    } catch (error) {
      setDiscoveryError((error as Error).message);
    } finally {
      setIsDiscoveringSessions(false);
    }
  }, [directoryHandle]);

  // Load individual session data
  const loadSession = useCallback(async (sessionId: string): Promise<SessionData> => {
    setIsLoadingSession(true);
    setSessionLoadError(null);

    try {
      const sessionData = await sessionManagerService.getSessionData(sessionId);
      setLoadedSession(sessionData);
      return sessionData;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setSessionLoadError(errorMessage);
      throw error;
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // Clear errors
  const clearError = useCallback(() => {
    setDiscoveryError(null);
    setSessionLoadError(null);
  }, []);

  // Initialize from current directory if available
  useEffect(() => {
    const currentDirectory = sessionManagerService.getCurrentDirectory();
    if (currentDirectory) {
      setDirectoryHandle(currentDirectory);
      setSelectedDirectory(currentDirectory.name);

      // Auto-discover sessions if we have a directory
      refreshSessions();
    }
  }, [refreshSessions]);

  return {
    // Directory state
    selectedDirectory,
    isDirectorySelected: Boolean(directoryHandle),

    // Session discovery
    sessions,
    isDiscoveringSessions,
    discoveryError,

    // Session loading
    loadedSession,
    isLoadingSession,
    sessionLoadError,

    // Actions
    selectDirectory,
    refreshSessions,
    loadSession,
    clearError
  };
}

export interface UseSessionReturn {
  session: SessionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSession(sessionId: string | null): UseSessionReturn {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await sessionManagerService.getSessionData(sessionId);
      setSession(sessionData);
    } catch (err) {
      setError((err as Error).message);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    isLoading,
    error,
    refetch: fetchSession
  };
}