import type { ClaudeTraceEntry, TraceResponse } from '../types/trace';
import { traceParserService } from '../services/traceParser';
import { CopyableText } from './CopyableText';

interface ToolUsageDisplayProps {
  request: ClaudeTraceEntry;
}

interface ToolCallDisplayProps {
  toolCall: {
    id?: string;
    name: string;
    input: Record<string, unknown>;
  };
  result?: {
    content: string;
    is_error?: boolean;
  };
}

function ToolCallDisplay({ toolCall, result }: ToolCallDisplayProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{toolCall.name}</h4>
          {toolCall.id && (
            <p className="text-xs text-gray-500 font-mono">ID: {toolCall.id}</p>
          )}
        </div>
      </div>

      <div>
        <CopyableText
          text={JSON.stringify(toolCall.input, null, 2)}
          label="Tool Input"
          format="json"
          maxHeight="200px"
        />
      </div>

      {result && (
        <div>
          <CopyableText
            text={result.content}
            label={result.is_error ? "Tool Error" : "Tool Result"}
            format={result.is_error ? 'text' : 'json'}
            maxHeight="200px"
            className={result.is_error ? 'border-red-200 bg-red-50' : ''}
          />
        </div>
      )}
    </div>
  );
}

function extractToolCallsFromResponse(response: TraceResponse): Array<{
  id?: string;
  name: string;
  input: Record<string, unknown>;
  result?: {
    content: string;
    is_error?: boolean;
  };
}> {
  const toolCalls: Array<{
    id?: string;
    name: string;
    input: Record<string, unknown>;
    result?: { content: string; is_error?: boolean };
  }> = [];

  // Handle non-streaming response
  if (response.body?.content) {
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
  if (response.body_raw && !response.body?.content) {
    const events = traceParserService.parseStreamingResponse(response.body_raw);
    const toolCallMap = new Map<string, {
      id?: string;
      name: string;
      input: Record<string, unknown>;
      result?: { content: string; is_error?: boolean };
    }>();

    for (const event of events) {
      // Handle tool call start
      if (event.type === 'content_block_start' &&
          event.content_block &&
          typeof event.content_block === 'object' &&
          'type' in event.content_block &&
          event.content_block.type === 'tool_use') {

        const toolBlock = event.content_block as any;
        const id = toolBlock.id || `tool-${toolCallMap.size}`;

        toolCallMap.set(id, {
          id: toolBlock.id,
          name: toolBlock.name,
          input: toolBlock.input || {}
        });
      }

      // Handle tool call input deltas
      if (event.type === 'content_block_delta' &&
          event.delta &&
          typeof event.delta === 'object' &&
          'type' in event.delta &&
          event.delta.type === 'input_json_delta') {

        const index = typeof event.index === 'number' ? event.index : 0;
        const id = `tool-${index}`;
        const existing = toolCallMap.get(id);

        if (existing) {
          // Merge input delta (this is complex, but for now we'll keep existing input)
          toolCallMap.set(id, existing);
        }
      }
    }

    toolCalls.push(...Array.from(toolCallMap.values()));
  }

  return toolCalls;
}

export function ToolUsageDisplay({ request }: ToolUsageDisplayProps) {
  const toolsAvailable = traceParserService.extractToolsAvailableFromRequest(request.request);
  const toolsUsed = traceParserService.extractToolsUsedFromResponse(request.response);
  const toolCalls = extractToolCallsFromResponse(request.response);

  if (toolsAvailable.length === 0 && toolsUsed.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">No tools available or used in this request</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Tool Usage</h3>

      {/* Tools Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Available Tools</h4>
        {toolsAvailable.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {toolsAvailable.map((tool) => {
              const isUsed = toolsUsed.includes(tool);
              return (
                <span
                  key={tool}
                  className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    isUsed
                      ? 'bg-green-100 text-green-800 font-medium'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {tool}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-600">None</p>
        )}
      </div>

      {/* Tool Definitions */}
      {request.request.body.tools && request.request.body.tools.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Tool Definitions</h4>
          <div className="space-y-3">
            {request.request.body.tools.map((tool) => (
              <div key={tool.name} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-900">{tool.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    toolsUsed.includes(tool.name)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {toolsUsed.includes(tool.name) ? 'Used' : 'Available'}
                  </span>
                </div>

                <CopyableText
                  text={JSON.stringify(tool.input_schema, null, 2)}
                  label="Input Schema"
                  format="json"
                  maxHeight="150px"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool Calls and Results */}
      {toolCalls.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Tool Calls & Results</h4>
          <div className="space-y-4">
            {toolCalls.map((toolCall, index) => (
              <ToolCallDisplay
                key={toolCall.id || `tool-${index}`}
                toolCall={toolCall}
                result={toolCall.result}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}