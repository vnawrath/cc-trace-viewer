import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

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
}
