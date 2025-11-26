import type { ClaudeTraceEntry, SessionData, SessionMetadata, TokenUsage } from '../types/trace';

export class TraceParserService {
  parseJsonLine(line: string): ClaudeTraceEntry | null {
    try {
      const trimmed = line.trim();
      if (!trimmed) {
        return null;
      }

      // Skip lines that don't look like JSON (should start with '{' and end with '}')
      if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
        console.warn('Skipping non-JSON line:', trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : ''));
        return null;
      }

      // Check if the line is too long (potential truncation issue)
      if (trimmed.length > 1000000) { // 1MB limit
        console.warn('Skipping extremely long JSON line (potential truncation):', trimmed.length, 'characters');
        return null;
      }

      const parsed = JSON.parse(trimmed) as ClaudeTraceEntry;

      if (!this.isValidTraceEntry(parsed)) {
        console.warn('Invalid trace entry structure:', typeof parsed, Object.keys(parsed || {}));
        return null;
      }

      return parsed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const previewLength = 200;
      const linePreview = line.length > previewLength
        ? line.substring(0, previewLength) + '...'
        : line;

      console.warn(`Failed to parse JSON line (${errorMessage}):`, linePreview);
      return null;
    }
  }

  private isValidTraceEntry(entry: unknown): entry is ClaudeTraceEntry {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const obj = entry as Record<string, unknown>;

    return Boolean(
      obj.request &&
      typeof obj.request === 'object' &&
      obj.response &&
      typeof obj.response === 'object' &&
      typeof obj.logged_at === 'string' &&
      typeof (obj.request as Record<string, unknown>).timestamp === 'number' &&
      typeof (obj.response as Record<string, unknown>).timestamp === 'number'
    );
  }

  parseJsonlContent(content: string): ClaudeTraceEntry[] {
    const lines = content.split('\n');
    const entries: ClaudeTraceEntry[] = [];
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const entry = this.parseJsonLine(line);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  async parseJsonlStream(stream: ReadableStream<string>): Promise<ClaudeTraceEntry[]> {
    const reader = stream.getReader();
    const entries: ClaudeTraceEntry[] = [];
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += value;
        const lines = buffer.split('\n');

        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const entry = this.parseJsonLine(line);
          if (entry) {
            entries.push(entry);
          }
        }
      }

      // Process any remaining content in buffer
      if (buffer.trim()) {
        const entry = this.parseJsonLine(buffer);
        if (entry) {
          entries.push(entry);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return entries;
  }

  calculateSessionMetadata(entries: ClaudeTraceEntry[]): SessionMetadata {
    if (entries.length === 0) {
      return {
        userId: '',
        requestCount: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheCreation5mTokens: 0,
        totalCacheCreation1hTokens: 0,
        duration: 0,
        startTime: 0,
        endTime: 0,
        modelsUsed: new Set(),
        toolsUsed: new Set(),
        hasErrors: false
      };
    }

    const sortedEntries = [...entries].sort((a, b) => a.request.timestamp - b.request.timestamp);
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];

    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheCreationTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheCreation5mTokens = 0;
    let totalCacheCreation1hTokens = 0;
    const modelsUsed = new Set<string>();
    const toolsUsed = new Set<string>();
    let hasErrors = false;

    for (const entry of entries) {
      modelsUsed.add(entry.request.body.model);

      if (entry.request.body.tools) {
        entry.request.body.tools.forEach(tool => toolsUsed.add(tool.name));
      }

      let usage: TokenUsage | Record<string, unknown> | null = null;

      if (entry.response.body?.usage) {
        usage = entry.response.body.usage;
      } else if (entry.response.body_raw) {
        const reconstructed = this.reconstructResponseFromStream(entry.response.body_raw);
        if (reconstructed?.usage) {
          usage = reconstructed.usage as Record<string, unknown>;
        }
      }

      if (usage) {
        const inputTokens = typeof usage.input_tokens === 'number' ? usage.input_tokens : 0;
        const outputTokens = typeof usage.output_tokens === 'number' ? usage.output_tokens : 0;
        const cacheCreationTokens = typeof usage.cache_creation_input_tokens === 'number' ? usage.cache_creation_input_tokens : 0;
        const cacheReadTokens = typeof usage.cache_read_input_tokens === 'number' ? usage.cache_read_input_tokens : 0;

        totalInputTokens += inputTokens;
        totalCacheCreationTokens += cacheCreationTokens;
        totalCacheReadTokens += cacheReadTokens;
        totalOutputTokens += outputTokens;

        if (usage.cache_creation && typeof usage.cache_creation === 'object') {
          const cacheCreation = usage.cache_creation as Record<string, unknown>;
          const cache5m = typeof cacheCreation.ephemeral_5m_input_tokens === 'number' ? cacheCreation.ephemeral_5m_input_tokens : 0;
          const cache1h = typeof cacheCreation.ephemeral_1h_input_tokens === 'number' ? cacheCreation.ephemeral_1h_input_tokens : 0;

          totalCacheCreation5mTokens += cache5m;
          totalCacheCreation1hTokens += cache1h;

          totalTokens += inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens + cache5m + cache1h;
        } else {
          totalTokens += inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens;
        }
      }

      if (entry.response.status_code >= 400) {
        hasErrors = true;
      }
    }

    return {
      userId: firstEntry.request.body.metadata.user_id,
      requestCount: entries.length,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalCacheCreationTokens,
      totalCacheReadTokens,
      totalCacheCreation5mTokens,
      totalCacheCreation1hTokens,
      duration: lastEntry.response.timestamp - firstEntry.request.timestamp,
      startTime: firstEntry.request.timestamp,
      endTime: lastEntry.response.timestamp,
      modelsUsed,
      toolsUsed,
      hasErrors
    };
  }

  extractSessionId(userId: string): string | null {
    const sessionMatch = userId.match(/session_([a-f0-9-]+)/);
    return sessionMatch ? sessionMatch[1] : null;
  }

  createSessionData(entries: ClaudeTraceEntry[], filename: string): SessionData {
    const metadata = this.calculateSessionMetadata(entries);
    const sessionId = this.extractSessionId(metadata.userId) || filename;

    return {
      sessionId,
      userId: metadata.userId,
      filename,
      requests: entries,
      totalTokensUsed: metadata.totalTokens,
      totalInputTokens: metadata.totalInputTokens,
      totalOutputTokens: metadata.totalOutputTokens,
      totalCacheCreationTokens: metadata.totalCacheCreationTokens,
      totalCacheReadTokens: metadata.totalCacheReadTokens,
      totalCacheCreation5mTokens: metadata.totalCacheCreation5mTokens,
      totalCacheCreation1hTokens: metadata.totalCacheCreation1hTokens,
      totalRequests: metadata.requestCount,
      duration: metadata.duration,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      modelsUsed: Array.from(metadata.modelsUsed),
      toolsUsed: Array.from(metadata.toolsUsed),
      hasErrors: metadata.hasErrors
    };
  }

  async parseSessionFile(content: string, filename: string): Promise<SessionData> {
    const entries = this.parseJsonlContent(content);
    return this.createSessionData(entries, filename);
  }

  async parseSessionStream(stream: ReadableStream<string>, filename: string): Promise<SessionData> {
    const entries = await this.parseJsonlStream(stream);
    return this.createSessionData(entries, filename);
  }

  parseStreamingResponse(bodyRaw: string): Array<Record<string, unknown>> {
    const events: Array<Record<string, unknown>> = [];
    const lines = bodyRaw.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);

        if (data === '[DONE]') {
          break;
        }

        try {
          const parsed = JSON.parse(data);
          events.push(parsed);
        } catch (error) {
          console.warn('Failed to parse SSE data:', data, error);
        }
      }
    }

    return events;
  }

  reconstructResponseFromStream(bodyRaw: string): Record<string, unknown> | null {
    const events = this.parseStreamingResponse(bodyRaw);

    if (events.length === 0) {
      return null;
    }

    const lastEvent = events[events.length - 1];

    if (lastEvent && lastEvent.type === 'message') {
      return lastEvent;
    }

    const contentPieces: string[] = [];
    let finalMessage: Record<string, unknown> | null = null;
    let usage: Record<string, unknown> | null = null;
    let messageStart: Record<string, unknown> | null = null;

    for (const event of events) {
      if (event.type === 'message_start' &&
          typeof event.message === 'object' &&
          event.message) {
        messageStart = event.message as Record<string, unknown>;
      } else if (event.type === 'content_block_delta' &&
          typeof event.delta === 'object' &&
          event.delta &&
          'text' in event.delta &&
          typeof (event.delta as { text: unknown }).text === 'string') {
        contentPieces.push((event.delta as { text: string }).text);
      } else if (event.type === 'message_delta' &&
          typeof event.delta === 'object' &&
          event.delta &&
          'stop_reason' in event.delta) {
        finalMessage = event.delta as Record<string, unknown>;
        if (typeof event.usage === 'object' && event.usage) {
          usage = event.usage as Record<string, unknown>;
        }
      } else if (event.type === 'message_stop') {
        if (!finalMessage) {
          finalMessage = {};
        }
      }
    }

    const reconstructedMessage: Record<string, unknown> = {
      type: 'message',
      content: [{ type: 'text', text: contentPieces.join('') }],
      ...finalMessage
    };

    if (messageStart) {
      if (messageStart.model) reconstructedMessage.model = messageStart.model;
      if (messageStart.id) reconstructedMessage.id = messageStart.id;
      if (messageStart.role) reconstructedMessage.role = messageStart.role;
    }

    if (usage) {
      reconstructedMessage.usage = usage;
    }

    return reconstructedMessage;
  }

  getRequestDuration(entry: ClaudeTraceEntry): number {
    return entry.response.timestamp - entry.request.timestamp;
  }

  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }

    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  formatTokenCount(tokens: number): string {
    if (tokens < 1000) {
      return tokens.toString();
    }

    if (tokens < 1000000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }

    return `${(tokens / 1000000).toFixed(1)}M`;
  }
}

export const traceParserService = new TraceParserService();