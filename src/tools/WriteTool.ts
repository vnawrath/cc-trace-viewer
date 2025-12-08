import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the Write tool.
 * Extracts filename from file_path and counts lines written.
 */
export class WriteTool extends ToolDefinition {
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
   * Count lines in the written content and format as "[X lines]"
   */
  formatResult(input: Record<string, any>, _result: ToolResultBlock): string | null {
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
}
