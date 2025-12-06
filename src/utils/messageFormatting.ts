/**
 * Utilities for extracting and formatting message content from Claude API messages
 */

// Types for message content
export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | ContentBlock[];
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock | {type: string; [key: string]: unknown};

export type MessageContent = string | ContentBlock[];

export interface Message {
  role: "user" | "assistant";
  content: MessageContent;
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
      .filter((block): block is TextBlock => block.type === 'text' && 'text' in block)
      .map(block => block.text)
      .join(' ');
  }

  return '';
}

/**
 * Strip system reminder tags from text content
 * Removes all <system-reminder>...</system-reminder> tags and their content
 */
export function stripSystemReminders(text: string): string {
  // Remove system reminder tags and their content using regex with dotall flag
  const cleaned = text.replace(/<system-reminder>.*?<\/system-reminder>/gs, '');

  // Clean up extra whitespace left behind
  return cleaned
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace 3+ newlines with 2
    .trim();
}

/**
 * Extract text content from a message and strip system reminders
 * Combines extractTextFromMessage with stripSystemReminders
 */
export function extractCleanTextFromMessage(content: MessageContent): string {
  const text = extractTextFromMessage(content);
  return stripSystemReminders(text);
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
      .filter((block): block is ToolUseBlock => block.type === 'tool_use' && 'name' in block)
      .map(block => block.name);

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

/**
 * Check if a message contains tool result blocks
 */
export function hasToolResults(content: MessageContent): boolean {
  if (typeof content === 'string') {
    return false;
  }

  if (Array.isArray(content)) {
    return content.some(block => block.type === 'tool_result');
  }

  return false;
}

/**
 * Extract content from tool_result blocks
 * Tool results can contain string or array content
 */
export function extractToolResultContent(content: MessageContent): string {
  if (typeof content === 'string') {
    return '';
  }

  if (!Array.isArray(content)) {
    return '';
  }

  const toolResultBlocks = content.filter(block => block.type === 'tool_result') as ToolResultBlock[];
  if (toolResultBlocks.length === 0) {
    return '';
  }

  // Extract text from all tool result blocks
  const texts: string[] = [];
  for (const block of toolResultBlocks) {
    if (typeof block.content === 'string') {
      texts.push(block.content);
    } else if (Array.isArray(block.content)) {
      // Extract text blocks from array content
      const textContent = block.content
        .filter(item => 'type' in item && item.type === 'text' && 'text' in item)
        .map(item => (item as TextBlock).text)
        .join(' ');
      if (textContent) {
        texts.push(textContent);
      }
    }
  }

  return texts.join(' ');
}

/**
 * Get tool result blocks from message content
 */
export function getToolResults(content: MessageContent): ToolResultBlock[] {
  if (typeof content === 'string') {
    return [];
  }

  if (Array.isArray(content)) {
    return content.filter(block => block.type === 'tool_result') as ToolResultBlock[];
  }

  return [];
}

/**
 * Format a tool call for display
 * Formats based on tool name and extracts key parameters
 */
export function formatToolCall(block: ToolUseBlock): string {
  const { name, input } = block;

  // Helper to truncate long strings
  const truncateParam = (str: string, maxLen: number = 50): string => {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + '...';
  };

  // Helper to get just the filename from a path
  const getFilename = (path: string): string => {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  };

  // Format based on tool type
  switch (name) {
    case 'Read':
      return input.file_path ? `Read(${getFilename(input.file_path)})` : 'Read';

    case 'Write':
      return input.file_path ? `Write(${getFilename(input.file_path)})` : 'Write';

    case 'Edit':
      return input.file_path ? `Edit(${getFilename(input.file_path)})` : 'Edit';

    case 'Bash':
      return input.command ? `Bash(${truncateParam(input.command, 40)})` : 'Bash';

    case 'Grep':
      return input.pattern && input.path
        ? `Grep(${truncateParam(input.pattern, 20)} in ${getFilename(input.path)})`
        : input.pattern
        ? `Grep(${truncateParam(input.pattern, 30)})`
        : 'Grep';

    case 'Glob':
      return input.pattern ? `Glob(${truncateParam(input.pattern, 30)})` : 'Glob';

    case 'Task':
      return input.description
        ? `Task(${truncateParam(input.description, 40)})`
        : input.prompt
        ? `Task(${truncateParam(input.prompt, 40)})`
        : 'Task';

    case 'WebFetch':
      return input.url ? `WebFetch(${truncateParam(input.url, 40)})` : 'WebFetch';

    case 'WebSearch':
      return input.query ? `WebSearch(${truncateParam(input.query, 40)})` : 'WebSearch';

    default:
      // For unknown tools, try to use the first key parameter
      const firstKey = Object.keys(input)[0];
      if (firstKey && typeof input[firstKey] === 'string') {
        return `${name}(${truncateParam(input[firstKey], 30)})`;
      }
      return name;
  }
}

/**
 * Get formatted tool calls from message content
 * Returns array of formatted strings like "Read(file.ts)", "Bash(npm install)"
 */
export function getFormattedToolCalls(content: MessageContent): string[] {
  if (typeof content === 'string') {
    return [];
  }

  if (Array.isArray(content)) {
    const toolBlocks = content.filter(block => block.type === 'tool_use') as ToolUseBlock[];
    return toolBlocks.map(block => formatToolCall(block));
  }

  return [];
}
