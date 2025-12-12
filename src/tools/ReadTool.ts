import React from 'react';
import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';
import {
  parseLineNumberedContent,
  stripSystemReminders,
  isPartialRead
} from '../utils/contentParsing';

/**
 * Tool definition for the Read tool.
 * Extracts filename from file_path and counts lines in the result.
 */
export class ReadTool extends ToolDefinition {
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
   * Count lines in the result content and format as "[X lines]"
   */
  formatResult(_input: Record<string, unknown>, result: ToolResultBlock): string | null {
    if (!result.content) return null;

    let lineCount = 0;

    // Handle array content (multiple content blocks)
    if (Array.isArray(result.content)) {
      for (const block of result.content) {
        if (typeof block === 'object' && block !== null && 'text' in block) {
          lineCount += this.countLines(String(block.text));
        } else if (typeof block === 'string') {
          lineCount += this.countLines(block);
        }
      }
    } else if (typeof result.content === 'string') {
      // Handle string content
      lineCount = this.countLines(result.content);
    } else if (typeof result.content === 'object' && result.content !== null && 'text' in result.content) {
      // Handle object with text property
      lineCount = this.countLines(String((result.content as { text: unknown }).text));
    }

    if (lineCount === 0) return null;

    return `${lineCount} lines`;
  }

  /**
   * Count lines in a text string by counting line number prefixes
   */
  private countLines(text: string): number {
    if (!text) return 0;

    // Count lines with the format "     N→" where N is the line number
    // This is the format returned by the Read tool
    const lineMatches = text.match(/^\s+\d+→/gm);

    if (lineMatches) {
      return lineMatches.length;
    }

    // Fallback: count newlines if no line number format found
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.length;
  }

  /**
   * Custom input renderer for Read tool
   * Shows file path with optional offset/limit parameters
   */
  renderCustomInput(input: Record<string, unknown>): React.ReactNode {
    const filePath = input.file_path;
    if (!filePath) return null;

    const hasPartial = isPartialRead(input);

    return React.createElement('div', { className: 'space-y-2' },
      // File path
      React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('svg', {
          className: 'w-4 h-4 text-cyan-400',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-label': 'File icon'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          })
        ),
        React.createElement('span', {
          className: 'text-cyan-400 bg-gray-800/50 px-2 py-1 rounded font-mono text-sm break-all'
        }, String(filePath))
      ),
      // Optional parameters
      hasPartial ? React.createElement('div', { className: 'text-gray-400 text-xs space-y-1' },
        input.offset ? React.createElement('div', null, `Offset: ${input.offset}`) : null,
        input.limit ? React.createElement('div', null, `Limit: ${input.limit} lines`) : null
      ) : null
    );
  }

  /**
   * Custom result renderer for Read tool
   * Shows file content with line numbers in monospace font
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
    } else if (typeof result.content === 'object' && result.content !== null && 'text' in result.content) {
      textContent = String((result.content as { text: unknown }).text);
    }

    // Strip system reminders
    const cleanContent = stripSystemReminders(textContent);

    // Parse line-numbered content
    const lines = parseLineNumberedContent(cleanContent);

    if (lines.length === 0) {
      return React.createElement('div', { className: 'text-gray-400 text-sm' }, 'No content');
    }

    // Get line range info
    const firstLine = lines[0].lineNum;
    const lastLine = lines[lines.length - 1].lineNum;
    const totalLines = lines.length;

    return React.createElement('div', { className: 'space-y-2' },
      // File stats
      React.createElement('div', { className: 'text-gray-400 text-xs flex items-center space-x-4 pb-2 border-b border-gray-700' },
        React.createElement('span', null, `${totalLines} lines`),
        firstLine !== 1 && React.createElement('span', null, `Lines ${firstLine}-${lastLine}`)
      ),
      // Content with line numbers
      React.createElement('div', {
        className: 'font-mono text-sm bg-gray-950 border border-gray-700 rounded p-2 overflow-x-auto'
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
