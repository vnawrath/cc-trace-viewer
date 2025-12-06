import { useState } from 'react';
import type { ClaudeTraceEntry } from '../types/trace';
import { processConversation, type ConversationMessage, type TextBlock, type ToolUseBlock, type ToolResultBlock } from '../services/conversationProcessor';
import { ToolCallBadge } from './ToolCallBadge';
import { ToolCallModal } from './ToolCallModal';

interface ConversationViewProps {
  entry: ClaudeTraceEntry;
}

interface SelectedToolState {
  toolUse: ToolUseBlock;
  toolResult?: ToolResultBlock;
}

export function ConversationView({ entry }: ConversationViewProps) {
  const allMessages = processConversation(entry);
  // Filter out hidden messages (tool-only user messages)
  const messages = allMessages.filter(msg => !msg.hide);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<SelectedToolState | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getRoleStyling = (role: 'system' | 'user' | 'assistant') => {
    switch (role) {
      case 'system':
        return {
          borderColor: 'border-terminal-purple',
          bgColor: 'bg-terminal-purple/5',
          textColor: 'text-terminal-purple',
          label: 'System Prompt'
        };
      case 'user':
        return {
          borderColor: 'border-terminal-cyan',
          bgColor: 'bg-terminal-cyan/5',
          textColor: 'text-terminal-cyan',
          label: 'User Message'
        };
      case 'assistant':
        return {
          borderColor: 'border-terminal-green',
          bgColor: 'bg-terminal-green/5',
          textColor: 'text-terminal-green',
          label: 'Assistant Message'
        };
    }
  };

  // Extract text content from message for copying
  const getTextContent = (message: ConversationMessage): string => {
    return message.content
      .filter((block): block is TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n\n');
  };

  // Render content blocks (text and tool badges)
  const renderContentBlocks = (message: ConversationMessage) => {
    const elements: React.ReactNode[] = [];

    message.content.forEach((block, blockIndex) => {
      if (block.type === 'text') {
        elements.push(
          <span key={`text-${blockIndex}`} className="whitespace-pre-wrap break-all">
            {block.text}
          </span>
        );
      } else if (block.type === 'tool_use') {
        // Check if this tool has a result
        const hasResult = message.toolResults?.has(block.id) ?? false;
        const toolResult = message.toolResults?.get(block.id);

        elements.push(
          <ToolCallBadge
            key={`tool-${blockIndex}`}
            toolUse={block}
            hasResult={hasResult}
            onClick={() => setSelectedTool({ toolUse: block, toolResult })}
          />
        );
      }
    });

    return elements;
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No messages found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {messages.map((message, index) => {
          const styling = getRoleStyling(message.role);
          const textContent = getTextContent(message);
          const hasContent = message.content.length > 0;

          // Skip rendering if no content
          if (!hasContent) {
            return null;
          }

          return (
            <div key={index} className="relative">
              {/* Header with label and copy button */}
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-xs font-semibold font-mono uppercase tracking-wider ${styling.textColor}`}>
                  {styling.label}
                </h4>
                {textContent.trim() && (
                  <button
                    onClick={() => handleCopy(textContent, index)}
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-terminal-cyan transition-colors border border-gray-700"
                    type="button"
                  >
                    {copiedIndex === index ? (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Message content */}
              <div
                className={`border-l-4 ${styling.borderColor} ${styling.bgColor} pl-4 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-md overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900`}
                style={{ maxHeight: '400px' }}
              >
                <div className="font-mono text-[13px] leading-relaxed text-gray-300">
                  {renderContentBlocks(message)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tool Call Modal */}
      <ToolCallModal
        toolUse={selectedTool?.toolUse ?? null}
        toolResult={selectedTool?.toolResult}
        onClose={() => setSelectedTool(null)}
      />
    </>
  );
}
