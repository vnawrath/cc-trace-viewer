import { Link } from 'react-router';
import type { SessionSummary } from '../services/sessionManager';
import { traceParserService } from '../services/traceParser';

interface SessionCardProps {
  session: SessionSummary;
}

export function SessionCard({ session }: SessionCardProps) {
  const { sessionId, metadata } = session;

  const formatDate = (timestamp: number): string => {
    // Convert from Unix epoch seconds to milliseconds
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDuration = traceParserService.formatDuration;
  const formatTokenCount = traceParserService.formatTokenCount;

  const getStatusIcon = () => {
    if (metadata.hasErrors) {
      return (
        <div className="w-3 h-3 bg-red-500 rounded-full" title="Contains errors" />
      );
    }
    return (
      <div className="w-3 h-3 bg-green-500 rounded-full" title="All requests successful" />
    );
  };

  const getModelBadges = () => {
    const models = Array.from(metadata.modelsUsed);
    if (models.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {models.slice(0, 3).map((model) => (
          <span
            key={model}
            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
          >
            {model.replace('claude-3-', '').replace('claude-', '')}
          </span>
        ))}
        {models.length > 3 && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            +{models.length - 3} more
          </span>
        )}
      </div>
    );
  };

  const getToolsBadges = () => {
    const tools = Array.from(metadata.toolsUsed);
    if (tools.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {tools.slice(0, 2).map((tool) => (
          <span
            key={tool}
            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"
          >
            {tool}
          </span>
        ))}
        {tools.length > 2 && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            +{tools.length - 2} more
          </span>
        )}
      </div>
    );
  };

  return (
    <Link
      to={`/sessions/${sessionId}/requests`}
      className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 hover:border-gray-300"
    >
      <div className="p-6">
        {/* Header with session ID and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                Session {sessionId.slice(0, 8)}...
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              {formatDate(metadata.startTime)}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Requests</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {metadata.requestCount}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Tokens</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {formatTokenCount(metadata.totalTokens)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Duration</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {formatDuration(metadata.duration)}
            </dd>
          </div>
        </div>

        {/* Token breakdown */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Input:</span>
              <span className="font-medium text-gray-900">
                {formatTokenCount(metadata.totalInputTokens)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Output:</span>
              <span className="font-medium text-gray-900">
                {formatTokenCount(metadata.totalOutputTokens)}
              </span>
            </div>
            {metadata.totalCacheReadTokens > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cache Read:</span>
                <span className="font-medium text-gray-900">
                  {formatTokenCount(metadata.totalCacheReadTokens)}
                </span>
              </div>
            )}
            {metadata.totalCacheCreationTokens > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cache Creation:</span>
                <span className="font-medium text-gray-900">
                  {formatTokenCount(metadata.totalCacheCreationTokens)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Models and Tools */}
        <div>
          {getModelBadges()}
          {getToolsBadges()}
        </div>

        {/* Footer with file info */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="truncate">{session.filename}</span>
            <span className="flex-shrink-0 ml-2">
              {session.isLoaded ? 'Loaded' : 'Not loaded'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface SessionCardSkeletonProps {
  count?: number;
}

export function SessionCardSkeleton({ count = 3 }: SessionCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <div className="p-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="h-6 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
              </div>
            </div>

            {/* Metrics skeleton */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-8 bg-gray-300 rounded w-12"></div>
                </div>
              ))}
            </div>

            {/* Token breakdown skeleton */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges skeleton */}
            <div className="flex space-x-2 mb-4">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>

            {/* Footer skeleton */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}