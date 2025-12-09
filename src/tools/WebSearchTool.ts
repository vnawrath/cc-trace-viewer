import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the WebSearch tool.
 * Extracts query parameter and truncates to 30 characters.
 * No result summary is provided.
 */
export class WebSearchTool extends ToolDefinition {
  /**
   * Extract and truncate query parameter.
   */
  formatInput(input: Record<string, any>): string {
    const query = input.query;
    if (!query) return '';

    const queryStr = String(query);

    // Truncate long queries to 30 characters
    if (queryStr.length > 30) {
      return queryStr.substring(0, 27) + '...';
    }

    return queryStr;
  }

  /**
   * No result summary for WebSearch tool.
   */
  formatResult(_input: Record<string, any>, _result: ToolResultBlock): string | null {
    return null;
  }
}
