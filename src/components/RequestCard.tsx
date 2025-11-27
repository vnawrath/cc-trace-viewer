import { Link } from 'react-router';
import type { RequestMetrics } from '../services/requestAnalyzer';

interface RequestCardProps {
  request: RequestMetrics;
  sessionId: string;
  showDetailedView?: boolean;
}

export function RequestCard({ request, sessionId, showDetailedView = false }: RequestCardProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTokens = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-100';
    if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-100';
    if (status >= 400 && status < 500) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getModelColor = (model: string) => {
    // Different colors for different models
    const colors = {
      'claude-3-5-sonnet-20241022': 'text-purple-600 bg-purple-100',
      'claude-3-5-haiku-20241022': 'text-blue-600 bg-blue-100',
      'claude-3-opus-20240229': 'text-red-600 bg-red-100',
      'claude-3-sonnet-20240229': 'text-green-600 bg-green-100',
      'claude-3-haiku-20240307': 'text-cyan-600 bg-cyan-100'
    };
    return colors[model as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  if (showDetailedView) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModelColor(request.model)}`}>
              {request.model}
            </span>
            {request.isStreaming && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-indigo-600 bg-indigo-100">
                Streaming
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 font-mono">
            {new Date(request.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {request.contentPreview}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{formatDuration(request.duration)}</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{formatTokens(request.totalTokens)}</div>
            <div className="text-xs text-gray-500">Total Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{formatTokens(request.inputTokens)}</div>
            <div className="text-xs text-gray-500">Input</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{formatTokens(request.outputTokens)}</div>
            <div className="text-xs text-gray-500">Output</div>
          </div>
        </div>

        {(request.toolsAvailable.length > 0 || request.toolsUsed.length > 0) && (
          <div className="mb-4">
            {request.toolsAvailable.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-2">Tools Available:</div>
                <div className="flex flex-wrap gap-1">
                  {request.toolsAvailable.map(tool => (
                    <span
                      key={tool}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                        request.toolsUsed.includes(tool)
                          ? 'text-amber-700 bg-amber-100 border border-amber-300'
                          : 'text-gray-600 bg-gray-100'
                      }`}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {request.toolsUsed.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Tools Actually Used:</div>
                <div className="flex flex-wrap gap-1">
                  {request.toolsUsed.map(tool => (
                    <span
                      key={tool}
                      className="inline-flex px-2 py-1 text-xs font-medium rounded-md text-amber-700 bg-amber-100 border border-amber-300"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{request.messageCount} messages</span>
            {request.systemPromptLength > 0 && (
              <span>{formatTokens(request.systemPromptLength)} chars system</span>
            )}
            {request.stopReason && (
              <span>Stopped: {request.stopReason}</span>
            )}
          </div>
          <Link
            to={`/sessions/${sessionId}/requests/${request.id}`}
            className="text-blue-600 hover:text-blue-900 font-medium text-sm"
          >
            View Details →
          </Link>
        </div>
      </div>
    );
  }

  // Compact table row view (~36px height, dark theme)
  return (
    <tr className="hover:bg-gray-800/50 transition-colors group" title={request.stopReason ? `Stop reason: ${request.stopReason}` : undefined}>
      {/* Status Icon */}
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {request.hasError ? (
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {request.isStreaming && (
            <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
      </td>

      {/* Timestamp */}
      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-400 font-mono">
        {new Date(request.timestamp).toLocaleTimeString()}
      </td>

      {/* Model */}
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-[11px] text-purple-400 font-mono">
          {request.model.replace('claude-3-5-', '').replace('claude-3-', '').replace('-20241022', '').replace('-20240229', '').replace('-20240307', '')}
        </span>
      </td>

      {/* Duration */}
      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-cyan-400 font-mono">
        {formatDuration(request.duration)}
      </td>

      {/* Tokens */}
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono font-medium text-cyan-400">{formatTokens(request.totalTokens)}</span>
          <span className="text-[10px] text-gray-500 font-mono">{formatTokens(request.inputTokens)} / {formatTokens(request.outputTokens)}</span>
        </div>
      </td>

      {/* Tools */}
      <td className="px-3 py-2 whitespace-nowrap">
        {request.toolsUsed.length > 0 ? (
          <div className="flex items-center gap-1" title={request.toolsUsed.join(', ')}>
            <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[11px] text-amber-400 font-mono">{request.toolsUsed.length}</span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-600">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-2 whitespace-nowrap text-right">
        <Link
          to={`/sessions/${sessionId}/requests/${request.id}`}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}