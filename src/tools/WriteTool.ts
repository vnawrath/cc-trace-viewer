import React from 'react';
import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';
import { truncateToLines, stripSystemReminders } from '../utils/contentParsing';

/**
 * Tool definition for the Write tool.
 * Extracts filename from file_path and counts lines written.
 */
export class WriteTool extends ToolDefinition {
  /**
   * Extract filename from file_path parameter.
   */
  formatInput(input: Record<string, unknown>): string {
    const filePath = input.file_path;
    if (!filePath) return '';

    // Extract just the filename from the path
    const parts = String(filePath).split('/');
    return parts[parts.length - 1];
  }

  /**
   * Count lines in the written content and format as "[X lines]"
   */
  formatResult(input: Record<string, unknown>, _result: ToolResultBlock): string | null {
    // Try to count lines from the input content (what was written)
    const content = input.content;
    if (!content) return null;

    const lineCount = this.countLines(String(content));

    if (lineCount === 0) return null;

    return `${lineCount} lines`;
  }

  /**
   * Count lines in a text string
   */
  private countLines(text: string): number {
    if (!text) return 0;

    // Count non-empty lines
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.length;
  }

  /**
   * Custom input renderer for Write tool
   * Shows file path, operation type, size, and preview of content
   */
  renderCustomInput(input: Record<string, unknown>): React.ReactNode {
    const filePath = input.file_path;
    const content = input.content;
    if (!filePath || !content) return null;

    const contentStr = String(content);
    const lineCount = this.countLines(contentStr);
    const byteSize = new Blob([contentStr]).size;
    const { text: preview, truncated, totalLines } = truncateToLines(contentStr, 5);

    return React.createElement('div', { className: 'space-y-3' },
      // File path with operation indicator
      React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('svg', {
          className: 'w-4 h-4 text-green-400',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-label': 'Create/Write file'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
          })
        ),
        React.createElement('span', {
          className: 'text-cyan-400 bg-gray-800/50 px-2 py-1 rounded font-mono text-sm break-all'
        }, String(filePath))
      ),
      // File size
      React.createElement('div', { className: 'text-gray-400 text-xs' },
        `${lineCount} lines, ${byteSize} bytes`
      ),
      // Content preview
      React.createElement('div', { className: 'space-y-1' },
        React.createElement('div', { className: 'text-gray-400 text-xs uppercase tracking-wide' }, 'Content Preview:'),
        React.createElement('div', {
          className: 'font-mono text-xs bg-gray-950 border border-gray-700 rounded p-2 text-gray-300 overflow-x-auto'
        },
          React.createElement('pre', null, preview)
        ),
        truncated && React.createElement('div', { className: 'text-gray-500 text-xs' },
          `... and ${totalLines - 5} more lines`
        )
      )
    );
  }

  /**
   * Custom result renderer for Write tool
   * Shows success message with operation type
   */
  renderCustomResult(result: ToolResultBlock): React.ReactNode {
    if (!result.content) return null;

    // Extract text content
    let textContent = '';
    if (typeof result.content === 'string') {
      textContent = result.content;
    } else if (Array.isArray(result.content)) {
      textContent = result.content
        .map(block => {
          if (typeof block === 'string') return block;
          if (typeof block === 'object' && block !== null && 'text' in block) {
            return String(block.text);
          }
          return '';
        })
        .join('');
    }

    // Strip system reminders
    const cleanContent = stripSystemReminders(textContent);

    // Detect operation type
    const isCreated = cleanContent.toLowerCase().includes('created');
    const operationType = isCreated ? 'Created' : 'Updated';
    const colorClass = isCreated ? 'text-green-400' : 'text-blue-400';

    return React.createElement('div', { className: 'flex items-center space-x-2' },
      React.createElement('svg', {
        className: `w-5 h-5 ${colorClass}`,
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
        'aria-label': 'Success'
      },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M5 13l4 4L19 7'
        })
      ),
      React.createElement('span', { className: `${colorClass} font-medium` }, operationType),
      React.createElement('span', { className: 'text-gray-400 text-sm' }, 'successfully')
    );
  }
}
