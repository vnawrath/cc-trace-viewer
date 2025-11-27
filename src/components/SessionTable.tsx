import { Link } from 'react-router';
import { useState } from 'react';
import type { SessionSummary } from '../services/sessionManager';
import { traceParserService } from '../services/traceParser';

interface SessionTableProps {
  sessions: SessionSummary[];
}

type SortColumn = 'startTime' | 'requestCount' | 'totalTokens' | 'duration' | 'errors';
type SortDirection = 'asc' | 'desc';

export function SessionTable({ sessions }: SessionTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('startTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

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
      case 'startTime':
        comparison = a.metadata.startTime - b.metadata.startTime;
        break;
      case 'requestCount':
        comparison = a.metadata.requestCount - b.metadata.requestCount;
        break;
      case 'totalTokens':
        comparison = a.metadata.totalTokens - b.metadata.totalTokens;
        break;
      case 'duration':
        comparison = a.metadata.duration - b.metadata.duration;
        break;
      case 'errors':
        const aErrors = a.metadata.hasErrors ? 1 : 0;
        const bErrors = b.metadata.hasErrors ? 1 : 0;
        comparison = aErrors - bErrors;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="overflow-x-auto border border-gray-800 rounded-lg">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">
              Session ID
            </th>
            <th
              className="text-left px-3 py-2 font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors group"
              onClick={() => handleSort('startTime')}
            >
              <div className="flex items-center gap-1.5">
                <span>Start Time</span>
                <SortIcon column="startTime" />
              </div>
            </th>
            <th
              className="text-right px-3 py-2 font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors group"
              onClick={() => handleSort('requestCount')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Requests</span>
                <SortIcon column="requestCount" />
              </div>
            </th>
            <th
              className="text-right px-3 py-2 font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors group"
              onClick={() => handleSort('totalTokens')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Total Tokens</span>
                <SortIcon column="totalTokens" />
              </div>
            </th>
            <th
              className="text-right px-3 py-2 font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors group"
              onClick={() => handleSort('duration')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Duration</span>
                <SortIcon column="duration" />
              </div>
            </th>
            <th className="text-left px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">
              Models
            </th>
            <th className="text-center px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">
              Tools
            </th>
            <th
              className="text-center px-3 py-2 font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors group"
              onClick={() => handleSort('errors')}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>Errors</span>
                <SortIcon column="errors" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-950 divide-y divide-gray-900">
          {sortedSessions.map((session) => (
            <SessionRow key={session.sessionId} session={session} formatDate={formatDate} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SessionRowProps {
  session: SessionSummary;
  formatDate: (timestamp: number) => string;
}

function SessionRow({ session, formatDate }: SessionRowProps) {
  const { sessionId, metadata } = session;
  const formatDuration = traceParserService.formatDuration;
  const formatTokenCount = traceParserService.formatTokenCount;

  const models = Array.from(metadata.modelsUsed);
  const tools = Array.from(metadata.toolsUsed);
  const errorCount = metadata.hasErrors ? 1 : 0;

  const modelsDisplay = models
    .map(m => m.replace('claude-3-', '').replace('claude-', ''))
    .join(', ');

  const toolsTitle = tools.length > 0 ? tools.join(', ') : 'No tools used';

  return (
    <Link
      to={`/sessions/${sessionId}/requests`}
      className="table-row group hover:bg-gray-900/50 transition-colors relative"
    >
      {/* Status dot */}
      <td className="px-3 py-2">
        <div className="flex items-center">
          {metadata.hasErrors ? (
            <div
              className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
              title="Contains errors"
            />
          ) : (
            <div
              className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              title="All requests successful"
            />
          )}
        </div>
      </td>

      {/* Session ID with tooltip */}
      <td className="px-3 py-2 font-mono text-sm text-gray-300 group-hover:text-cyan-400 transition-colors relative">
        <span className="inline-block" title={sessionId}>
          {sessionId.slice(0, 12)}...
        </span>
      </td>

      {/* Start Time */}
      <td className="px-3 py-2 font-mono text-xs text-gray-400 whitespace-nowrap">
        {formatDate(metadata.startTime)}
      </td>

      {/* Request Count */}
      <td className="px-3 py-2 font-mono text-sm text-right text-cyan-400 tabular-nums">
        {metadata.requestCount}
      </td>

      {/* Total Tokens with input/output breakdown */}
      <td className="px-3 py-2 text-right">
        <div className="font-mono text-sm text-cyan-400 tabular-nums">
          {formatTokenCount(metadata.totalTokens)}
        </div>
        <div className="font-mono text-[10px] text-gray-500 tabular-nums">
          {formatTokenCount(metadata.totalInputTokens)}↑ {formatTokenCount(metadata.totalOutputTokens)}↓
        </div>
      </td>

      {/* Duration */}
      <td className="px-3 py-2 font-mono text-sm text-right text-amber-400 tabular-nums">
        {formatDuration(metadata.duration)}
      </td>

      {/* Models */}
      <td className="px-3 py-2 text-xs text-gray-400 truncate max-w-[200px]" title={modelsDisplay}>
        {modelsDisplay || 'N/A'}
      </td>

      {/* Tools count */}
      <td className="px-3 py-2 text-center">
        {tools.length > 0 ? (
          <span
            className="inline-flex items-center justify-center font-mono text-xs text-purple-400 tabular-nums"
            title={toolsTitle}
          >
            {tools.length}
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </td>

      {/* Errors */}
      <td className="px-3 py-2 text-center">
        {errorCount > 0 ? (
          <span className="inline-flex items-center justify-center font-mono text-xs text-red-400 tabular-nums">
            {errorCount}
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </td>

      {/* Hover effect overlay */}
      <td className="absolute inset-0 pointer-events-none border-l-2 border-transparent group-hover:border-cyan-500/50 group-hover:shadow-[inset_0_1px_0_0_rgba(6,182,212,0.1),inset_0_-1px_0_0_rgba(6,182,212,0.1)] transition-all" />
    </Link>
  );
}

interface SessionTableSkeletonProps {
  count?: number;
}

export function SessionTableSkeleton({ count = 10 }: SessionTableSkeletonProps) {
  return (
    <div className="overflow-x-auto border border-gray-800 rounded-lg">
      <table className="w-full text-xs">
        <thead className="bg-gray-900 border-b border-gray-800">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Session ID</th>
            <th className="text-left px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Start Time</th>
            <th className="text-right px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Requests</th>
            <th className="text-right px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Total Tokens</th>
            <th className="text-right px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Duration</th>
            <th className="text-left px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Models</th>
            <th className="text-center px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Tools</th>
            <th className="text-center px-3 py-2 font-medium text-gray-400 uppercase tracking-wider">Errors</th>
          </tr>
        </thead>
        <tbody className="bg-gray-950 divide-y divide-gray-900">
          {Array.from({ length: count }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              <td className="px-3 py-2">
                <div className="w-2 h-2 bg-gray-800 rounded-full" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 bg-gray-800 rounded w-24" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 bg-gray-800 rounded w-32" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 bg-gray-800 rounded w-8 ml-auto" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 bg-gray-800 rounded w-16 ml-auto mb-1" />
                <div className="h-3 bg-gray-800 rounded w-20 ml-auto" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 bg-gray-800 rounded w-12 ml-auto" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 bg-gray-800 rounded w-24" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 bg-gray-800 rounded w-6 mx-auto" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 bg-gray-800 rounded w-6 mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
