import { Link } from 'react-router';
import type { SessionData } from '../types/trace';

interface SessionSummaryProps {
  sessionId: string;
  metadata: SessionData;
  aggregateMetrics?: {
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
}

export function SessionSummary({ sessionId, metadata, aggregateMetrics }: SessionSummaryProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const formatTokens = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getHealthColor = (errorRate: number) => {
    if (errorRate === 0) return 'text-green-600 bg-green-100';
    if (errorRate < 0.1) return 'text-yellow-600 bg-yellow-100';
    if (errorRate < 0.3) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Session Overview</h2>
          <p className="text-gray-600 mt-1">
            Session: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{sessionId}</span>
          </p>
          <p className="text-gray-500 text-sm mt-1">
            User: <span className="font-mono">{metadata.userId}</span>
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Started: {formatDateTime(metadata.startTime)}</div>
          <div>Ended: {formatDateTime(metadata.endTime)}</div>
          <div className="mt-1">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              ← Back to Sessions
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{metadata.totalRequests}</div>
          <div className="text-sm text-gray-500">Requests</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{formatTokens(metadata.totalTokensUsed)}</div>
          <div className="text-sm text-gray-500">Total Tokens</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{formatTokens(metadata.totalInputTokens)}</div>
          <div className="text-sm text-gray-500">Input Tokens</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{formatTokens(metadata.totalOutputTokens)}</div>
          <div className="text-sm text-gray-500">Output Tokens</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{formatDuration(metadata.duration)}</div>
          <div className="text-sm text-gray-500">Total Duration</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getHealthColor(aggregateMetrics?.errorRate || 0)}`}>
              {metadata.hasErrors ? 'Has Errors' : 'Healthy'}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">Status</div>
        </div>
      </div>

      {aggregateMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{formatDuration(aggregateMetrics.avgDuration)}</div>
            <div className="text-xs text-gray-500">Avg Duration</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{formatPercentage(aggregateMetrics.errorRate)}</div>
            <div className="text-xs text-gray-500">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{formatPercentage(aggregateMetrics.streamingRate)}</div>
            <div className="text-xs text-gray-500">Streaming</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{aggregateMetrics.errorCount}</div>
            <div className="text-xs text-gray-500">Errors</div>
          </div>
        </div>
      )}

      {/* Cache Usage Stats */}
      {(metadata.totalCacheCreationTokens > 0 || metadata.totalCacheReadTokens > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{formatTokens(metadata.totalCacheCreationTokens)}</div>
            <div className="text-xs text-gray-500">Cache Created</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{formatTokens(metadata.totalCacheReadTokens)}</div>
            <div className="text-xs text-gray-500">Cache Read</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{formatTokens(metadata.totalCacheCreation5mTokens)}</div>
            <div className="text-xs text-gray-500">5m Cache</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-indigo-600">{formatTokens(metadata.totalCacheCreation1hTokens)}</div>
            <div className="text-xs text-gray-500">1h Cache</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Models Used:</div>
          <div className="flex flex-wrap gap-2">
            {metadata.modelsUsed.map(model => (
              <span
                key={model}
                className="inline-flex px-3 py-1 text-sm font-medium rounded-full text-purple-700 bg-purple-100"
              >
                {model.replace('claude-3-5-', '').replace('claude-3-', '').replace('-20241022', '').replace('-20240229', '').replace('-20240307', '')}
              </span>
            ))}
          </div>
        </div>

        {metadata.toolsAvailable.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Tools Available:</div>
            <div className="flex flex-wrap gap-2">
              {metadata.toolsAvailable.map(tool => (
                <span
                  key={tool}
                  className="inline-flex px-3 py-1 text-sm font-medium rounded-full text-gray-600 bg-gray-100"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {metadata.toolsUsed.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Tools Actually Used:</div>
            <div className="flex flex-wrap gap-2">
              {metadata.toolsUsed.map(tool => (
                <span
                  key={tool}
                  className="inline-flex px-3 py-1 text-sm font-medium rounded-full text-amber-700 bg-amber-100"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}