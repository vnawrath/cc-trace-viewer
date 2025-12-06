import React, { useEffect, useState } from 'react';
import type { ToolUseBlock, ToolResultBlock } from '../services/conversationProcessor';

interface ToolCallModalProps {
  toolUse: ToolUseBlock | null;
  toolResult?: ToolResultBlock;
  onClose: () => void;
}

export const ToolCallModal: React.FC<ToolCallModalProps> = ({ toolUse, toolResult, onClose }) => {
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [inputExpanded, setInputExpanded] = useState(true);
  const [resultExpanded, setResultExpanded] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toolUse) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [toolUse, onClose]);

  if (!toolUse) return null;

  const handleCopyInput = async () => {
    const jsonString = JSON.stringify(toolUse.input, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyResult = async () => {
    if (!toolResult) return;
    const content = typeof toolResult.content === 'string'
      ? toolResult.content
      : JSON.stringify(toolResult.content, null, 2);
    try {
      await navigator.clipboard.writeText(content);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatResultContent = () => {
    if (!toolResult) return '';
    if (typeof toolResult.content === 'string') {
      return toolResult.content;
    }
    return JSON.stringify(toolResult.content, null, 2);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-3xl max-h-[80vh] mx-4 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-cyan-400">{toolUse.name}</h2>
            <p className="text-sm text-gray-400 mt-1">Tool ID: {toolUse.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Input Parameters Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setInputExpanded(!inputExpanded)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-gray-100 transition-colors"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${inputExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Input Parameters
                </button>
                {inputExpanded && (
                  <button
                    onClick={handleCopyInput}
                    className="px-3 py-1 text-xs font-medium rounded-md
                             bg-gray-700 text-gray-300 border border-gray-600
                             hover:bg-gray-600 hover:border-gray-500
                             transition-colors"
                  >
                    {copiedInput ? 'Copied!' : 'Copy JSON'}
                  </button>
                )}
              </div>
              {inputExpanded && (
                <pre className="bg-gray-950 border border-gray-700 rounded-md p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">
                    {JSON.stringify(toolUse.input, null, 2)}
                  </code>
                </pre>
              )}
            </div>

            {/* Tool Result Section */}
            {toolResult && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setResultExpanded(!resultExpanded)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-gray-100 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${resultExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Tool Result
                    {toolResult.is_error && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-900/50 text-red-300 border border-red-700 rounded">
                        Error
                      </span>
                    )}
                    {!toolResult.is_error && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-900/50 text-green-300 border border-green-700 rounded">
                        Success
                      </span>
                    )}
                  </button>
                  {resultExpanded && (
                    <button
                      onClick={handleCopyResult}
                      className="px-3 py-1 text-xs font-medium rounded-md
                               bg-gray-700 text-gray-300 border border-gray-600
                               hover:bg-gray-600 hover:border-gray-500
                               transition-colors"
                    >
                      {copiedResult ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                {resultExpanded && (
                  <pre className={`border rounded-md p-4 overflow-x-auto ${
                    toolResult.is_error
                      ? 'bg-red-950/30 border-red-700'
                      : 'bg-green-950/30 border-green-700'
                  }`}>
                    <code className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                      {formatResultContent()}
                    </code>
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
