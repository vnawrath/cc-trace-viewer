import { useState, useEffect } from 'react';
import { sessionManagerService } from '../services/sessionManager';
import type { ClaudeTraceEntry } from '../types/trace';

export interface UseRequestDetailReturn {
  request: ClaudeTraceEntry | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useRequestDetail(sessionId: string, requestId: string): UseRequestDetailReturn {
  const [request, setRequest] = useState<ClaudeTraceEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequestData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session data to find the specific request
      const sessionData = await sessionManagerService.getSessionData(sessionId);

      // Find request by ID (generated as timestamp-index in requestAnalyzer)
      const requestEntry = sessionData.requests.find((request, index) => {
        const generatedId = `${request.request.timestamp}-${index}`;
        return generatedId === requestId;
      });

      if (!requestEntry) {
        throw new Error(`Request ${requestId} not found in session ${sessionId}`);
      }

      setRequest(requestEntry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load request data';
      setError(errorMessage);
      console.error('Error loading request data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequestData();
  }, [sessionId, requestId]);

  const refreshData = async () => {
    sessionManagerService.clearCache();
    await loadRequestData();
  };

  return {
    request,
    loading,
    error,
    refreshData
  };
}