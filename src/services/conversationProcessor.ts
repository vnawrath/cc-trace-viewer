import type { ClaudeTraceEntry } from '../types/trace';
import { traceParserService } from './traceParser';

// Content block types
export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Array<{type: string; [key: string]: unknown}>;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

// Conversation message
export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: ContentBlock[];
  toolResults?: Map<string, ToolResultBlock>;
  hide?: boolean;
}

/**
 * Pairs tool_result blocks from user messages with tool_use blocks from assistant messages.
 * Returns a new array with toolResults maps populated and tool-only user messages hidden.
 */
export function pairToolResults(messages: ConversationMessage[]): ConversationMessage[] {
  // Create a mutable copy of messages
  const enhancedMessages = messages.map(msg => ({ ...msg }));

  // Track pending tool uses: { [tool_use_id]: messageIndex }
  const pendingToolUses = new Map<string, number>();

  for (let i = 0; i < enhancedMessages.length; i++) {
    const message = enhancedMessages[i];

    // If assistant message, track all tool_use blocks
    if (message.role === 'assistant') {
      for (const block of message.content) {
        if (block.type === 'tool_use') {
          pendingToolUses.set(block.id, i);
        }
      }
    }

    // If user message, process tool_result blocks
    if (message.role === 'user') {
      const toolResults: ToolResultBlock[] = [];
      const nonToolBlocks: ContentBlock[] = [];

      // Separate tool_result blocks from other content
      for (const block of message.content) {
        if (block.type === 'tool_result') {
          toolResults.push(block);
        } else {
          nonToolBlocks.push(block);
        }
      }

      // Pair each tool_result with its corresponding tool_use
      for (const toolResult of toolResults) {
        const assistantMsgIndex = pendingToolUses.get(toolResult.tool_use_id);
        if (assistantMsgIndex !== undefined) {
          const assistantMsg = enhancedMessages[assistantMsgIndex];

          // Initialize toolResults map if not present
          if (!assistantMsg.toolResults) {
            assistantMsg.toolResults = new Map();
          }

          // Add the pairing
          assistantMsg.toolResults.set(toolResult.tool_use_id, toolResult);

          // Remove from pending
          pendingToolUses.delete(toolResult.tool_use_id);
        }
      }

      // Hide user messages that contain ONLY tool_result blocks
      if (toolResults.length > 0 && nonToolBlocks.length === 0) {
        enhancedMessages[i].hide = true;
      }
    }
  }

  return enhancedMessages;
}

/**
 * Process a ClaudeTraceEntry into an array of ConversationMessages
 * with proper content block extraction and ordering
 */
export function processConversation(entry: ClaudeTraceEntry): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  // 1. Extract system message if present
  if (entry.request.body.system && entry.request.body.system.length > 0) {
    const systemContent: ContentBlock[] = entry.request.body.system.map(block => ({
      type: 'text' as const,
      text: block.text
    }));

    messages.push({
      role: 'system',
      content: systemContent
    });
  }

  // 2. Extract all messages from request
  if (entry.request.body.messages && entry.request.body.messages.length > 0) {
    for (const message of entry.request.body.messages) {
      const contentBlocks: ContentBlock[] = [];

      // Handle string content
      if (typeof message.content === 'string') {
        contentBlocks.push({
          type: 'text',
          text: message.content
        });
      }
      // Handle array of content blocks
      else if (Array.isArray(message.content)) {
        for (const block of message.content) {
          if (block.type === 'text' && 'text' in block) {
            contentBlocks.push({
              type: 'text',
              text: block.text as string
            });
          } else if (block.type === 'tool_use' && 'id' in block && 'name' in block && 'input' in block) {
            contentBlocks.push({
              type: 'tool_use',
              id: block.id as string,
              name: block.name as string,
              input: block.input as Record<string, unknown>
            });
          } else if (block.type === 'tool_result' && 'tool_use_id' in block && 'content' in block) {
            contentBlocks.push({
              type: 'tool_result',
              tool_use_id: block.tool_use_id as string,
              content: block.content as string | Array<{type: string; [key: string]: unknown}>,
              is_error: 'is_error' in block ? (block.is_error as boolean) : undefined
            });
          }
        }
      }

      // Only add message if it has content
      if (contentBlocks.length > 0) {
        messages.push({
          role: message.role,
          content: contentBlocks
        });
      }
    }
  }

  // 3. Append final assistant response from response body
  const finalContent: ContentBlock[] = [];

  // Handle non-streaming response
  if (entry.response.body?.content) {
    for (const block of entry.response.body.content) {
      if (block.type === 'text' && 'text' in block) {
        finalContent.push({
          type: 'text',
          text: block.text as string
        });
      } else if (block.type === 'tool_use' && 'id' in block && 'name' in block && 'input' in block) {
        finalContent.push({
          type: 'tool_use',
          id: block.id as string,
          name: block.name as string,
          input: block.input as Record<string, unknown>
        });
      }
    }
  }
  // Handle streaming response
  else if (entry.response.body_raw) {
    const reconstructed = traceParserService.reconstructResponseFromStream(entry.response.body_raw);
    if (reconstructed?.content && Array.isArray(reconstructed.content)) {
      for (const block of reconstructed.content) {
        if (typeof block === 'object' && block !== null && 'type' in block) {
          if (block.type === 'text' && 'text' in block) {
            finalContent.push({
              type: 'text',
              text: block.text as string
            });
          } else if (block.type === 'tool_use' && 'id' in block && 'name' in block && 'input' in block) {
            finalContent.push({
              type: 'tool_use',
              id: block.id as string,
              name: block.name as string,
              input: block.input as Record<string, unknown>
            });
          }
        }
      }
    }
  }

  // Add final assistant response if it has content
  if (finalContent.length > 0) {
    messages.push({
      role: 'assistant',
      content: finalContent
    });
  }

  // Pair tool results with tool uses
  return pairToolResults(messages);
}
