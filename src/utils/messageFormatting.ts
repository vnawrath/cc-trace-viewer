/**
 * Utilities for extracting and formatting message content from Claude API messages
 */

// Types for message content
export type MessageContent = string | Array<{type: string; text?: string; thinking?: string; name?: string; [key: string]: unknown}>;

export interface Message {
  role: "user" | "assistant";
  content: MessageContent;
}

export interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Extract text content from a user or assistant message
 * Handles both string and array content types
 */
export function extractTextFromMessage(content: MessageContent): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(block => block.type === 'text' && block.text)
      .map(block => block.text)
      .join(' ');
  }

  return '';
}

/**
 * Extract text content from a message parameter (used in requests)
 * MessageParam can be simpler than full Message type
 */
export function extractTextFromMessageParam(message: Message): string {
  return extractTextFromMessage(message.content);
}

/**
 * Check if a message contains thinking content
 */
export function hasThinkingContent(content: MessageContent): boolean {
  if (typeof content === 'string') {
    return false;
  }

  if (Array.isArray(content)) {
    return content.some(block => block.type === 'thinking' && block.thinking);
  }

  return false;
}

/**
 * Get tools used from a message content array
 * Returns array of unique tool names
 */
export function getToolsUsed(content: MessageContent): string[] {
  if (typeof content === 'string') {
    return [];
  }

  if (Array.isArray(content)) {
    const toolNames = content
      .filter(block => block.type === 'tool_use' && block.name)
      .map(block => block.name as string);

    // Return unique tool names
    return Array.from(new Set(toolNames));
  }

  return [];
}

/**
 * Get the last user message from a message history array
 */
export function getLastUserMessage(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return '';

  const lastUserMsg = userMessages[userMessages.length - 1];
  return extractTextFromMessage(lastUserMsg.content);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
