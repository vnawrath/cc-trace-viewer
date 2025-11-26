import { Link, useParams } from 'react-router';
import { DocumentHead } from '../components/DocumentHead';
import { CopyableText } from '../components/CopyableText';
import { RequestMetrics } from '../components/RequestMetrics';
import { ToolUsageDisplay } from '../components/ToolUsageDisplay';
import { useRequestDetail } from '../hooks/useRequestDetail';
import { traceParserService } from '../services/traceParser';
import type { TraceResponse } from '../types/trace';

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'text-green-600 bg-green-100';
  if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-100';
  if (status >= 400 && status < 500) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

function extractReconstructedResponse(response: TraceResponse): string {
  if (response.body) {
    return JSON.stringify({
      model: response.body.model,
      id: response.body.id,
      type: response.body.type,
      role: response.body.role,
      content: response.body.content,
      stop_reason: response.body.stop_reason,
      usage: response.body.usage
    }, null, 2);
  }

  if (response.body_raw) {
    const reconstructed = traceParserService.reconstructResponseFromStream(response.body_raw);
    if (reconstructed) {
      return JSON.stringify(reconstructed, null, 2);
    }
  }

  return 'No response body available';
}

function extractMessageContent(request: any): Array<{ role: string; content: string; type?: string }> {
  const messages = [];

  // System messages
  if (request.body.system) {
    messages.push({
      role: 'system',
      type: 'system',
      content: request.body.system.map((s: any) => s.text).join('\n\n')
    });
  }

  // Conversation messages
  if (request.body.messages) {
    for (const message of request.body.messages) {
      let content = '';

      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        content = message.content
          .filter((c: any) => c.type === 'text' && c.text)
          .map((c: any) => c.text)
          .join('\n\n');
      }

      if (content.trim()) {
        messages.push({
          role: message.role,
          content
        });
      }
    }
  }

  return messages;
}

export function RequestDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const requestId = params.requestId!;
  const { request, loading, error } = useRequestDetail(sessionId, requestId);

  if (loading) {
    return (
      <>
        <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading request details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !request) {
    return (
      <>
        <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="p-3 bg-red-100 text-red-600 rounded-full inline-block mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Not Found</h2>
            <p className="text-gray-600 mb-4">{error || `Request ${requestId} not found in session ${sessionId}`}</p>
            <Link
              to={`/sessions/${sessionId}/requests`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Requests
            </Link>
          </div>
        </div>
      </>
    );
  }

  const duration = traceParserService.getRequestDuration(request);
  const formattedDuration = traceParserService.formatDuration(duration);
  const messages = extractMessageContent(request.request);
  const responseText = extractReconstructedResponse(request.response);

  return (
    <>
      <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Session: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</span></span>
                <span>Request: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{requestId}</span></span>
              </div>
            </div>
            <Link
              to={`/sessions/${sessionId}/requests`}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Requests
            </Link>
          </div>

          {/* Request Overview */}
          <div className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full text-blue-600 bg-blue-100">
                {request.request.method}
              </span>
            </div>
            <div>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.response.status_code)}`}>
                {request.response.status_code}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Duration: <span className="font-semibold">{formattedDuration}</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-mono">{new Date(request.request.timestamp * 1000).toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-1">API Endpoint</div>
            <div className="font-mono text-lg bg-gray-100 px-3 py-2 rounded">{request.request.url}</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <RequestMetrics request={request} />
        </div>

        {/* Request Headers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Headers</h3>
          <div className="space-y-2">
            {Object.entries(request.request.headers).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded">
                <span className="font-semibold text-gray-700 min-w-32">{key}:</span>
                <span className="font-mono text-sm text-gray-600 break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation Messages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h3>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index}>
                <CopyableText
                  text={message.content}
                  label={`${message.role.charAt(0).toUpperCase() + message.role.slice(1)} ${message.type === 'system' ? 'Prompt' : 'Message'}`}
                  className={`${
                    message.role === 'system'
                      ? 'border-l-4 border-purple-400 bg-purple-50'
                      : message.role === 'user'
                      ? 'border-l-4 border-blue-400 bg-blue-50'
                      : 'border-l-4 border-green-400 bg-green-50'
                  } pl-4`}
                  maxHeight="300px"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Assistant Response */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assistant Response</h3>
          <CopyableText
            text={responseText}
            format="json"
            maxHeight="400px"
          />
        </div>

        {/* Tool Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ToolUsageDisplay request={request} />
        </div>

        {/* Raw Request Data */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Request Data</h3>
          <CopyableText
            text={JSON.stringify(request.request.body, null, 2)}
            label="Request Payload"
            format="json"
            maxHeight="400px"
          />
        </div>

        {/* Response Headers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Headers</h3>
          <div className="space-y-2">
            {Object.entries(request.response.headers).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded">
                <span className="font-semibold text-gray-700 min-w-32">{key}:</span>
                <span className="font-mono text-sm text-gray-600 break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>
    </div>
    </>
  );
}