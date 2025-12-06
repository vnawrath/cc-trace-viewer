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
 * Handles edge cases: unpaired tools, duplicate IDs, malformed data.
 */
export function pairToolResults(messages: ConversationMessage[]): ConversationMessage[] {
  // Create a mutable copy of messages
  const enhancedMessages = messages.map(msg => ({ ...msg }));

  // Track pending tool uses: { [tool_use_id]: messageIndex }
  const pendingToolUses = new Map<string, number>();
  const seenToolIds = new Set<string>();

  for (let i = 0; i < enhancedMessages.length; i++) {
    const message = enhancedMessages[i];

    // If assistant message, track all tool_use blocks
    if (message.role === 'assistant') {
      for (const block of message.content) {
        if (block.type === 'tool_use') {
          // Check for duplicate tool IDs (edge case)
          if (seenToolIds.has(block.id)) {
            console.warn(`conversationProcessor: Duplicate tool_use_id detected: ${block.id}`);
          }
          seenToolIds.add(block.id);
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
        } else {
          // Log unpaired tool results (edge case)
          console.warn(`conversationProcessor: tool_result with no matching tool_use: ${toolResult.tool_use_id}`);
        }
      }

      // Hide user messages that contain ONLY tool_result blocks
      if (toolResults.length > 0 && nonToolBlocks.length === 0) {
        enhancedMessages[i].hide = true;
      }
    }
  }

  // Log any unpaired tool uses (tools called but no result yet)
  if (pendingToolUses.size > 0) {
    console.info(`conversationProcessor: ${pendingToolUses.size} tool call(s) without results (may be incomplete conversation)`);
  }

  return enhancedMessages;
}

/**
 * Process a ClaudeTraceEntry into an array of ConversationMessages
 * with proper content block extraction and ordering.
 * Handles edge cases: missing response, malformed content, very large conversations.
 */
export function processConversation(entry: ClaudeTraceEntry): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  // Handle missing request body
  if (!entry.request?.body) {
    console.warn('conversationProcessor: Missing request body');
    return messages;
  }

  // 1. Extract system message if present
  if (entry.request.body.system && Array.isArray(entry.request.body.system) && entry.request.body.system.length > 0) {
    try {
      const systemContent: ContentBlock[] = entry.request.body.system
        .filter(block => block && typeof block === 'object' && 'text' in block)
        .map(block => ({
          type: 'text' as const,
          text: String(block.text || '')
        }));

      if (systemContent.length > 0) {
        messages.push({
          role: 'system',
          content: systemContent
        });
      }
    } catch (error) {
      console.error('conversationProcessor: Error parsing system message:', error);
    }
  }

  // 2. Extract all messages from request
  if (entry.request.body.messages && Array.isArray(entry.request.body.messages) && entry.request.body.messages.length > 0) {
    try {
      for (const message of entry.request.body.messages) {
        // Validate message structure
        if (!message || typeof message !== 'object' || !message.role) {
          console.warn('conversationProcessor: Skipping malformed message', message);
          continue;
        }

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
            try {
              if (!block || typeof block !== 'object' || !block.type) {
                continue;
              }

              if (block.type === 'text' && 'text' in block) {
                contentBlocks.push({
                  type: 'text',
                  text: String(block.text || '')
                });
              } else if (block.type === 'tool_use' && 'id' in block && 'name' in block && 'input' in block) {
                contentBlocks.push({
                  type: 'tool_use',
                  id: String(block.id),
                  name: String(block.name),
                  input: (typeof block.input === 'object' && block.input !== null) ? block.input as Record<string, unknown> : {}
                });
              } else if (block.type === 'tool_result' && 'tool_use_id' in block && 'content' in block) {
                contentBlocks.push({
                  type: 'tool_result',
                  tool_use_id: String(block.tool_use_id),
                  content: block.content as string | Array<{type: string; [key: string]: unknown}>,
                  is_error: 'is_error' in block ? Boolean(block.is_error) : undefined
                });
              }
            } catch (blockError) {
              console.error('conversationProcessor: Error parsing content block:', blockError);
            }
          }
        }

        // Only add message if it has content and valid role
        if (contentBlocks.length > 0 && (message.role === 'user' || message.role === 'assistant')) {
          messages.push({
            role: message.role,
            content: contentBlocks
          });
        }
      }
    } catch (error) {
      console.error('conversationProcessor: Error parsing messages:', error);
    }
  }

  // 3. Append final assistant response from response body
  const finalContent: ContentBlock[] = [];

  // Handle missing response (failed request)
  if (!entry.response) {
    console.warn('conversationProcessor: Missing response body (request may have failed)');
    return pairToolResults(messages);
  }

  try {
    // Handle non-streaming response
    if (entry.response.body && 'content' in entry.response.body && entry.response.body.content && Array.isArray(entry.response.body.content)) {
      for (const block of entry.response.body.content) {
        try {
          if (!block || typeof block !== 'object' || !block.type) {
            continue;
          }

          if (block.type === 'text' && 'text' in block) {
            finalContent.push({
              type: 'text',
              text: String(block.text || '')
            });
          } else if (block.type === 'tool_use' && 'id' in block && 'name' in block && 'input' in block) {
            finalContent.push({
              type: 'tool_use',
              id: String(block.id),
              name: String(block.name),
              input: (typeof block.input === 'object' && block.input !== null) ? block.input as Record<string, unknown> : {}
            });
          }
        } catch (blockError) {
          console.error('conversationProcessor: Error parsing response content block:', blockError);
        }
      }
    }
    // Handle streaming response
    else if (entry.response.body_raw) {
      try {
        const reconstructed = traceParserService.reconstructResponseFromStream(entry.response.body_raw);
        if (reconstructed?.content && Array.isArray(reconstructed.content)) {
          for (const block of reconstructed.content) {
            try {
              if (typeof block === 'object' && block !== null && 'type' in block) {
                if (block.type === 'text' && 'text' in block) {
                  finalContent.push({
                    type: 'text',
                    text: String(block.text || '')
                  });
                } else if (block.type === 'tool_use' && 'id' in block && 'name' in block && 'input' in block) {
                  finalContent.push({
                    type: 'tool_use',
                    id: String(block.id),
                    name: String(block.name),
                    input: (typeof block.input === 'object' && block.input !== null) ? block.input as Record<string, unknown> : {}
                  });
                }
              }
            } catch (blockError) {
              console.error('conversationProcessor: Error parsing reconstructed block:', blockError);
            }
          }
        }
      } catch (streamError) {
        console.error('conversationProcessor: Error reconstructing stream:', streamError);
      }
    }
  } catch (error) {
    console.error('conversationProcessor: Error parsing response:', error);
  }

  // Add final assistant response if it has content
  if (finalContent.length > 0) {
    messages.push({
      role: 'assistant',
      content: finalContent
    });
  }

  // Pair tool results with tool uses
  try {
    return pairToolResults(messages);
  } catch (error) {
    console.error('conversationProcessor: Error pairing tool results:', error);
    return messages;
  }
}
