import { useState, useEffect, useCallback } from 'react';
import type { SessionData } from '../types/trace';
import type { SessionSummary } from '../services/sessionManager';
import { sessionManagerService } from '../services/sessionManager';
import { useDirectory } from '../contexts/DirectoryContext';

export interface UseSessionDataReturn {
  // Session discovery
  sessions: SessionSummary[];
  isDiscoveringSessions: boolean;
  discoveryError: string | null;

  // Session loading
  loadedSession: SessionData | null;
  isLoadingSession: boolean;
  sessionLoadError: string | null;

  // Actions
  refreshSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<SessionData>;
  clearError: () => void;

  // Navigation
  getAdjacentSessions: (currentSessionId: string) => { prevSessionId: string | null; nextSessionId: string | null };
}

export function useSessionData(): UseSessionDataReturn {
  // Get directory state from context
  const { directoryHandle, isDirectorySelected } = useDirectory();

  // Session discovery state
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isDiscoveringSessions, setIsDiscoveringSessions] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  // Session loading state
  const [loadedSession, setLoadedSession] = useState<SessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  // Discover sessions when directory changes
  const discoverSessions = useCallback(async () => {
    if (!directoryHandle) {
      setSessions([]);
      return;
    }

    setIsDiscoveringSessions(true);
    setDiscoveryError(null);

    try {
      const discoveredSessions = await sessionManagerService.discoverSessions();
      setSessions(discoveredSessions);
    } catch (error) {
      setDiscoveryError((error as Error).message);
      setSessions([]);
    } finally {
      setIsDiscoveringSessions(false);
    }
  }, [directoryHandle]);

  // Discover sessions when directory is selected or changes
  useEffect(() => {
    if (isDirectorySelected) {
      discoverSessions();
    } else {
      setSessions([]);
    }
  }, [isDirectorySelected, discoverSessions]);

  // Refresh session list
  const refreshSessions = useCallback(async () => {
    await discoverSessions();
  }, [discoverSessions]);

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

  // Get adjacent sessions for navigation
  const getAdjacentSessions = useCallback((currentSessionId: string): { prevSessionId: string | null; nextSessionId: string | null } => {
    // Sort sessions chronologically by sessionId (format: log-YYYY-MM-DD-HH-mm-ss)
    const sortedSessions = [...sessions].sort((a, b) => a.sessionId.localeCompare(b.sessionId));

    // Find current session index
    const currentIndex = sortedSessions.findIndex(session => session.sessionId === currentSessionId);

    if (currentIndex === -1) {
      return { prevSessionId: null, nextSessionId: null };
    }

    return {
      prevSessionId: currentIndex > 0 ? sortedSessions[currentIndex - 1].sessionId : null,
      nextSessionId: currentIndex < sortedSessions.length - 1 ? sortedSessions[currentIndex + 1].sessionId : null
    };
  }, [sessions]);

  return {
    // Session discovery
    sessions,
    isDiscoveringSessions,
    discoveryError,

    // Session loading
    loadedSession,
    isLoadingSession,
    sessionLoadError,

    // Actions
    refreshSessions,
    loadSession,
    clearError,

    // Navigation
    getAdjacentSessions,
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