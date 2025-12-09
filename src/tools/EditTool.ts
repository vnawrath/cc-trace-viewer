import React from 'react';
import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';
import {
  parseLineNumberedContent,
  stripSystemReminders,
  truncateToLines
} from '../utils/contentParsing';

/**
 * Tool definition for the Edit tool.
 * Extracts filename from file_path and counts lines in the edit snippet.
 */
export class EditTool extends ToolDefinition {
  /**
   * Extract filename from file_path parameter.
   */
  formatInput(input: Record<string, any>): string {
    const filePath = input.file_path;
    if (!filePath) return '';

    // Extract just the filename from the path
    const parts = String(filePath).split('/');
    return parts[parts.length - 1];
  }

  /**
   * Count lines in the edit result snippet and format as "[X lines]"
   */
  formatResult(_input: Record<string, any>, result: ToolResultBlock): string | null {
    if (!result.content) return null;

    let text = '';

    // Handle different content formats
    if (Array.isArray(result.content)) {
      for (const block of result.content) {
        if (typeof block === 'object' && block !== null && 'text' in block) {
          text += block.text;
        } else if (typeof block === 'string') {
          text += block;
        }
      }
    } else if (typeof result.content === 'string') {
      text = result.content;
    } else if (typeof result.content === 'object' && result.content !== null && 'text' in result.content) {
      text = (result.content as any).text;
    }

    // Count lines with the format "     N→" which shows the edited snippet
    const lineMatches = text.match(/^\s+\d+→/gm);

    if (lineMatches && lineMatches.length > 0) {
      return `${lineMatches.length} lines`;
    }

    return null;
  }

  /**
   * Custom input renderer for Edit tool
   * Shows file path and diff-style view of the change
   */
  renderCustomInput(input: Record<string, any>): React.ReactNode {
    const filePath = input.file_path;
    const oldString = input.old_string;
    const newString = input.new_string;

    if (!filePath) return null;

    // Truncate long content
    const oldTruncated = oldString ? truncateToLines(String(oldString), 10) : null;
    const newTruncated = newString ? truncateToLines(String(newString), 10) : null;

    return React.createElement('div', { className: 'space-y-3' },
      // File path
      React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('svg', {
          className: 'w-4 h-4 text-amber-400',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-label': 'Edit file'
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
        }, filePath)
      ),
      // Diff view
      oldString && React.createElement('div', { className: 'space-y-2' },
        // Old content (removed)
        React.createElement('div', { className: 'space-y-1' },
          React.createElement('div', { className: 'text-red-400 text-xs uppercase tracking-wide' }, '− Removed:'),
          React.createElement('div', {
            className: 'font-mono text-xs bg-red-950/30 border border-red-700/50 rounded p-2 text-red-200 overflow-x-auto'
          },
            React.createElement('pre', null, oldTruncated?.text || oldString)
          ),
          oldTruncated?.truncated && React.createElement('div', { className: 'text-gray-500 text-xs' },
            `... and ${oldTruncated.totalLines - 10} more lines`
          )
        ),
        // New content (added)
        newString && React.createElement('div', { className: 'space-y-1' },
          React.createElement('div', { className: 'text-green-400 text-xs uppercase tracking-wide' }, '+ Added:'),
          React.createElement('div', {
            className: 'font-mono text-xs bg-green-950/30 border border-green-700/50 rounded p-2 text-green-200 overflow-x-auto'
          },
            React.createElement('pre', null, newTruncated?.text || newString)
          ),
          newTruncated?.truncated && React.createElement('div', { className: 'text-gray-500 text-xs' },
            `... and ${newTruncated.totalLines - 10} more lines`
          )
        )
      )
    );
  }

  /**
   * Custom result renderer for Edit tool
   * Shows the edited section with context
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

    // Parse line-numbered content from result snippet
    const lines = parseLineNumberedContent(cleanContent);

    if (lines.length === 0) {
      return React.createElement('div', { className: 'text-gray-400 text-sm' },
        'Edit completed successfully'
      );
    }

    return React.createElement('div', { className: 'space-y-2' },
      // Edit summary
      React.createElement('div', { className: 'flex items-center space-x-2 text-green-400 text-sm' },
        React.createElement('svg', {
          className: 'w-4 h-4',
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
        React.createElement('span', { className: 'font-medium' }, 'Edit successful'),
        React.createElement('span', { className: 'text-gray-400' }, `— ${lines.length} lines shown`)
      ),
      // Edited snippet with line numbers
      React.createElement('div', {
        className: 'font-mono text-xs bg-gray-950 border border-gray-700 rounded p-2 overflow-x-auto'
      },
        React.createElement('div', { className: 'space-y-0' },
          lines.map((line, idx) =>
            React.createElement('div', {
              key: idx,
              className: 'flex'
            },
              React.createElement('span', {
                className: 'text-gray-500 text-xs select-none mr-3 inline-block w-12 text-right flex-shrink-0'
              }, line.lineNum),
              React.createElement('span', {
                className: 'text-gray-300'
              }, line.text)
            )
          )
        )
      )
    );
  }
}
