import type { ClaudeTraceEntry, ConversationThreadGroup } from '../types/trace';

/**
 * Service for grouping conversation threads based on system prompt, model, and first user message
 * Phase 2: Conversation Grouping Logic
 */
export class ConversationGrouperService {
  /**
   * Group conversations by system prompt + model + normalized first user message
   */
  groupConversations(requests: ClaudeTraceEntry[]): Map<string, ConversationThreadGroup> {
    // Group requests by conversation key
    const conversationMap = new Map<string, ClaudeTraceEntry[]>();

    for (const request of requests) {
      const messages = request.request.body.messages;
      if (!messages || messages.length === 0) continue;

      // Extract system prompt
      const systemPrompt = this.extractSystemPrompt(request);

      // Extract model
      const model = request.request.body.model;

      // Extract and normalize first user message
      const firstUserMessage = this.extractFirstUserMessage(request);
      const normalizedFirstMessage = this.normalizeMessage(firstUserMessage);

      // Create conversation key
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
      conversationMap.get(groupId)!.push(request);
    }

    // Convert to ConversationThreadGroup objects with sequential indices
    const groups = new Map<string, ConversationThreadGroup>();
    let groupIndex = 0;

    for (const [groupId, groupRequests] of conversationMap) {
      const firstRequest = groupRequests[0];
      const messages = firstRequest.request.body.messages;
      const isSingleTurn = messages.length <= 2;

      const group: ConversationThreadGroup = {
        groupId,
        groupIndex: groupIndex++,
        requestIds: groupRequests.map((req, idx) => `${req.request.timestamp}-${idx}`),
        isSingleTurn,
        systemPrompt: this.extractSystemPrompt(firstRequest),
        model: firstRequest.request.body.model,
        firstUserMessage: this.extractFirstUserMessage(firstRequest),
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
   * Extract first user message from request
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
   * Normalize message content by stripping dynamic patterns
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
