import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the Task tool.
 * Extracts description or prompt parameter and truncates to 40 characters.
 * No result summary is provided.
 */
export class TaskTool extends ToolDefinition {
  /**
   * Extract and truncate description or prompt parameter.
   */
  formatInput(input: Record<string, any>): string {
    const description = input.description || input.prompt;
    if (!description) return '';

    const descStr = String(description);

    // Truncate long descriptions to 40 characters
    if (descStr.length > 40) {
      return descStr.substring(0, 37) + '...';
    }

    return descStr;
  }

  /**
   * No result summary for Task tool.
   */
  formatResult(_input: Record<string, any>, _result: ToolResultBlock): string | null {
    return null;
  }
}
