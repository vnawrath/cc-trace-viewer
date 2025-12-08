import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the Read tool.
 * Extracts filename from file_path and counts lines in the result.
 */
export class ReadTool extends ToolDefinition {
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
   * Count lines in the result content and format as "[X lines]"
   */
  formatResult(_input: Record<string, any>, result: ToolResultBlock): string | null {
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
      lineCount = this.countLines((result.content as any).text);
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
}
