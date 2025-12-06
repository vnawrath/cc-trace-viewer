import type { ClaudeTraceEntry, TokenUsage } from '../types/trace';
import { traceParserService } from './traceParser';
import type { ContentBlock } from '../utils/messageFormatting';
import { calculateRequestCost } from './costCalculator';

export interface RequestMetrics {
  id: string;
  requestIndex: number;
  method: string;
  model: string;
  status: number;
  duration: number;
  timestamp: number;
  formattedTimestamp: string;
  tokenUsage: TokenUsage | null;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: {
    creation: number;
    read: number;
    creation5m: number;
    creation1h: number;
  };
  isStreaming: boolean;
  isTokenCountRequest: boolean;
  hasError: boolean;
  toolsAvailable: string[];
  toolsUsed: string[];
  messageCount: number;
  systemPromptLength: number;
  contentPreview: string;
  stopReason: string | null;
  responseContent: ContentBlock[];
  rawRequest: import('../types/trace').TraceRequest;
  rawResponse: import('../types/trace').TraceResponse;
  cost: number | null; // Cost in USD, null if model pricing is unknown
}

export interface RequestFilters {
  models: string[];
  toolsAvailable: string[];
  toolsUsed: string[];
  hasErrors: boolean | null;
  isStreaming: boolean | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  minDuration: number | null;
  maxDuration: number | null;
  minTokens: number | null;
  maxTokens: number | null;
}

export type SortField = 'timestamp' | 'duration' | 'totalTokens' | 'inputTokens' | 'outputTokens' | 'model';
export type SortDirection = 'asc' | 'desc';

