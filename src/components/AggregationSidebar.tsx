import { useMemo } from 'react';
import type { SessionSummary } from '../services/sessionManager';
import { formatCost } from '../services/costCalculator';
import { traceParserService } from '../services/traceParser';

interface AggregationSidebarProps {
  sessions: SessionSummary[];
}

export function AggregationSidebar({ sessions }: AggregationSidebarProps) {
  const aggregates = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalCost: null,
        sessionsWithCost: 0,
        totalDuration: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
      };
    }

    let totalCost: number | null = 0;
    let sessionsWithCost = 0;
    let totalDuration = 0;
    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheCreationTokens = 0;
    let totalCacheReadTokens = 0;

    for (const session of sessions) {
      // Cost aggregation
      if (session.metadata.totalCost !== null) {
        if (totalCost !== null) {
          totalCost += session.metadata.totalCost;
        }
        sessionsWithCost++;
      } else {
        // If any session has null cost, set total to null
        totalCost = null;
      }

      // Duration aggregation (already in milliseconds)
      totalDuration += session.metadata.duration;

      // Token aggregation
      totalTokens += session.metadata.totalTokens;
      totalInputTokens += session.metadata.totalInputTokens;
      totalOutputTokens += session.metadata.totalOutputTokens;
      totalCacheCreationTokens += session.metadata.totalCacheCreationTokens;
      totalCacheReadTokens += session.metadata.totalCacheReadTokens;
    }

    return {
      totalSessions: sessions.length,
      totalCost,
      sessionsWithCost,
      totalDuration,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalCacheCreationTokens,
      totalCacheReadTokens,
    };
  }, [sessions]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const formatTokens = traceParserService.formatTokenCount;

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Empty state
  if (aggregates.totalSessions === 0) {
    return (
      <div className="w-[300px] flex-shrink-0">
        <div className="sticky top-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              All Sessions Aggregate
            </h3>
            <div className="text-sm text-gray-500">No sessions found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] flex-shrink-0">
      <div className="sticky top-4 space-y-4">
        {/* Overview Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            All Sessions Aggregate
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Total Sessions</span>
            <span className="font-mono text-2xl font-semibold text-cyan-400">
              {formatNumber(aggregates.totalSessions)}
            </span>
          </div>
        </div>

        {/* Cost Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Total Cost
          </h3>
          {aggregates.totalCost !== null ? (
            <>
              <div className="font-mono text-2xl font-semibold text-green-400 mb-1">
                {formatCost(aggregates.totalCost)}
              </div>
              {aggregates.sessionsWithCost < aggregates.totalSessions && (
                <div className="text-xs text-gray-500">
                  Across {aggregates.sessionsWithCost} of {aggregates.totalSessions} sessions
                </div>
              )}
            </>
          ) : (
            <>
              <div className="font-mono text-xl text-gray-500 mb-1">N/A</div>
              <div className="text-xs text-gray-500">
                {aggregates.sessionsWithCost === 0
                  ? 'No cost data available'
                  : 'Some sessions missing cost data'}
              </div>
            </>
          )}
        </div>

        {/* Duration Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Total API Duration
          </h3>
          <div className="font-mono text-2xl font-semibold text-cyan-400 mb-1">
            {formatDuration(aggregates.totalDuration)}
          </div>
          <div className="text-xs text-gray-500">Sum of all API call durations</div>
        </div>

        {/* Tokens Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Total Tokens
          </h3>
          <div className="font-mono text-2xl font-semibold text-cyan-400 mb-3">
            {formatTokens(aggregates.totalTokens)}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Input</span>
              <span className="font-mono text-sm text-cyan-400">
                {formatTokens(
                  aggregates.totalInputTokens +
                    aggregates.totalCacheCreationTokens +
                    aggregates.totalCacheReadTokens
                )}
              </span>
            </div>
            <div className="pl-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">Base</span>
                <span className="font-mono text-xs text-gray-400">
                  {formatTokens(aggregates.totalInputTokens)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">Cache Write</span>
                <span className="font-mono text-xs text-gray-400">
                  {formatTokens(aggregates.totalCacheCreationTokens)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">Cache Read</span>
                <span className="font-mono text-xs text-gray-400">
                  {formatTokens(aggregates.totalCacheReadTokens)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500">Output</span>
              <span className="font-mono text-sm text-cyan-400">
                {formatTokens(aggregates.totalOutputTokens)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
