import type {
  ClaudeTraceEntry,
  SessionData,
  SessionMetadata,
  TokenUsage,
  TraceResponse,
  TraceRequest,
  ConversationGroup,
  ConversationMetadata,
} from "../types/trace";

export class TraceParserService {
  parseJsonLine(line: string): ClaudeTraceEntry | null {
    try {
      const trimmed = line.trim();
      if (!trimmed) {
        return null;
      }

      // Skip lines that don't look like JSON (should start with '{' and end with '}')
      if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
        console.warn(
          "Skipping non-JSON line:",
          trimmed.substring(0, 100) + (trimmed.length > 100 ? "..." : "")
        );
        return null;
      }

      // Warn about very large lines but still attempt to parse them
      // Large lines are common in trace files with big responses or tool outputs
      if (trimmed.length > 1000000) {
        const sizeMB = (trimmed.length / 1024 / 1024).toFixed(2);
        console.info(
          `Parsing large JSON line: ${sizeMB}MB (${trimmed.length.toLocaleString()} characters)`
        );
      }

      // Parse with explicit error handling for large JSON
      const parsed = JSON.parse(trimmed) as ClaudeTraceEntry;

      if (!this.isValidTraceEntry(parsed)) {
        console.warn(
          "Invalid trace entry structure:",
          typeof parsed,
          Object.keys(parsed || {})
        );
        return null;
      }

      return parsed;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const previewLength = 200;
      const linePreview =
        line.length > previewLength
          ? line.substring(0, previewLength) + "..."
          : line;

      // Check if it's an out-of-memory error
      if (errorMessage.includes("memory") || errorMessage.includes("heap")) {
        console.error(
          `Out of memory parsing JSON line (${(
            line.length /
            1024 /
            1024
          ).toFixed(2)}MB). This line is too large for the browser to handle.`
        );
      } else {
        console.warn(
          `Failed to parse JSON line (${errorMessage}):`,
          linePreview
        );
      }
      return null;
    }
  }

  private isValidTraceEntry(entry: unknown): entry is ClaudeTraceEntry {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const obj = entry as Record<string, unknown>;

    // Basic structure check
    if (
      !obj.request ||
      typeof obj.request !== "object" ||
      !obj.response ||
      typeof obj.response !== "object" ||
      typeof obj.logged_at !== "string"
    ) {
      return false;
    }

    const request = obj.request as Record<string, unknown>;
    const response = obj.response as Record<string, unknown>;

    // Check for required timestamps
    if (
      typeof request.timestamp !== "number" ||
      typeof response.timestamp !== "number"
    ) {
      console.warn(
        "Trace entry missing timestamps:",
        "request.timestamp=" +
          typeof request.timestamp +
          ", response.timestamp=" +
          typeof response.timestamp
      );
      return false;
    }

    // Check for required body and metadata
    if (
      !request.body ||
      typeof request.body !== "object"
    ) {
      console.warn("Trace entry missing request.body");
      return false;
    }

    const body = request.body as Record<string, unknown>;
    if (!body.metadata || typeof body.metadata !== "object") {
      console.warn("Trace entry missing request.body.metadata");
      return false;
    }

    const metadata = body.metadata as Record<string, unknown>;
    if (typeof metadata.user_id !== "string") {
      console.warn("Trace entry missing request.body.metadata.user_id");
      return false;
    }

    return true;
  }

  parseJsonlContent(content: string): ClaudeTraceEntry[] {
    const lines = content.split("\n");
    const entries: ClaudeTraceEntry[] = [];
    let lineNumber = 0;
    const totalLines = lines.length;
    const logInterval = Math.max(1, Math.floor(totalLines / 10)); // Log every 10%

    console.log(
      `Parsing ${totalLines.toLocaleString()} lines from JSONL content...`
    );

    for (const line of lines) {
      lineNumber++;

      // Progress logging for large files
      if (totalLines > 100 && lineNumber % logInterval === 0) {
        const progress = Math.round((lineNumber / totalLines) * 100);
        console.log(
          `Parsing progress: ${progress}% (${lineNumber.toLocaleString()}/${totalLines.toLocaleString()} lines, ${
            entries.length
          } valid entries)`
        );
      }

      const entry = this.parseJsonLine(line);
      if (entry) {
        entries.push(entry);
      }
    }

    console.log(`Parsing complete: ${entries.length} valid entries found`);
    return entries;
  }

  async parseJsonlStream(
    stream: ReadableStream<string>
  ): Promise<ClaudeTraceEntry[]> {
    const reader = stream.getReader();
    const entries: ClaudeTraceEntry[] = [];
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");

        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || "";

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
        userId: "",
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
        toolsAvailable: new Set(),
        toolsUsed: new Set(),
        hasErrors: false,
      };
    }

    const sortedEntries = [...entries].sort(
      (a, b) => a.request.timestamp - b.request.timestamp
    );
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
    const toolsAvailable = new Set<string>();
    const toolsUsed = new Set<string>();
    let hasErrors = false;

    for (const entry of entries) {
      modelsUsed.add(entry.request.body.model);

      const availableTools = this.extractToolsAvailableFromRequest(
        entry.request
      );
      availableTools.forEach((tool) => toolsAvailable.add(tool));

      const usedTools = this.extractToolsUsedFromResponse(entry.response);
      usedTools.forEach((tool) => toolsUsed.add(tool));

      let usage: TokenUsage | Record<string, unknown> | null = null;

      if (entry.response.body?.usage) {
        usage = entry.response.body.usage;
      } else if (entry.response.body_raw) {
        const reconstructed = this.reconstructResponseFromStream(
          entry.response.body_raw
        );
        if (reconstructed?.usage) {
          usage = reconstructed.usage as Record<string, unknown>;
        }
      }

      if (usage) {
        const inputTokens =
          typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
        const outputTokens =
          typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
        const cacheCreationTokens =
          typeof usage.cache_creation_input_tokens === "number"
            ? usage.cache_creation_input_tokens
            : 0;
        const cacheReadTokens =
          typeof usage.cache_read_input_tokens === "number"
            ? usage.cache_read_input_tokens
            : 0;

        totalInputTokens += inputTokens;
        totalCacheCreationTokens += cacheCreationTokens;
        totalCacheReadTokens += cacheReadTokens;
        totalOutputTokens += outputTokens;

        if (usage.cache_creation && typeof usage.cache_creation === "object") {
          const cacheCreation = usage.cache_creation as Record<string, unknown>;
          const cache5m =
            typeof cacheCreation.ephemeral_5m_input_tokens === "number"
              ? cacheCreation.ephemeral_5m_input_tokens
              : 0;
          const cache1h =
            typeof cacheCreation.ephemeral_1h_input_tokens === "number"
              ? cacheCreation.ephemeral_1h_input_tokens
              : 0;

          totalCacheCreation5mTokens += cache5m;
          totalCacheCreation1hTokens += cache1h;

          totalTokens +=
            inputTokens +
            outputTokens +
            cacheCreationTokens +
            cacheReadTokens +
            cache5m +
            cache1h;
        } else {
          totalTokens +=
            inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens;
        }
      }

      if (entry.response.status_code >= 400) {
        hasErrors = true;
      }
    }

    // Detect conversations and get count (with Phase 2.5 enhanced filtering)
    // Step 1: Detect all conversations
    const allConversations = this.detectConversations(entries);

    // Step 2: Filter out short conversations (≤2 messages)
    const substantialConversations = this.filterShortConversations(allConversations);

    // Step 3: Detect compact conversations
    const withCompactDetection = this.detectCompactConversations(substantialConversations);

    // Step 4: Merge compact conversations with their parents
    const finalConversations = this.mergeCompactConversations(withCompactDetection);

    // Extract conversation metadata (count and preview)
    const conversationMetadata = this.extractConversationMetadata(finalConversations);

    // Safely extract user_id with fallback
    const userId =
      firstEntry.request.body?.metadata?.user_id || "unknown-user";

    return {
      userId,
      requestCount: entries.length,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalCacheCreationTokens,
      totalCacheReadTokens,
      totalCacheCreation5mTokens,
      totalCacheCreation1hTokens,
      // Convert duration from seconds to milliseconds for consistent formatting
      duration:
        (lastEntry.response.timestamp - firstEntry.request.timestamp) * 1000,
      // Keep timestamps in seconds for metadata (will be converted when creating SessionData)
      startTime: firstEntry.request.timestamp,
      endTime: lastEntry.response.timestamp,
      modelsUsed,
      toolsAvailable,
      toolsUsed,
      hasErrors,
      conversationCount: conversationMetadata.conversationCount,
      conversationPreview: conversationMetadata.longestConversation?.firstUserMessage,
    };
  }

  extractSessionId(userId: string): string | null {
    const sessionMatch = userId.match(/session_([a-f0-9-]+)/);
    return sessionMatch ? sessionMatch[1] : null;
  }

  createSessionData(
    entries: ClaudeTraceEntry[],
    filename: string
  ): SessionData {
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
      duration: metadata.duration, // Already converted to milliseconds in calculateSessionMetadata
      // Convert timestamps to milliseconds for consistent usage
      startTime: metadata.startTime * 1000,
      endTime: metadata.endTime * 1000,
      modelsUsed: Array.from(metadata.modelsUsed),
      toolsAvailable: Array.from(metadata.toolsAvailable),
      toolsUsed: Array.from(metadata.toolsUsed),
      hasErrors: metadata.hasErrors,
      conversationCount: metadata.conversationCount,
      conversationPreview: metadata.conversationPreview,
    };
  }

  async parseSessionFile(
    content: string,
    filename: string
  ): Promise<SessionData> {
    const entries = this.parseJsonlContent(content);
    return this.createSessionData(entries, filename);
  }

  async parseSessionStream(
    stream: ReadableStream<string>,
    filename: string
  ): Promise<SessionData> {
    const entries = await this.parseJsonlStream(stream);
    return this.createSessionData(entries, filename);
  }

  parseStreamingResponse(bodyRaw: string): Array<Record<string, unknown>> {
    const events: Array<Record<string, unknown>> = [];
    const lines = bodyRaw.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6);

        if (data === "[DONE]") {
          break;
        }

        try {
          const parsed = JSON.parse(data);
          events.push(parsed);
        } catch (error) {
          console.warn("Failed to parse SSE data:", data, error);
        }
      }
    }

    return events;
  }

  reconstructResponseFromStream(
    bodyRaw: string
  ): Record<string, unknown> | null {
    const events = this.parseStreamingResponse(bodyRaw);

    if (events.length === 0) {
      return null;
    }

    const lastEvent = events[events.length - 1];

    if (lastEvent && lastEvent.type === "message") {
      return lastEvent;
    }

    // Track all content blocks by their index
    const contentBlocks: Array<Record<string, unknown>> = [];
    let finalMessage: Record<string, unknown> | null = null;
    let usage: Record<string, unknown> | null = null;
    let messageStart: Record<string, unknown> | null = null;

    for (const event of events) {
      if (
        event.type === "message_start" &&
        typeof event.message === "object" &&
        event.message
      ) {
        messageStart = event.message as Record<string, unknown>;
      } else if (event.type === "content_block_start") {
        // Initialize a new content block at the specified index
        const index = typeof event.index === "number" ? event.index : -1;
        if (index >= 0 && event.content_block && typeof event.content_block === "object") {
          // Initialize block with type and initial data (id, name for tool_use)
          contentBlocks[index] = { ...event.content_block } as Record<string, unknown>;
        }
      } else if (event.type === "content_block_delta") {
        // Update the content block with delta
        const index = typeof event.index === "number" ? event.index : -1;
        if (index >= 0 && contentBlocks[index] && event.delta && typeof event.delta === "object") {
          const block = contentBlocks[index];
          const delta = event.delta as Record<string, unknown>;

          if (delta.type === "text_delta" && typeof delta.text === "string") {
            // Append text to text block
            if (block.type === "text") {
              block.text = (typeof block.text === "string" ? block.text : "") + delta.text;
            }
          } else if (delta.type === "input_json_delta" && typeof delta.partial_json === "string") {
            // Accumulate JSON string for tool_use blocks
            if (block.type === "tool_use") {
              block.input = (typeof block.input === "string" ? block.input : "") + delta.partial_json;
            }
          }
        }
      } else if (event.type === "content_block_stop") {
        // Finalize content block - parse JSON input if it's a tool_use block
        const index = typeof event.index === "number" ? event.index : -1;
        if (index >= 0 && contentBlocks[index]) {
          const block = contentBlocks[index];
          if (block.type === "tool_use" && typeof block.input === "string") {
            try {
              block.input = JSON.parse(block.input as string);
            } catch (e) {
              console.warn("Failed to parse tool input JSON:", block.input, e);
              // Keep as string if parsing fails
            }
          }
        }
      } else if (
        event.type === "message_delta" &&
        typeof event.delta === "object" &&
        event.delta &&
        "stop_reason" in event.delta
      ) {
        finalMessage = event.delta as Record<string, unknown>;
        if (typeof event.usage === "object" && event.usage) {
          usage = event.usage as Record<string, unknown>;
        }
      } else if (event.type === "message_stop") {
        if (!finalMessage) {
          finalMessage = {};
        }
      }
    }

    // Build final content array, filtering out null/undefined blocks
    const finalContent = contentBlocks.filter((block) => block != null);

    const reconstructedMessage: Record<string, unknown> = {
      type: "message",
      content: finalContent,
      ...finalMessage,
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
    // Convert from seconds to milliseconds for consistent formatting
    return (entry.response.timestamp - entry.request.timestamp) * 1000;
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

  extractToolsUsedFromResponse(response: TraceResponse): string[] {
    const toolsUsed = new Set<string>();

    if (response.body?.content) {
      for (const contentItem of response.body.content) {
        if (
          contentItem.type === "tool_use" &&
          "name" in contentItem &&
          typeof contentItem.name === "string"
        ) {
          toolsUsed.add(contentItem.name);
        }
      }
    } else if (response.body_raw) {
      const reconstructed = this.reconstructResponseFromStream(
        response.body_raw
      );
      if (reconstructed?.content && Array.isArray(reconstructed.content)) {
        for (const contentItem of reconstructed.content) {
          if (
            typeof contentItem === "object" &&
            contentItem &&
            "type" in contentItem &&
            contentItem.type === "tool_use" &&
            "name" in contentItem &&
            typeof contentItem.name === "string"
          ) {
            toolsUsed.add(contentItem.name);
          }
        }
      }

      // Also parse SSE events directly to catch tool calls in streaming responses
      const sseToolsUsed = this.extractToolsFromSSEStream(response.body_raw);
      sseToolsUsed.forEach((tool) => toolsUsed.add(tool));
    }

    return Array.from(toolsUsed);
  }

  extractToolsAvailableFromRequest(request: TraceRequest): string[] {
    return request.body.tools?.map((tool) => tool.name) || [];
  }

  extractToolsFromSSEStream(bodyRaw: string): string[] {
    const toolsUsed = new Set<string>();
    const lines = bodyRaw.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6);

        if (data === "[DONE]") {
          break;
        }

        try {
          const parsed = JSON.parse(data);

          if (
            parsed.type === "content_block_start" &&
            parsed.content_block?.type === "tool_use" &&
            typeof parsed.content_block.name === "string"
          ) {
            toolsUsed.add(parsed.content_block.name);
          }
        } catch (error) {
          console.warn("Failed to parse SSE data:", data, error);
          // Ignore parsing errors for individual SSE events
        }
      }
    }

    return Array.from(toolsUsed);
  }

  /**
   * Normalize message content for conversation grouping
   * Removes dynamic content like timestamps, file references, and system reminders
   */
  normalizeMessageForGrouping(content: string | Array<{type: string; [key: string]: unknown}>): string {
    let textContent = "";

    // Extract text from content blocks if it's an array
    if (Array.isArray(content)) {
      const textBlocks = content
        .filter(block => block.type === "text" && "text" in block)
        .map(block => block.text as string);
      textContent = textBlocks.join(" ");
    } else {
      textContent = content;
    }

    // Normalize dynamic content
    let normalized = textContent;

    // Replace timestamps: Generated YYYY-MM-DD HH:MM:SS → Generated [TIMESTAMP]
    normalized = normalized.replace(/Generated \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, "Generated [TIMESTAMP]");

    // Replace file references: The user opened the file X → The user opened file in IDE
    normalized = normalized.replace(/The user opened the file [^\s]+ in the IDE\./g, "The user opened file in IDE.");

    // Remove system reminders entirely
    normalized = normalized.replace(/<system-reminder>.*?<\/system-reminder>/gs, "[SYSTEM-REMINDER]");

    return normalized;
  }

  /**
   * Generate a hash from a string for conversation grouping
   */
  hashConversation(firstMessage: string, system: string | undefined, model: string): string {
    const conversationKey = JSON.stringify({
      firstMessage,
      system,
      model,
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < conversationKey.length; i++) {
      const char = conversationKey.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString();
  }

  /**
   * Detect and group conversations within a set of trace entries
   * Returns an array of conversation groups, each representing a unique conversation thread
   */
  detectConversations(entries: ClaudeTraceEntry[]): ConversationGroup[] {
    if (entries.length === 0) {
      return [];
    }

    // Map to store conversations by their hash
    const conversationMap = new Map<string, ConversationGroup>();

    for (const entry of entries) {
      const messages = entry.request.body.messages;

      // Skip entries with no messages
      if (!messages || messages.length === 0) {
        continue;
      }

      // Find the first user message
      const firstUserMessage = messages.find(msg => msg.role === "user");

      if (!firstUserMessage) {
        continue;
      }

      // Normalize the first user message for grouping
      const normalizedMessage = this.normalizeMessageForGrouping(firstUserMessage.content);

      // Extract system prompt (join all text blocks if array)
      let systemPrompt: string | undefined = undefined;
      if (entry.request.body.system) {
        systemPrompt = entry.request.body.system
          .map(block => block.text)
          .join(" ");
      }

      // Generate hash for this conversation
      const conversationId = this.hashConversation(
        normalizedMessage,
        systemPrompt,
        entry.request.body.model
      );

      // Add to or update conversation group
      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          requests: [],
          firstUserMessage: normalizedMessage,
          longestRequestIndex: 0,
          models: new Set(),
          totalMessages: 0,
        });
      }

      const conversation = conversationMap.get(conversationId)!;
      conversation.requests.push(entry);
      conversation.models.add(entry.request.body.model);

      // Track the longest request (most messages)
      const messageCount = messages.length;
      if (messageCount > conversation.totalMessages) {
        conversation.totalMessages = messageCount;
        conversation.longestRequestIndex = conversation.requests.length - 1;
      }

      // Initialize allPairs with all requests for potential merging
      if (!conversation.allPairs) {
        conversation.allPairs = [];
      }
      conversation.allPairs.push(entry);
    }

    return Array.from(conversationMap.values());
  }

  /**
   * Filter out short conversations (≤2 messages)
   * This removes background tasks, title generation, and single Q&A exchanges
   * that are not substantial multi-turn conversations
   */
  filterShortConversations(conversations: ConversationGroup[]): ConversationGroup[] {
    return conversations.filter(conversation => conversation.totalMessages > 2);
  }

  /**
   * Helper function to compare messages for similarity
   * Used to detect if a compact conversation is a continuation of another
   */
  private messagesRoughlyEqual(msg1: any, msg2: any): boolean {
    if (msg1.role !== msg2.role) return false;

    // Extract text content from both messages
    const getText = (content: string | Array<{type: string; [key: string]: unknown}>): string => {
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .filter(block => block.type === 'text' && 'text' in block)
          .map(block => block.text as string)
          .join(' ');
      }
      return '';
    };

    const text1 = getText(msg1.content);
    const text2 = getText(msg2.content);

    // Simple similarity check: normalize and compare length and first characters
    const normalize = (s: string) => s.trim().toLowerCase().substring(0, 100);
    return normalize(text1) === normalize(text2);
  }

  /**
   * Detect compact conversations - conversations where the full history was sent in a single API call
   * These need to be merged with their parent conversations to avoid double-counting
   */
  detectCompactConversations(conversations: ConversationGroup[]): ConversationGroup[] {
    if (conversations.length <= 1) return conversations;

    // Sort by first request timestamp to process chronologically
    const sortedConversations = [...conversations].sort((a, b) => {
      const aTime = a.requests[0]?.request.timestamp || 0;
      const bTime = b.requests[0]?.request.timestamp || 0;
      return aTime - bTime;
    });

    // Detect compact conversations
    for (let i = 0; i < sortedConversations.length; i++) {
      const currentConv = sortedConversations[i];

      // A compact conversation has only 1 API pair but >2 messages
      if (currentConv.requests.length === 1 && currentConv.totalMessages > 2) {
        // Try to find a parent conversation with exactly 2 fewer messages
        for (let j = 0; j < sortedConversations.length; j++) {
          if (j === i) continue;

          const otherConv = sortedConversations[j];

          // Check if other conversation has exactly 2 fewer messages
          if (otherConv.totalMessages === currentConv.totalMessages - 2) {
            // Get the messages from both conversations
            const currentMessages = currentConv.requests[0].request.body.messages;
            const longestRequest = otherConv.requests[otherConv.longestRequestIndex];
            const otherMessages = longestRequest.request.body.messages;

            // Compare messages (skip first as it's normalized, compare from index 1)
            let messagesMatch = true;
            const compareLength = Math.min(otherMessages.length, currentMessages.length);

            for (let k = 1; k < compareLength && k < otherMessages.length; k++) {
              if (!this.messagesRoughlyEqual(otherMessages[k], currentMessages[k])) {
                messagesMatch = false;
                break;
              }
            }

            if (messagesMatch) {
              // Mark this as a compact conversation
              currentConv.isCompact = true;
              currentConv.compactedFrom = otherConv.id;
              break;
            }
          }
        }

        // If no parent found, still mark as compact (orphaned compact conversation)
        if (!currentConv.isCompact) {
          currentConv.isCompact = true;
        }
      }
    }

    return sortedConversations;
  }

  /**
   * Merge compact conversations with their parent conversations
   * Returns a deduplicated list with compact conversations merged into their parents
   */
  mergeCompactConversations(conversations: ConversationGroup[]): ConversationGroup[] {
    const conversationMap = new Map<string, ConversationGroup>();
    const compactConversations: ConversationGroup[] = [];

    // First pass: separate compact and non-compact conversations
    for (const conv of conversations) {
      if (conv.isCompact && conv.compactedFrom) {
        compactConversations.push(conv);
      } else {
        conversationMap.set(conv.id, conv);
      }
    }

    // Second pass: merge compact conversations into their parents
    for (const compactConv of compactConversations) {
      const parent = conversationMap.get(compactConv.compactedFrom!);

      if (parent) {
        // Merge the compact conversation into the parent
        if (!parent.allPairs) {
          parent.allPairs = [...parent.requests];
        }

        // Add the compact conversation's requests to allPairs
        parent.allPairs.push(...compactConv.requests);

        // Update total messages to the maximum
        parent.totalMessages = Math.max(parent.totalMessages, compactConv.totalMessages);

        // Update longest request if needed
        if (compactConv.totalMessages > parent.requests[parent.longestRequestIndex].request.body.messages.length) {
          parent.longestRequestIndex = parent.requests.length;
          parent.requests.push(...compactConv.requests);
        }
      } else {
        // Parent not found, keep the orphaned compact conversation
        conversationMap.set(compactConv.id, compactConv);
      }
    }

    return Array.from(conversationMap.values());
  }

  /**
   * Extract conversation metadata from conversation groups
   * Returns metadata including count and preview of longest conversation
   */
  extractConversationMetadata(conversations: ConversationGroup[]): ConversationMetadata {
    if (conversations.length === 0) {
      return {
        conversationCount: 0,
        longestConversation: null,
      };
    }

    // Find the longest conversation overall
    let longestConversation = conversations[0];
    for (const conversation of conversations) {
      if (conversation.totalMessages > longestConversation.totalMessages) {
        longestConversation = conversation;
      }
    }

    return {
      conversationCount: conversations.length,
      longestConversation: {
        firstUserMessage: longestConversation.firstUserMessage.substring(0, 200),
        messageCount: longestConversation.totalMessages,
      },
    };
  }
}

export const traceParserService = new TraceParserService();