export class RequestAnalyzerService {
  analyzeRequest(entry: ClaudeTraceEntry, index: number): RequestMetrics {
    const { request, response } = entry;

    // Detect if this is a token count request
    const isTokenCountRequest = request.url.includes('/messages/count_tokens');

    // Extract token usage from response or reconstructed streaming data
    let tokenUsage: TokenUsage | null = null;
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheTokens = {
      creation: 0,
      read: 0,
      creation5m: 0,
      creation1h: 0
    };

    // Handle token count endpoint response (different structure)
    if (isTokenCountRequest && response.body && 'input_tokens' in response.body && !('usage' in response.body)) {
      // Token count response: { input_tokens: number }
      inputTokens = response.body.input_tokens;
      totalTokens = inputTokens;
      // No output tokens, cache tokens, or full usage object for token count requests
    } else if (response.body && 'usage' in response.body) {
      // Regular message response
      tokenUsage = response.body.usage as TokenUsage;
    } else if (response.body_raw) {
      // Try to extract from streaming response
      const reconstructed = traceParserService.reconstructResponseFromStream(response.body_raw);
      if (reconstructed?.usage && typeof reconstructed.usage === 'object') {
        // Cast the reconstructed usage to TokenUsage if it has the expected structure
        const usage = reconstructed.usage as Record<string, unknown>;
        if (typeof usage.input_tokens === 'number' && typeof usage.output_tokens === 'number') {
          tokenUsage = {
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
            cache_creation_input_tokens: typeof usage.cache_creation_input_tokens === 'number' ? usage.cache_creation_input_tokens : 0,
            cache_read_input_tokens: typeof usage.cache_read_input_tokens === 'number' ? usage.cache_read_input_tokens : 0,
            cache_creation: {
              ephemeral_5m_input_tokens: typeof usage.cache_creation === 'object' && usage.cache_creation && typeof (usage.cache_creation as any).ephemeral_5m_input_tokens === 'number' ? (usage.cache_creation as any).ephemeral_5m_input_tokens : 0,
              ephemeral_1h_input_tokens: typeof usage.cache_creation === 'object' && usage.cache_creation && typeof (usage.cache_creation as any).ephemeral_1h_input_tokens === 'number' ? (usage.cache_creation as any).ephemeral_1h_input_tokens : 0
            },
            service_tier: typeof usage.service_tier === 'string' ? usage.service_tier : 'default'
          } as TokenUsage;
        }
      }
    }

    if (tokenUsage) {
      inputTokens = tokenUsage.input_tokens;
      outputTokens = tokenUsage.output_tokens;
      totalTokens = inputTokens + outputTokens;
      cacheTokens.creation = tokenUsage.cache_creation_input_tokens;
      cacheTokens.read = tokenUsage.cache_read_input_tokens;
      cacheTokens.creation5m = tokenUsage.cache_creation?.ephemeral_5m_input_tokens || 0;
      cacheTokens.creation1h = tokenUsage.cache_creation?.ephemeral_1h_input_tokens || 0;
    }

    // Calculate duration
    const duration = response.timestamp - request.timestamp;

    // Extract tools available and used
    const toolsAvailable = traceParserService.extractToolsAvailableFromRequest(request);
    const toolsUsed = traceParserService.extractToolsUsedFromResponse(response);

    // Generate content preview from first user message
    let contentPreview = '';
    const firstUserMessage = request.body.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      if (typeof firstUserMessage.content === 'string') {
        contentPreview = firstUserMessage.content.slice(0, 100);
      } else if (Array.isArray(firstUserMessage.content)) {
        const textContent = firstUserMessage.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent) {
          contentPreview = String(textContent.text).slice(0, 100);
        }
      }
    }

    // Calculate system prompt length
    const systemPromptLength = request.body.system?.reduce((total, item) => {
      return total + item.text.length;
    }, 0) || 0;

    // Extract response content from body or body_raw (for streaming)
    // Token count requests don't have response content
    let responseContent: ContentBlock[] = [];
    if (!isTokenCountRequest) {
      if (response.body && 'content' in response.body) {
        // Non-streaming response: content is directly available
        responseContent = response.body.content as ContentBlock[];
      } else if (response.body_raw) {
        // Streaming response: reconstruct content from body_raw
        const reconstructed = traceParserService.reconstructResponseFromStream(response.body_raw);
        if (reconstructed?.content && Array.isArray(reconstructed.content)) {
          responseContent = reconstructed.content as ContentBlock[];
        }
      }
    }

    // Calculate cost
    let cost: number | null = null;
    if (tokenUsage) {
      cost = calculateRequestCost(
        request.body.model,
        tokenUsage,
        inputTokens
      );

      // Log warning for unknown models
      if (cost === null) {
        console.warn(`Unknown pricing for model: ${request.body.model}`);
      }
    }

    // Generate unique ID from timestamp and index
    const id = `${request.timestamp}-${index}`;

    return {
      id,
      requestIndex: index,
      method: request.method,
      model: request.body.model,
      status: response.status_code,
      duration,
      timestamp: request.timestamp,
      formattedTimestamp: new Date(request.timestamp).toISOString(),
      tokenUsage,
      totalTokens,
      inputTokens,
      outputTokens,
      cacheTokens,
      isStreaming: Boolean(request.body.stream),
      isTokenCountRequest,
      hasError: response.status_code >= 400,
      toolsAvailable,
      toolsUsed,
      messageCount: request.body.messages.length,
      systemPromptLength,
      contentPreview: contentPreview + (contentPreview.length >= 100 ? '...' : ''),
      stopReason: !isTokenCountRequest && response.body && 'stop_reason' in response.body ? response.body.stop_reason : null,
      responseContent,
      rawRequest: request,
      rawResponse: response,
      cost
    };
  }

  analyzeRequests(requests: ClaudeTraceEntry[]): RequestMetrics[] {
    return requests.map((request, index) => this.analyzeRequest(request, index));
  }

  filterRequests(requests: RequestMetrics[], filters: Partial<RequestFilters>): RequestMetrics[] {
    return requests.filter(request => {
      // Model filter
      if (filters.models && filters.models.length > 0) {
        if (!filters.models.includes(request.model)) {
          return false;
        }
      }

      // Tools available filter
      if (filters.toolsAvailable && filters.toolsAvailable.length > 0) {
        const hasRequiredTool = filters.toolsAvailable.some(tool =>
          request.toolsAvailable.includes(tool)
        );
        if (!hasRequiredTool) {
          return false;
        }
      }

      // Tools used filter
      if (filters.toolsUsed && filters.toolsUsed.length > 0) {
        const hasRequiredTool = filters.toolsUsed.some(tool =>
          request.toolsUsed.includes(tool)
        );
        if (!hasRequiredTool) {
          return false;
        }
      }

      // Error filter
      if (filters.hasErrors !== null && filters.hasErrors !== undefined) {
        if (request.hasError !== filters.hasErrors) {
          return false;
        }
      }

      // Streaming filter
      if (filters.isStreaming !== null && filters.isStreaming !== undefined) {
        if (request.isStreaming !== filters.isStreaming) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const requestDate = new Date(request.timestamp);
        if (filters.dateRange.start && requestDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && requestDate > filters.dateRange.end) {
          return false;
        }
      }

      // Duration filter
      if (filters.minDuration !== null && filters.minDuration !== undefined) {
        if (request.duration < filters.minDuration) {
          return false;
        }
      }
      if (filters.maxDuration !== null && filters.maxDuration !== undefined) {
        if (request.duration > filters.maxDuration) {
          return false;
        }
      }

      // Token count filter
      if (filters.minTokens !== null && filters.minTokens !== undefined) {
        if (request.totalTokens < filters.minTokens) {
          return false;
        }
      }
      if (filters.maxTokens !== null && filters.maxTokens !== undefined) {
        if (request.totalTokens > filters.maxTokens) {
          return false;
        }
      }

      return true;
    });
  }

  sortRequests(requests: RequestMetrics[], field: SortField, direction: SortDirection = 'desc'): RequestMetrics[] {
    return [...requests].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (field) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'totalTokens':
          aValue = a.totalTokens;
          bValue = b.totalTokens;
          break;
        case 'inputTokens':
          aValue = a.inputTokens;
          bValue = b.inputTokens;
          break;
        case 'outputTokens':
          aValue = a.outputTokens;
          bValue = b.outputTokens;
          break;
        case 'model':
          aValue = a.model;
          bValue = b.model;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }

  getUniqueModels(requests: RequestMetrics[]): string[] {
    const models = new Set(requests.map(req => req.model));
    return Array.from(models).sort();
  }

  getUniqueToolsAvailable(requests: RequestMetrics[]): string[] {
    const tools = new Set<string>();
    requests.forEach(req => {
      req.toolsAvailable.forEach(tool => tools.add(tool));
    });
    return Array.from(tools).sort();
  }

  getUniqueToolsUsed(requests: RequestMetrics[]): string[] {
    const tools = new Set<string>();
    requests.forEach(req => {
      req.toolsUsed.forEach(tool => tools.add(tool));
    });
    return Array.from(tools).sort();
  }

  getUniqueTools(requests: RequestMetrics[]): string[] {
    return this.getUniqueToolsUsed(requests);
  }

  calculateAggregateMetrics(requests: RequestMetrics[]) {
    if (requests.length === 0) {
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        avgDuration: 0,
        totalDuration: 0,
        errorCount: 0,
        errorRate: 0,
        streamingCount: 0,
        streamingRate: 0,
        totalCost: null as number | null
      };
    }

    const totalRequests = requests.length;
    const totalTokens = requests.reduce((sum, req) => sum + req.totalTokens, 0);
    const totalInputTokens = requests.reduce((sum, req) => sum + req.inputTokens, 0);
    const totalOutputTokens = requests.reduce((sum, req) => sum + req.outputTokens, 0);
    const totalDuration = requests.reduce((sum, req) => sum + req.duration, 0);
    const avgDuration = totalDuration / totalRequests;
    const errorCount = requests.filter(req => req.hasError).length;
    const errorRate = errorCount / totalRequests;
    const streamingCount = requests.filter(req => req.isStreaming).length;
    const streamingRate = streamingCount / totalRequests;

    // Calculate total cost
    let totalCost: number | null = 0;
    for (const req of requests) {
      if (req.cost === null) {
        // If any request has unknown pricing, set total to null
        totalCost = null;
        break;
      }
      totalCost += req.cost;
    }

    return {
      totalRequests,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      avgDuration,
      totalDuration,
      errorCount,
      errorRate,
      streamingCount,
      streamingRate,
      totalCost
    };
  }
}

export const requestAnalyzerService = new RequestAnalyzerService();