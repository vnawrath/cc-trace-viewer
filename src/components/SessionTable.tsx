import { Link } from 'react-router';
import { useState } from 'react';
import type { SessionSummary } from '../services/sessionManager';
import { traceParserService } from '../services/traceParser';

interface SessionTableProps {
  sessions: SessionSummary[];
}

type SortColumn = 'sessionId' | 'requestCount' | 'conversationCount' | 'totalTokens' | 'duration';
type SortDirection = 'asc' | 'desc';

export function SessionTable({ sessions }: SessionTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('sessionId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    let comparison = 0;

    switch (sortColumn) {
      case 'sessionId':
        comparison = a.sessionId.localeCompare(b.sessionId);
        break;
      case 'requestCount':
        comparison = a.metadata.requestCount - b.metadata.requestCount;
        break;
      case 'conversationCount':
        const aConvs = a.metadata.conversationCount ?? 0;
        const bConvs = b.metadata.conversationCount ?? 0;
        comparison = aConvs - bConvs;
        break;
      case 'totalTokens':
        comparison = a.metadata.totalTokens - b.metadata.totalTokens;
        break;
      case 'duration':
        comparison = a.metadata.duration - b.metadata.duration;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 text-data-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-data-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="overflow-x-auto border border-base-800 rounded-lg shadow-md">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-base-900 border-b border-base-800 z-10">
          <tr>
            <th className="w-8 px-2 py-2">
            </th>
            <th
              className="text-left px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group"
              onClick={() => handleSort('sessionId')}
            >
              <div className="flex items-center gap-1.5">
                <span>Session ID</span>
                <SortIcon column="sessionId" />
              </div>
            </th>
            <th
              className="text-right px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group"
              onClick={() => handleSort('requestCount')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Requests</span>
                <SortIcon column="requestCount" />
              </div>
            </th>
            <th
              className="text-right px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group"
              onClick={() => handleSort('conversationCount')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Convs</span>
                <SortIcon column="conversationCount" />
              </div>
            </th>
            <th
              className="text-right px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group"
              onClick={() => handleSort('totalTokens')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Total Tokens</span>
                <SortIcon column="totalTokens" />
              </div>
            </th>
            <th
              className="text-right px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group"
              onClick={() => handleSort('duration')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Duration</span>
                <SortIcon column="duration" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-base-950 divide-y divide-base-900">
          {sortedSessions.map((session) => (
            <SessionRow key={session.sessionId} session={session} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SessionRowProps {
  session: SessionSummary;
}

function SessionRow({ session }: SessionRowProps) {
  const { sessionId, metadata } = session;
  const formatDuration = traceParserService.formatDuration;
  const formatTokenCount = traceParserService.formatTokenCount;

  return (
    <Link
      to={`/sessions/${sessionId}/requests`}
      className="table-row group hover:bg-base-900/50 transition-colors relative"
    >
      {/* Status dot */}
      <td className="w-8 px-2 py-2">
        <div className="flex items-center">
          {metadata.hasErrors ? (
            <div
              className="w-2 h-2 rounded-full bg-error-500 ring-2 ring-error-500/20 shadow-glow-error"
              title="Contains errors"
            />
          ) : (
            <div
              className="w-2 h-2 rounded-full bg-success-500 ring-2 ring-success-500/20 shadow-glow-success"
              title="All requests successful"
            />
          )}
        </div>
      </td>

      {/* Session ID - full display */}
      <td className="px-3 py-2 font-mono text-xs text-text-secondary group-hover:text-data-400 transition-colors">
        {sessionId}
      </td>

      {/* Request Count */}
      <td className="px-3 py-2 font-mono text-sm text-right text-data-400 tabular-nums">
        {metadata.requestCount}
      </td>

      {/* Conversation Count */}
      <td className="px-3 py-2 font-mono text-sm text-right text-data-400 tabular-nums">
        {metadata.conversationCount ?? '—'}
      </td>

      {/* Total Tokens with input/output breakdown */}
      <td className="px-3 py-2 text-right">
        <div className="font-mono text-sm text-data-400 tabular-nums">
          {formatTokenCount(metadata.totalTokens)}
        </div>
        <div className="font-mono text-[10px] text-text-muted tabular-nums">
          {formatTokenCount(metadata.totalInputTokens)}↑ {formatTokenCount(metadata.totalOutputTokens)}↓
        </div>
      </td>

      {/* Duration */}
      <td className="px-3 py-2 font-mono text-sm text-right text-warning-400 tabular-nums">
        {formatDuration(metadata.duration)}
      </td>

      {/* Hover effect overlay */}
      <td className="absolute inset-0 pointer-events-none border-l-2 border-transparent group-hover:border-data-500/50 group-hover:shadow-[inset_0_1px_0_0_rgba(34,211,238,0.1),inset_0_-1px_0_0_rgba(34,211,238,0.1)] transition-all" />
    </Link>
  );
}

interface SessionTableSkeletonProps {
  count?: number;
}

export function SessionTableSkeleton({ count = 10 }: SessionTableSkeletonProps) {
  return (
    <div className="overflow-x-auto border border-base-800 rounded-lg">
      <table className="w-full text-xs">
        <thead className="bg-base-900 border-b border-base-800">
          <tr>
            <th className="w-8 px-2 py-2"></th>
            <th className="text-left px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider">Session ID</th>
            <th className="text-right px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider">Requests</th>
            <th className="text-right px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider">Convs</th>
            <th className="text-right px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider">Total Tokens</th>
            <th className="text-right px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider">Duration</th>
          </tr>
        </thead>
        <tbody className="bg-base-950 divide-y divide-base-900">
          {Array.from({ length: count }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              <td className="w-8 px-2 py-2">
                <div className="w-2 h-2 bg-base-800 rounded-full" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 bg-base-800 rounded w-64" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 bg-base-800 rounded w-8 ml-auto" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 bg-base-800 rounded w-8 ml-auto" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 bg-base-800 rounded w-16 ml-auto mb-1" />
                <div className="h-3 bg-base-800 rounded w-20 ml-auto" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 bg-base-800 rounded w-12 ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
