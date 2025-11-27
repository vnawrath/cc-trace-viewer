import { useState, useEffect, useMemo } from 'react';
import { sessionManagerService } from '../services/sessionManager';
import { requestAnalyzerService, type RequestMetrics, type RequestFilters, type SortField, type SortDirection } from '../services/requestAnalyzer';
import type { SessionData } from '../types/trace';
import { useDirectory } from '../contexts/DirectoryContext';

export interface UseRequestListReturn {
  // Data state
  sessionData: SessionData | null;
  requests: RequestMetrics[];
  filteredRequests: RequestMetrics[];
  loading: boolean;
  error: string | null;

  // Filter and sort state
  filters: Partial<RequestFilters>;
  sortField: SortField;
  sortDirection: SortDirection;

  // Available options for filters
  availableModels: string[];
  availableToolsAvailable: string[];
  availableToolsUsed: string[];

  // Aggregate metrics
  aggregateMetrics: {
    totalRequests: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    avgDuration: number;
    totalDuration: number;
    errorCount: number;
    errorRate: number;
    streamingCount: number;
    streamingRate: number;
  };

  // Actions
  setFilters: (filters: Partial<RequestFilters>) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  clearFilters: () => void;
  refreshData: () => Promise<void>;
}

export function useRequestList(sessionId: string): UseRequestListReturn {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Directory context for restoration state
  const { restorationAttempted, isDirectorySelected } = useDirectory();

  // Filter and sort state (default: timestamp ascending for oldest-first)
  const [filters, setFilters] = useState<Partial<RequestFilters>>({});
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Analyze requests when session data loads
  const requests = useMemo(() => {
    if (!sessionData) return [];
    return requestAnalyzerService.analyzeRequests(sessionData.requests);
  }, [sessionData]);

  // Apply filters and sorting
  const filteredRequests = useMemo(() => {
    let result = requestAnalyzerService.filterRequests(requests, filters);
    result = requestAnalyzerService.sortRequests(result, sortField, sortDirection);
    return result;
  }, [requests, filters, sortField, sortDirection]);

  // Calculate available filter options
  const availableModels = useMemo(() => {
    return requestAnalyzerService.getUniqueModels(requests);
  }, [requests]);

  const availableToolsAvailable = useMemo(() => {
    return requestAnalyzerService.getUniqueToolsAvailable(requests);
  }, [requests]);

  const availableToolsUsed = useMemo(() => {
    return requestAnalyzerService.getUniqueToolsUsed(requests);
  }, [requests]);

  // Calculate aggregate metrics for filtered requests
  const aggregateMetrics = useMemo(() => {
    return requestAnalyzerService.calculateAggregateMetrics(filteredRequests);
  }, [filteredRequests]);

  // Load session data
  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await sessionManagerService.getSessionData(sessionId);
      setSessionData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session data';
      setError(errorMessage);
      console.error('Error loading session data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load - wait for directory restoration before loading data
  useEffect(() => {
    if (restorationAttempted && isDirectorySelected) {
      loadSessionData();
    }
  }, [sessionId, restorationAttempted, isDirectorySelected]);

  const setSort = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const refreshData = async () => {
    // Clear cached data and reload
    sessionManagerService.clearCache();
    await loadSessionData();
  };

  return {
    sessionData,
    requests,
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
    clearFilters,
    refreshData
  };
}