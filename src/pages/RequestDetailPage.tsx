import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { DocumentHead } from '../components/DocumentHead';
import { CopyableText } from '../components/CopyableText';
import { ConversationView } from '../components/ConversationView';
import { useRequestDetail } from '../hooks/useRequestDetail';
import { useRequestList } from '../hooks/useRequestList';
import { useDirectory } from '../contexts/DirectoryContext';
import { traceParserService } from '../services/traceParser';
import type { TraceResponse, TokenUsage } from '../types/trace';

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'text-terminal-green bg-terminal-green/10 border-terminal-green/30';
  if (status >= 300 && status < 400) return 'text-terminal-cyan bg-terminal-cyan/10 border-terminal-cyan/30';
  if (status >= 400 && status < 500) return 'text-terminal-amber bg-terminal-amber/10 border-terminal-amber/30';
  return 'text-terminal-red bg-terminal-red/10 border-terminal-red/30';
}

function extractReconstructedResponse(response: TraceResponse): string {
  if (response.body) {
    // Check if this is a token count response
    if ('input_tokens' in response.body && !('usage' in response.body)) {
      // Token count response - just has input_tokens
      return JSON.stringify({
        input_tokens: response.body.input_tokens
      }, null, 2);
    }

    // Regular message response (need to check that it has the message response structure)
    if ('content' in response.body) {
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
  }

  if (response.body_raw) {
    const reconstructed = traceParserService.reconstructResponseFromStream(response.body_raw);
    if (reconstructed) {
      return JSON.stringify(reconstructed, null, 2);
    }
  }

  return 'No response body available';
}

// Deprecated: extractMessageContent() has been replaced by conversationProcessor.processConversation()
// Keeping this comment for reference during migration

function extractToolCallsFromResponse(response: TraceResponse): Array<{
  id?: string;
  name: string;
  input: Record<string, unknown>;
}> {
  const toolCalls: Array<{
    id?: string;
    name: string;
    input: Record<string, unknown>;
  }> = [];

  // Handle non-streaming response
  if (response.body && 'content' in response.body && response.body.content) {
    for (const contentItem of response.body.content) {
      if (contentItem.type === 'tool_use' && 'name' in contentItem && 'input' in contentItem) {
        toolCalls.push({
          id: 'id' in contentItem ? String(contentItem.id) : undefined,
          name: String(contentItem.name),
          input: contentItem.input as Record<string, unknown>
        });
      }
    }
  }

  // Handle streaming response
  if (response.body_raw && !(response.body && 'content' in response.body && response.body.content)) {
    const events = traceParserService.parseStreamingResponse(response.body_raw);
    const toolCallMap = new Map<string, {
      id?: string;
      name: string;
      input: Record<string, unknown>;
    }>();

    for (const event of events) {
      if (event.type === 'content_block_start' &&
          event.content_block &&
          typeof event.content_block === 'object' &&
          'type' in event.content_block &&
          event.content_block.type === 'tool_use') {

        const toolBlock = event.content_block as unknown as {
          id?: string;
          name: string;
          input?: Record<string, unknown>;
        };
        const id = toolBlock.id || `tool-${toolCallMap.size}`;

        toolCallMap.set(id, {
          id: toolBlock.id,
          name: toolBlock.name,
          input: toolBlock.input || {}
        });
      }
    }

    toolCalls.push(...Array.from(toolCallMap.values()));
  }

  return toolCalls;
}

type TabType = 'messages' | 'raw-request' | 'raw-response' | 'headers' | 'tools';

export function RequestDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const requestId = params.requestId!;
  const navigate = useNavigate();
  const { request, loading, error } = useRequestDetail(sessionId, requestId);
  const { getAdjacentRequests } = useRequestList(sessionId);
  const { isDirectorySelected, isRestoring } = useDirectory();
  const [activeTab, setActiveTab] = useState<TabType>('messages');

  // Get adjacent requests for navigation
  const { prevRequestId, nextRequestId } = getAdjacentRequests(requestId);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Request navigation (Left/Right arrow keys)
      if (e.key === 'ArrowLeft' && prevRequestId && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        navigate(`/sessions/${sessionId}/requests/${prevRequestId}`);
        return;
      }
      if (e.key === 'ArrowRight' && nextRequestId && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        navigate(`/sessions/${sessionId}/requests/${nextRequestId}`);
        return;
      }

      // Tab shortcuts
      switch (e.key) {
        case '1':
          setActiveTab('messages');
          break;
        case '2':
          setActiveTab('raw-request');
          break;
        case '3':
          setActiveTab('raw-response');
          break;
        case '4':
          setActiveTab('headers');
          break;
        case '5':
          setActiveTab('tools');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [prevRequestId, nextRequestId, navigate, sessionId]);

  // Show restoration message
  if (isRestoring) {
    return (
      <>
        <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terminal-cyan mx-auto mb-4"></div>
            <p className="text-gray-400">Restoring directory...</p>
          </div>
        </div>
      </>
    );
  }

  // Show no directory message
  if (!isDirectorySelected) {
    return (
      <>
        <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="text-center">
            <div className="p-3 bg-terminal-amber/10 text-terminal-amber rounded-lg inline-block mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">No Directory Selected</h2>
            <p className="text-gray-400 mb-4">Please select a .claude-trace directory to view request details.</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-terminal-cyan text-gray-950 rounded-md hover:bg-terminal-cyan/90 transition-colors font-medium"
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Home Page
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terminal-cyan mx-auto mb-4"></div>
            <p className="text-gray-400">Loading request details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !request) {
    return (
      <>
        <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="text-center">
            <div className="p-3 bg-terminal-red/10 text-terminal-red rounded-lg inline-block mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Request Not Found</h2>
            <p className="text-gray-400 mb-4">{error || `Request ${requestId} not found in session ${sessionId}`}</p>
            <Link
              to={`/sessions/${sessionId}/requests`}
              className="inline-flex items-center px-4 py-2 bg-gray-800 text-gray-100 rounded-md hover:bg-gray-700 transition-colors border border-gray-700"
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
  const responseText = extractReconstructedResponse(request.response);
  const toolCalls = extractToolCallsFromResponse(request.response);
  const toolsAvailable = traceParserService.extractToolsAvailableFromRequest(request.request);
  const toolsUsed = traceParserService.extractToolsUsedFromResponse(request.response);

  // Detect if this is a token count request
  const isTokenCountRequest = request.request.url.includes('/messages/count_tokens');

  // Get token usage
  let usage: TokenUsage | null = null;
  let tokenCountOnly: number | null = null;

  if (isTokenCountRequest && request.response.body && 'input_tokens' in request.response.body && !('usage' in request.response.body)) {
    // Token count endpoint response
    tokenCountOnly = request.response.body.input_tokens;
  } else if (request.response.body && 'usage' in request.response.body) {
    usage = request.response.body.usage as TokenUsage;
  } else if (request.response.body_raw) {
    const reconstructed = traceParserService.reconstructResponseFromStream(request.response.body_raw);
    if (reconstructed?.usage) {
      usage = reconstructed.usage as TokenUsage;
    }
  }

  return (
    <>
      <DocumentHead title={`Request ${requestId} - Session ${sessionId}`} description={`Detailed view of request ${requestId} in session ${sessionId}`} />

      <div className="flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Back Navigation and Request Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              to={`/sessions/${sessionId}/requests`}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-terminal-cyan transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Requests
            </Link>

            {/* Request Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => prevRequestId && navigate(`/sessions/${sessionId}/requests/${prevRequestId}`)}
                disabled={!prevRequestId}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800 text-sm"
                title="Previous request (Left Arrow)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-gray-200">Previous</span>
              </button>
              <button
                onClick={() => nextRequestId && navigate(`/sessions/${sessionId}/requests/${nextRequestId}`)}
                disabled={!nextRequestId}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800 text-sm"
                title="Next request (Right Arrow)"
              >
                <span className="text-gray-200">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-gray-900 border border-gray-800 rounded-t-lg">
            <div className="flex border-b border-gray-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'messages'
                    ? 'border-terminal-cyan text-terminal-cyan bg-gray-800/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                }`}
              >
                <span className="font-mono text-xs text-gray-500">1</span>
                Messages
              </button>
              <button
                onClick={() => setActiveTab('raw-request')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'raw-request'
                    ? 'border-terminal-cyan text-terminal-cyan bg-gray-800/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                }`}
              >
                <span className="font-mono text-xs text-gray-500">2</span>
                Raw Request
              </button>
              <button
                onClick={() => setActiveTab('raw-response')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'raw-response'
                    ? 'border-terminal-cyan text-terminal-cyan bg-gray-800/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                }`}
              >
                <span className="font-mono text-xs text-gray-500">3</span>
                Raw Response
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'headers'
                    ? 'border-terminal-cyan text-terminal-cyan bg-gray-800/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                }`}
              >
                <span className="font-mono text-xs text-gray-500">4</span>
                Headers
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'tools'
                    ? 'border-terminal-cyan text-terminal-cyan bg-gray-800/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                }`}
              >
                <span className="font-mono text-xs text-gray-500">5</span>
                Tools
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-gray-900 border-x border-b border-gray-800 rounded-b-lg p-6">
            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <ConversationView entry={request} />
            )}

            {/* Raw Request Tab */}
            {activeTab === 'raw-request' && (
              <CopyableText
                text={JSON.stringify(request.request.body, null, 2)}
                label="Request Payload"
                format="json"
                maxHeight="600px"
              />
            )}

            {/* Raw Response Tab */}
            {activeTab === 'raw-response' && (
              <CopyableText
                text={responseText}
                label="Response Body"
                format="json"
                maxHeight="600px"
              />
            )}

            {/* Headers Tab */}
            {activeTab === 'headers' && (
              <div className="space-y-6">
                {/* Request Headers */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 font-mono">REQUEST HEADERS</h3>
                  <div className="space-y-1">
                    {Object.entries(request.request.headers).map(([key, value]) => (
                      <div key={key} className="flex gap-3 p-2 bg-gray-800/50 rounded text-xs font-mono">
                        <span className="text-terminal-cyan min-w-[180px]">{key}:</span>
                        <span className="text-gray-400 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Headers */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 font-mono">RESPONSE HEADERS</h3>
                  <div className="space-y-1">
                    {Object.entries(request.response.headers).map(([key, value]) => (
                      <div key={key} className="flex gap-3 p-2 bg-gray-800/50 rounded text-xs font-mono">
                        <span className="text-terminal-green min-w-[180px]">{key}:</span>
                        <span className="text-gray-400 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tools Tab */}
            {activeTab === 'tools' && (
              <div className="space-y-6">
                {/* Tools Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-xs font-mono text-gray-500 mb-2">AVAILABLE</div>
                    {toolsAvailable.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {toolsAvailable.map((tool) => (
                          <span key={tool} className="inline-flex px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded font-mono">
                            {tool}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">None</p>
                    )}
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-xs font-mono text-gray-500 mb-2">USED</div>
                    {toolsUsed.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {toolsUsed.map((tool) => (
                          <span key={tool} className="inline-flex px-2 py-1 text-xs bg-terminal-green/20 text-terminal-green rounded font-mono border border-terminal-green/30">
                            {tool}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">None</p>
                    )}
                  </div>
                </div>

                {/* Tool Definitions */}
                {request.request.body.tools && request.request.body.tools.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 font-mono">TOOL DEFINITIONS</h4>
                    <div className="space-y-3">
                      {request.request.body.tools.map((tool) => (
                        <div key={tool.name} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-200 font-mono">{tool.name}</h5>
                              <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs rounded font-mono ${
                              toolsUsed.includes(tool.name)
                                ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/30'
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {toolsUsed.includes(tool.name) ? 'USED' : 'AVAILABLE'}
                            </span>
                          </div>

                          <CopyableText
                            text={JSON.stringify(tool.input_schema, null, 2)}
                            label="Schema"
                            format="json"
                            maxHeight="200px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tool Calls */}
                {toolCalls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 font-mono">TOOL CALLS</h4>
                    <div className="space-y-4">
                      {toolCalls.map((toolCall, index) => (
                        <div key={toolCall.id || `tool-${index}`} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-terminal-cyan/10 text-terminal-cyan rounded">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-200 font-mono">{toolCall.name}</h5>
                              {toolCall.id && (
                                <p className="text-xs text-gray-500 font-mono">ID: {toolCall.id}</p>
                              )}
                            </div>
                          </div>

                          <CopyableText
                            text={JSON.stringify(toolCall.input, null, 2)}
                            label="Input"
                            format="json"
                            maxHeight="200px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {toolsAvailable.length === 0 && toolsUsed.length === 0 && toolCalls.length === 0 && (
                  <p className="text-gray-500 text-sm">No tools available or used in this request</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[320px] flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            {/* Request Metadata Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-xs font-mono text-gray-500 mb-3">REQUEST METADATA</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(request.response.status_code)}`}>
                    {request.response.status_code}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Method</div>
                  <span className="inline-flex px-2 py-1 text-xs font-mono bg-gray-800 text-terminal-cyan rounded">
                    {request.request.method}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Duration</div>
                  <div className="text-sm font-mono text-gray-300">{formattedDuration}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Timestamp</div>
                  <div className="text-xs font-mono text-gray-400">
                    {new Date(request.request.timestamp * 1000).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Endpoint</div>
                  <div className="text-xs font-mono text-gray-400 break-all" title={request.request.url}>
                    {request.request.url}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics Card */}
            {(usage || tokenCountOnly !== null) && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="text-xs font-mono text-gray-500 mb-3">{isTokenCountRequest ? 'TOKEN COUNT' : 'PERFORMANCE METRICS'}</h3>
                <div className="space-y-3">
                  {isTokenCountRequest && tokenCountOnly !== null ? (
                    <>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-gray-500">Input Tokens</span>
                        <span className="text-sm font-mono text-terminal-cyan">{tokenCountOnly.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-800">
                        <p className="text-xs text-gray-500 italic">Token count request - no output generated</p>
                      </div>
                    </>
                  ) : usage ? (
                    <>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-gray-500">Input Tokens</span>
                        <span className="text-sm font-mono text-terminal-cyan">{usage.input_tokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-gray-500">Output Tokens</span>
                        <span className="text-sm font-mono text-terminal-green">{usage.output_tokens.toLocaleString()}</span>
                      </div>
                      {usage.cache_creation_input_tokens > 0 && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-500">Cache Write</span>
                          <span className="text-sm font-mono text-terminal-amber">{usage.cache_creation_input_tokens.toLocaleString()}</span>
                        </div>
                      )}
                      {usage.cache_read_input_tokens > 0 && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-500">Cache Read</span>
                          <span className="text-sm font-mono text-terminal-purple">{usage.cache_read_input_tokens.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-800 flex justify-between items-baseline">
                        <span className="text-xs text-gray-400 font-semibold">Total</span>
                        <span className="text-base font-mono text-gray-200 font-semibold">
                          {(usage.input_tokens + usage.output_tokens + usage.cache_creation_input_tokens + usage.cache_read_input_tokens).toLocaleString()}
                        </span>
                      </div>
                      {request.response.body && 'stop_reason' in request.response.body && request.response.body.stop_reason && (
                        <div className="pt-2 border-t border-gray-800">
                          <div className="text-xs text-gray-500 mb-1">Stop Reason</div>
                          <span className="text-xs font-mono text-gray-300">{request.response.body.stop_reason}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-800">
                        <div className="text-xs text-gray-500 mb-1">Service Tier</div>
                        <span className="text-xs font-mono text-gray-300">{usage.service_tier}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* Model Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-xs font-mono text-gray-500 mb-3">MODEL</h3>
              <div className="text-sm font-mono text-terminal-purple">{request.request.body.model}</div>
            </div>

            {/* Session Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-xs font-mono text-gray-500 mb-3">SESSION INFO</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Session ID</div>
                  <div className="text-xs font-mono text-gray-400 break-all">{sessionId}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Request ID</div>
                  <div className="text-xs font-mono text-gray-400 break-all">{requestId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
