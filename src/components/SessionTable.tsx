import { useNavigate } from "react-router";
import { useState } from "react";
import type { SessionSummary } from "../services/sessionManager";
import { traceParserService } from "../services/traceParser";
import { TokenBreakdownDisplay } from "./TokenBreakdownDisplay";
import { formatCost } from "../services/costCalculator";

interface SessionTableProps {
  sessions: SessionSummary[];
}

type SortColumn = "sessionId" | "totalTokens" | "duration" | "cost";
type SortDirection = "asc" | "desc";

interface SortIconProps {
  column: SortColumn;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

// Sort icon component - defined outside to avoid recreating on render
const SortIcon = ({ column, sortColumn, sortDirection }: SortIconProps) => {
  if (sortColumn !== column) {
    return (
      <svg
        className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }

  return sortDirection === "asc" ? (
    <svg
      className="w-3 h-3 text-data-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    </svg>
  ) : (
    <svg
      className="w-3 h-3 text-data-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
};

export function SessionTable({ sessions }: SessionTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("sessionId");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    let comparison = 0;

    switch (sortColumn) {
      case "sessionId":
        comparison = a.sessionId.localeCompare(b.sessionId);
        break;
      case "totalTokens":
        comparison = a.metadata.totalTokens - b.metadata.totalTokens;
        break;
      case "duration":
        comparison = a.metadata.duration - b.metadata.duration;
        break;
      case "cost":
        // Handle null costs: put nulls at the end
        if (a.metadata.totalCost === null && b.metadata.totalCost === null) {
          comparison = 0;
        } else if (a.metadata.totalCost === null) {
          comparison = 1;
        } else if (b.metadata.totalCost === null) {
          comparison = -1;
        } else {
          comparison = a.metadata.totalCost - b.metadata.totalCost;
        }
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="border border-base-800 rounded-lg shadow-md">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-base-900 border-b border-base-800 z-10">
          <tr>
            <th className="w-8 px-2 py-2"></th>
            <th
              className="text-left px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group"
              onClick={() => handleSort("sessionId")}
            >
              <div className="flex items-center gap-1.5">
                <span>Session ID</span>
                <SortIcon column="sessionId" sortColumn={sortColumn} sortDirection={sortDirection} />
              </div>
            </th>
            <th
              className="text-right px-2 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group w-48"
              onClick={() => handleSort("totalTokens")}
            >
              <div className="flex items-center justify-start gap-1.5">
                <span>Tokens</span>
                <SortIcon column="totalTokens" sortColumn={sortColumn} sortDirection={sortDirection} />
              </div>
            </th>
            <th
              className="text-right px-2 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group w-20"
              onClick={() => handleSort("duration")}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Duration</span>
                <SortIcon column="duration" sortColumn={sortColumn} sortDirection={sortDirection} />
              </div>
            </th>
            <th
              className="text-right px-2 py-2 font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors group w-24 hidden md:table-cell"
              onClick={() => handleSort("cost")}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Cost</span>
                <SortIcon column="cost" sortColumn={sortColumn} sortDirection={sortDirection} />
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
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/sessions/${sessionId}/requests`);
  };

  return (
    <tr
      onClick={handleClick}
      className="group hover:bg-base-900/50 transition-colors cursor-pointer relative"
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

      {/* Session ID with conversation preview */}
      <td className="px-3 py-2 max-w-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="font-mono text-xs text-text-secondary group-hover:text-data-400 transition-colors truncate">
            {sessionId}
          </div>
          {metadata.conversationPreview && (
            <div
              className="text-xs text-text-muted italic whitespace-pre-wrap"
              title={metadata.conversationPreview}
            >
              {metadata.conversationPreview}
            </div>
          )}
        </div>
      </td>

      {/* Total Tokens with breakdown */}
      <td className="px-2 py-2 text-right w-48">
        <div className="font-mono text-xs text-left tabular-nums">
          <TokenBreakdownDisplay
            cacheRead={metadata.totalCacheReadTokens}
            cacheWrite={metadata.totalCacheCreationTokens}
            input={metadata.totalInputTokens}
            output={metadata.totalOutputTokens}
          />
        </div>
      </td>

      {/* Duration */}
      <td className="px-2 py-2 font-mono text-xs text-right text-warning-400 tabular-nums w-20">
        {formatDuration(metadata.duration)}
      </td>

      {/* Cost */}
      <td className="px-2 py-2 font-mono text-xs text-right text-success-400 tabular-nums w-24 hidden md:table-cell">
        {metadata.totalCost !== null ? (
          metadata.costIncomplete ? (
            <span title="Incomplete - some requests missing cost data">
              {formatCost(metadata.totalCost)}*
            </span>
          ) : (
            formatCost(metadata.totalCost)
          )
        ) : (
          <span className="text-text-muted" title="Unknown model pricing">
            —
          </span>
        )}
      </td>
    </tr>
  );
}

interface SessionTableSkeletonProps {
  count?: number;
}

export function SessionTableSkeleton({
  count = 10,
}: SessionTableSkeletonProps) {
  return (
    <div className="border border-base-800 rounded-lg">
      <table className="w-full text-xs">
        <thead className="bg-base-900 border-b border-base-800">
          <tr>
            <th className="w-8 px-2 py-2"></th>
            <th className="text-left px-3 py-2 font-medium text-text-tertiary uppercase tracking-wider">
              Session ID
            </th>
            <th className="text-right px-2 py-2 font-medium text-text-tertiary uppercase tracking-wider w-48">
              Tokens
            </th>
            <th className="text-right px-2 py-2 font-medium text-text-tertiary uppercase tracking-wider w-20">
              Duration
            </th>
            <th className="text-right px-2 py-2 font-medium text-text-tertiary uppercase tracking-wider w-24 hidden md:table-cell">
              Cost
            </th>
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
              <td className="px-2 py-2 w-48">
                <div className="h-3 bg-base-800 rounded w-32 ml-auto" />
              </td>
              <td className="px-2 py-2 w-20">
                <div className="h-3 bg-base-800 rounded w-12 ml-auto" />
              </td>
              <td className="px-2 py-2 w-24 hidden md:table-cell">
                <div className="h-3 bg-base-800 rounded w-16 ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
