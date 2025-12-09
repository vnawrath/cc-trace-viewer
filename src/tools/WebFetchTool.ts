import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the WebFetch tool.
 * Extracts url parameter and truncates to 40 characters.
 * No result summary is provided.
 */
export class WebFetchTool extends ToolDefinition {
  /**
   * Extract and truncate url parameter.
   */
  formatInput(input: Record<string, any>): string {
    const url = input.url;
    if (!url) return '';

    const urlStr = String(url);

    // Truncate long URLs to 40 characters
    if (urlStr.length > 40) {
      return urlStr.substring(0, 37) + '...';
    }

    return urlStr;
  }

  /**
   * No result summary for WebFetch tool.
   */
  formatResult(_input: Record<string, any>, _result: ToolResultBlock): string | null {
    return null;
  }
}
