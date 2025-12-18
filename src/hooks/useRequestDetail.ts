import { useState, useEffect } from 'react';
import { sessionManagerService } from '../services/sessionManager';
import { requestAnalyzerService, type RequestMetrics } from '../services/requestAnalyzer';
import type { ClaudeTraceEntry } from '../types/trace';
import { useDirectory } from '../contexts/DirectoryContext';

export interface UseRequestDetailReturn {
  request: ClaudeTraceEntry | null;
  metrics: RequestMetrics | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useRequestDetail(sessionId: string, requestId: string): UseRequestDetailReturn {
  const [request, setRequest] = useState<ClaudeTraceEntry | null>(null);
  const [metrics, setMetrics] = useState<RequestMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Directory context for restoration state
  const { restorationAttempted, isDirectorySelected } = useDirectory();

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

      // Analyze all requests to get metrics with conversation groups
      const allMetrics = requestAnalyzerService.analyzeRequests(sessionData.requests);

      // Find the metrics for this specific request
      const requestMetrics = allMetrics.find(m => m.id === requestId);

      setMetrics(requestMetrics || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load request data';
      setError(errorMessage);
      console.error('Error loading request data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Wait for directory restoration before loading data
  useEffect(() => {
    if (restorationAttempted && isDirectorySelected) {
      loadRequestData();
    }
  }, [sessionId, requestId, restorationAttempted, isDirectorySelected]);

  const refreshData = async () => {
    sessionManagerService.clearCache();
    await loadRequestData();
  };

  return {
    request,
    metrics,
    loading,
    error,
    refreshData
  };
}