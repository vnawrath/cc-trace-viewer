import type { ClaudeTraceEntry, SessionData, SessionMetadata } from '../types/trace';

export class TraceParserService {
  parseJsonLine(line: string): ClaudeTraceEntry | null {
    try {
      const trimmed = line.trim();
      if (!trimmed) {
        return null;
      }

      const parsed = JSON.parse(trimmed) as ClaudeTraceEntry;

      if (!this.isValidTraceEntry(parsed)) {
        console.warn('Invalid trace entry:', parsed);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('Failed to parse JSON line:', line, error);
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

    for (const line of lines) {
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

        buffer = lines.pop() || '';

        for (const line of lines) {
          const entry = this.parseJsonLine(line);
          if (entry) {
            entries.push(entry);
          }
        }
      }

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
    const modelsUsed = new Set<string>();
    const toolsUsed = new Set<string>();
    let hasErrors = false;

    for (const entry of entries) {
      modelsUsed.add(entry.request.body.model);

      if (entry.request.body.tools) {
        entry.request.body.tools.forEach(tool => toolsUsed.add(tool.name));
      }

      if (entry.response.body?.usage) {
        const usage = entry.response.body.usage;
        totalInputTokens += usage.input_tokens;
        totalOutputTokens += usage.output_tokens;
        totalTokens += usage.input_tokens + usage.output_tokens;
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

    for (const event of events) {
      if (event.type === 'content_block_delta' &&
          typeof event.delta === 'object' &&
          event.delta &&
          'text' in event.delta &&
          typeof (event.delta as { text: unknown }).text === 'string') {
        contentPieces.push((event.delta as { text: string }).text);
      } else if (event.type === 'message_stop') {
        finalMessage = event;
      }
    }

    return {
      type: 'message',
      content: [{ type: 'text', text: contentPieces.join('') }],
      ...finalMessage
    };
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