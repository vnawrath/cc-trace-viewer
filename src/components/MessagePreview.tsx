/**
 * MessagePreview components for displaying user and assistant message previews
 * in the request table
 */

import {
  extractTextFromMessage,
  extractCleanTextFromMessage,
  hasThinkingContent,
  getToolsUsed,
  truncate,
  hasToolResults,
  extractToolResultContent,
  getFormattedToolCalls,
  type Message,
  type ContentBlock
} from '../utils/messageFormatting';

interface MessagePreviewProps {
  content: string;
  maxLength?: number;
  showThinking?: boolean;
  showTools?: boolean;
  toolsUsed?: string[];
  hasThinking?: boolean;
  className?: string;
}

/**
 * Base MessagePreview component for displaying message content with metadata
 */
export function MessagePreview({
  content,
  maxLength = 200,
  showThinking = false,
  showTools = false,
  toolsUsed = [],
  hasThinking = false,
  className = ''
}: MessagePreviewProps) {
  const truncatedContent = truncate(content, maxLength);
  const hasContent = content.length > 0;

  // Build prefix badges for thinking and tools
  const badges: React.ReactNode[] = [];

  if (showThinking && hasThinking) {
    badges.push(
      <span key="thinking" className="text-purple-400 font-medium">
        [Thinking]
      </span>
    );
  }

  if (showTools && toolsUsed.length > 0) {
    badges.push(
      <span key="tools" className="text-amber-400 font-medium">
        [🔧 {toolsUsed.join(', ')}]
      </span>
    );
  }

  return (
    <div className={`truncate ${className}`} title={content}>
      {badges.length > 0 && (
        <>
          {badges.map((badge, i) => (
            <span key={i}>{badge} </span>
          ))}
        </>
      )}
      {hasContent && <span>{truncatedContent}</span>}
      {!hasContent && <span className="text-gray-600">—</span>}
    </div>
  );
}

interface UserMessagePreviewProps {
  messages: Message[];
  maxLength?: number;
  className?: string;
}

/**
 * UserMessagePreview component for displaying the last user message
 */
export function UserMessagePreview({
  messages,
  maxLength = 150,
  className = 'text-xs text-gray-300 italic'
}: UserMessagePreviewProps) {
  // Extract last user message
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;

  if (!lastUserMsg) {
    return <span className="text-[10px] text-gray-600">—</span>;
  }

  // Try to extract text content first, with system reminders filtered out
  const textContent = extractCleanTextFromMessage(lastUserMsg.content);

  // If no text content, check for tool results
  if (!textContent && hasToolResults(lastUserMsg.content)) {
    const toolResultContent = extractToolResultContent(lastUserMsg.content);
    if (toolResultContent) {
      const truncatedContent = truncate(toolResultContent, maxLength);
      return (
        <div className={`truncate ${className}`} title={toolResultContent}>
          <span className="text-gray-500 text-[10px]">[Tool result] </span>
          <span>{truncatedContent}</span>
        </div>
      );
    }
  }

  // If still no content, show dash
  if (!textContent) {
    return <span className="text-[10px] text-gray-600">—</span>;
  }

  return (
    <MessagePreview
      content={textContent}
      maxLength={maxLength}
      className={className}
    />
  );
}

interface AssistantMessagePreviewProps {
  content: ContentBlock[];
  maxLength?: number;
  className?: string;
  isError?: boolean;
  errorMessage?: string;
}

/**
 * AssistantMessagePreview component for displaying assistant response
 * with thinking and tool usage indicators
 */
export function AssistantMessagePreview({
  content,
  maxLength = 200,
  className = 'text-xs text-gray-400',
  isError = false,
  errorMessage = ''
}: AssistantMessagePreviewProps) {
  // Handle error state
  if (isError) {
    return (
      <div className="text-xs text-red-400 italic truncate" title={errorMessage}>
        {errorMessage || 'Error occurred'}
      </div>
    );
  }

  // Handle empty content
  if (!content || !Array.isArray(content) || content.length === 0) {
    return <span className="text-[10px] text-gray-600">—</span>;
  }

  // Extract text content
  const textContent = extractTextFromMessage(content);

  // Detect thinking and tools
  const hasThinking = hasThinkingContent(content);
  const toolsUsed = getToolsUsed(content);
  const formattedToolCalls = getFormattedToolCalls(content);

  // If no text content but has tool calls, show formatted tool calls
  if (!textContent && formattedToolCalls.length > 0) {
    const toolCallsText = formattedToolCalls.join(', ');
    const truncatedToolCalls = truncate(toolCallsText, maxLength);
    return (
      <div className={`truncate ${className}`} title={toolCallsText}>
        {hasThinking && (
          <span className="text-purple-400 font-medium">[Thinking] </span>
        )}
        <span className="text-amber-400">{truncatedToolCalls}</span>
      </div>
    );
  }

  // If no text content but has thinking or tools, show only indicators
  if (!textContent && (hasThinking || toolsUsed.length > 0)) {
    return (
      <div className={className}>
        {hasThinking && (
          <span className="text-purple-400 font-medium">[Thinking]</span>
        )}
        {toolsUsed.length > 0 && (
          <span className="text-amber-400 font-medium ml-1">
            [🔧 {toolsUsed.join(', ')}]
          </span>
        )}
      </div>
    );
  }

  return (
    <MessagePreview
      content={textContent}
      maxLength={maxLength}
      showThinking={true}
      showTools={true}
      hasThinking={hasThinking}
      toolsUsed={toolsUsed}
      className={className}
    />
  );
}
