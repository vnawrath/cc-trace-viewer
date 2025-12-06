import type { ClaudeTraceEntry, TokenUsage } from '../types/trace';
import { traceParserService } from '../services/traceParser';

interface RequestMetricsProps {
  request: ClaudeTraceEntry;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
}

function MetricCard({ label, value, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    gray: 'text-gray-600 bg-gray-50'
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]} mr-3`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function RequestMetrics({ request }: RequestMetricsProps) {
  const duration = traceParserService.getRequestDuration(request);
  const formattedDuration = traceParserService.formatDuration(duration);

  // Get token usage from response or reconstructed streaming response
  let usage: TokenUsage | null = null;
  if (request.response.body && 'usage' in request.response.body) {
    usage = request.response.body.usage as TokenUsage;
  } else if (request.response.body_raw) {
    const reconstructed = traceParserService.reconstructResponseFromStream(request.response.body_raw);
    if (reconstructed?.usage) {
      usage = reconstructed.usage as TokenUsage;
    }
  }

  const formatTokens = (tokens: number) => traceParserService.formatTokenCount(tokens);

  const clockIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const tokenIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const downloadIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  );

  const uploadIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );

  const cacheIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );

  const statusIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'green';
    if (statusCode >= 300 && statusCode < 400) return 'blue';
    if (statusCode >= 400 && statusCode < 500) return 'orange';
    return 'gray';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Duration"
          value={formattedDuration}
          icon={clockIcon}
          color="blue"
        />

        <MetricCard
          label="Status Code"
          value={request.response.status_code}
          icon={statusIcon}
          color={getStatusColor(request.response.status_code)}
        />

        <MetricCard
          label="Model"
          value={request.request.body.model}
          icon={tokenIcon}
          color="purple"
        />

        {usage && (
          <>
            <MetricCard
              label="Input Tokens"
              value={formatTokens(usage.input_tokens)}
              icon={uploadIcon}
              color="green"
            />

            <MetricCard
              label="Output Tokens"
              value={formatTokens(usage.output_tokens)}
              icon={downloadIcon}
              color="blue"
            />

            {(usage.cache_creation_input_tokens > 0 || usage.cache_read_input_tokens > 0) && (
              <>
                <MetricCard
                  label="Cache Creation"
                  value={formatTokens(usage.cache_creation_input_tokens)}
                  icon={cacheIcon}
                  color="orange"
                />

                <MetricCard
                  label="Cache Read"
                  value={formatTokens(usage.cache_read_input_tokens)}
                  icon={cacheIcon}
                  color="green"
                />
              </>
            )}

            {usage.cache_creation && (
              <>
                {usage.cache_creation.ephemeral_5m_input_tokens > 0 && (
                  <MetricCard
                    label="5m Cache"
                    value={formatTokens(usage.cache_creation.ephemeral_5m_input_tokens)}
                    icon={cacheIcon}
                    color="purple"
                  />
                )}

                {usage.cache_creation.ephemeral_1h_input_tokens > 0 && (
                  <MetricCard
                    label="1h Cache"
                    value={formatTokens(usage.cache_creation.ephemeral_1h_input_tokens)}
                    icon={cacheIcon}
                    color="purple"
                  />
                )}
              </>
            )}

            <MetricCard
              label="Total Tokens"
              value={formatTokens(usage.input_tokens + usage.output_tokens + usage.cache_creation_input_tokens + usage.cache_read_input_tokens)}
              icon={tokenIcon}
              color="gray"
            />
          </>
        )}
      </div>

      {usage && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Token Usage Breakdown</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Input:</span>
                <span className="ml-2 font-semibold">{usage.input_tokens.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Output:</span>
                <span className="ml-2 font-semibold">{usage.output_tokens.toLocaleString()}</span>
              </div>
              {usage.cache_creation_input_tokens > 0 && (
                <div>
                  <span className="text-gray-600">Cache Creation:</span>
                  <span className="ml-2 font-semibold">{usage.cache_creation_input_tokens.toLocaleString()}</span>
                </div>
              )}
              {usage.cache_read_input_tokens > 0 && (
                <div>
                  <span className="text-gray-600">Cache Read:</span>
                  <span className="ml-2 font-semibold">{usage.cache_read_input_tokens.toLocaleString()}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Service Tier:</span>
                <span className="ml-2 font-semibold">{usage.service_tier}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}