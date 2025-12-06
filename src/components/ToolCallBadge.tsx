import React from 'react';
import type { ToolUseBlock } from '../services/conversationProcessor';

interface ToolCallBadgeProps {
  toolUse: ToolUseBlock;
  hasResult: boolean;
  onClick: () => void;
}

export const ToolCallBadge: React.FC<ToolCallBadgeProps> = ({ toolUse, hasResult, onClick }) => {
  const badgeClasses = hasResult
    ? "inline-flex items-center gap-1.5 px-2 py-1 mx-1 text-xs font-medium rounded-md bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 transition-colors cursor-pointer"
    : "inline-flex items-center gap-1.5 px-2 py-1 mx-1 text-xs font-medium rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors cursor-pointer";

  // Generate informative tooltip with key parameter
  const getKeyParameter = (): string => {
    // Common parameter names by tool type
    const keyParams = ['file_path', 'path', 'command', 'pattern', 'url', 'query'];
    for (const param of keyParams) {
      if (toolUse.input[param]) {
        const value = String(toolUse.input[param]);
        // Truncate long values
        return value.length > 50 ? `${value.substring(0, 50)}...` : value;
      }
    }
    return '';
  };

  const keyParam = getKeyParameter();
  const status = hasResult ? 'completed' : 'pending';
  const title = keyParam
    ? `${toolUse.name} (${status})\n${keyParam}`
    : `${toolUse.name} (${status})`;

  return (
    <button
      onClick={onClick}
      className={badgeClasses}
      title={title}
      aria-label={`${toolUse.name} tool call - ${status}. Click to view details.`}
    >
      {hasResult ? (
        // Checkmark icon for completed tools
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        // Settings/gear icon for pending tools
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
      <span>{toolUse.name}</span>
    </button>
  );
};
