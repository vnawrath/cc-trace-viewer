import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the Grep tool.
 * Extracts pattern parameter and counts lines in result output.
 */
export class GrepTool extends ToolDefinition {
  /**
   * Extract pattern parameter.
   */
  formatInput(input: Record<string, unknown>): string {
    const pattern = input.pattern;
    if (!pattern) return '';

    return String(pattern);
  }

  /**
   * Count lines in result output and format as "[X lines]"
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
   * Count non-empty lines in text
   */
  private countLines(text: string): number {
    if (!text) return 0;

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.length;
  }
}
