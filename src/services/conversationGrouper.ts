import type { ClaudeTraceEntry, ConversationThreadGroup } from '../types/trace';

// MessageParam type matching Anthropic API structure
interface MessageParam {
  role: "user" | "assistant";
  content: string | Array<{type: string; text?: string; [key: string]: unknown}>;
}

/**
 * Service for grouping conversation threads based on system prompt, model, and first user message
 * Phase 2: Conversation Grouping Logic
 */
export class ConversationGrouperService {
  /**
   * Group conversations by system prompt + model + normalized first user message
   */
  groupConversations(requests: ClaudeTraceEntry[]): Map<string, ConversationThreadGroup> {
    // Group requests by conversation key, with their global indices
    const conversationMap = new Map<string, Array<{entry: ClaudeTraceEntry, globalIndex: number}>>();

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const messages = request.request.body.messages;
      if (!messages || messages.length === 0) {
        continue;
      }

      // Extract system prompt
      const systemPrompt = this.extractSystemPrompt(request);

      // Extract model
      const model = request.request.body.model;

      // Extract first user message as MessageParam (preserving structure)
      const firstUserMessage = this.extractFirstUserMessageParam(request);
      if (!firstUserMessage) {
        continue;
      }

      // Normalize the MessageParam (preserves structure)
      const normalizedFirstMessage = this.normalizeMessageForGrouping(firstUserMessage);

      // Create conversation key from normalized MessageParam
      const conversationKey = JSON.stringify({
        system: systemPrompt,
        model,
        firstMessage: normalizedFirstMessage
      });

      // Generate hash as groupId
      const groupId = this.hashString(conversationKey);

      if (!conversationMap.has(groupId)) {
        conversationMap.set(groupId, []);
      }
      conversationMap.get(groupId)!.push({ entry: request, globalIndex: i });
    }

    // Convert to ConversationThreadGroup objects with sequential indices
    const groups = new Map<string, ConversationThreadGroup>();
    let groupIndex = 0;

    for (const [groupId, groupRequests] of conversationMap) {
      // Find the "final pair" - the request with the longest message array
      const finalRequest = groupRequests.reduce((longest, current) => {
        const currentMessages = current.entry.request.body.messages || [];
        const longestMessages = longest.entry.request.body.messages || [];
        return currentMessages.length > longestMessages.length ? current : longest;
      }, groupRequests[0]);

      // Check single-turn on the final request (not the first)
      const finalMessages = finalRequest.entry.request.body.messages;
      const isSingleTurn = finalMessages.length <= 2;

      // Generate request IDs using global indices
      const requestIds = groupRequests.map(req => `${req.entry.request.timestamp}-${req.globalIndex}`);

      // Find the final request ID
      const finalRequestId = `${finalRequest.entry.request.timestamp}-${finalRequest.globalIndex}`;

      const group: ConversationThreadGroup = {
        groupId,
        groupIndex: groupIndex++,
        requestIds,
        finalRequestId,
        isSingleTurn,
        systemPrompt: this.extractSystemPrompt(finalRequest.entry),
        model: finalRequest.entry.request.body.model,
        firstUserMessage: this.extractFirstUserMessage(finalRequest.entry),
        color: this.generateColorFromHash(groupId)
      };

      groups.set(groupId, group);
    }

    return groups;
  }

  /**
   * Extract system prompt from request
   */
  private extractSystemPrompt(entry: ClaudeTraceEntry): string {
    const system = entry.request.body.system;
    if (!system || system.length === 0) return '';

    return system.map(s => s.text).join('\n');
  }

  /**
   * Extract first user message as MessageParam (preserving structure)
   */
  private extractFirstUserMessageParam(entry: ClaudeTraceEntry): MessageParam | null {
    const messages = entry.request.body.messages;
    const firstUserMessage = messages.find(msg => msg.role === 'user');

    if (!firstUserMessage) return null;

    return {
      role: firstUserMessage.role,
      content: firstUserMessage.content
    };
  }

  /**
   * Extract first user message from request (as string for display)
   */
  private extractFirstUserMessage(entry: ClaudeTraceEntry): string {
    const messages = entry.request.body.messages;
    const firstUserMessage = messages.find(msg => msg.role === 'user');

    if (!firstUserMessage) return '';

    if (typeof firstUserMessage.content === 'string') {
      return firstUserMessage.content;
    }

    if (Array.isArray(firstUserMessage.content)) {
      const textBlocks = firstUserMessage.content
        .filter(block => block.type === 'text' && 'text' in block)
        .map(block => 'text' in block ? String(block.text) : '');
      return textBlocks.join('\n');
    }

    return '';
  }

  /**
   * Normalize MessageParam for grouping (preserves structure, normalizes text content)
   * Matches claude-trace implementation
   */
  private normalizeMessageForGrouping(message: MessageParam): MessageParam {
    if (!message || !message.content) return message;

    let normalizedContent: string | Array<{type: string; text?: string; [key: string]: unknown}>;

    if (Array.isArray(message.content)) {
      normalizedContent = message.content.map((block) => {
        if (block.type === "text" && "text" in block) {
          let text = String(block.text);

          // Normalize timestamps
          text = text.replace(/Generated \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, "Generated [TIMESTAMP]");

          // Normalize file paths
          text = text.replace(/The user opened the file [^\s]+ in the IDE\./g, "The user opened file in IDE.");

          // Normalize system reminders
          text = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "[SYSTEM-REMINDER]");

          return { ...block, type: "text", text: text };
        }
        return block;
      });
    } else {
      normalizedContent = message.content;
    }

    return {
      role: message.role,
      content: normalizedContent,
    };
  }

  /**
   * Normalize message content by stripping dynamic patterns (legacy method for testing)
   * Public for testing purposes
   */
  normalizeMessage(content: string): string {
    if (!content) return '';

    let normalized = content;

    // Strip timestamps: YYYY-MM-DD HH:MM:SS → [TIMESTAMP]
    normalized = normalized.replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]');
    normalized = normalized.replace(/Generated \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, 'Generated [TIMESTAMP]');

    // Strip URLs FIRST (before file paths, since URLs might contain dots)
    normalized = normalized.replace(/https?:\/\/\S+/g, '[URL]');

    // Strip file paths - match common path patterns (must start with /)
    normalized = normalized.replace(/\/[\w\-./]+\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|h|txt|md|json|yaml|yml)/g, '[FILE]');
    normalized = normalized.replace(/The user opened the file [^\s]+ in the IDE\./g, 'The user opened file in IDE.');

    // Strip system reminders
    normalized = normalized.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '[SYSTEM-REMINDER]');

    // Normalize whitespace
    normalized = normalized.trim();
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized;
  }

  /**
   * Generate deterministic hash from string
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate deterministic HSL color from hash
   */
  generateColorFromHash(groupId: string): string {
    // Generate a simple hash number from the groupId
    let hash = 0;
    for (let i = 0; i < groupId.length; i++) {
      hash = ((hash << 5) - hash) + groupId.charCodeAt(i);
      hash = hash & hash;
    }

    // Convert to hue (0-360 degrees)
    const hue = Math.abs(hash) % 360;

    // Fixed saturation and lightness for consistency
    return `hsl(${hue}, 70%, 50%)`;
  }
}

export const conversationGrouperService = new ConversationGrouperService();
