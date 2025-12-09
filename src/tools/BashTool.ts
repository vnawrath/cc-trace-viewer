import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the Bash tool.
 * Extracts command parameter and truncates to 40 characters.
 * No result summary is provided.
 */
export class BashTool extends ToolDefinition {
  /**
   * Extract and truncate command parameter.
   */
  formatInput(input: Record<string, any>): string {
    const command = input.command;
    if (!command) return '';

    const cmdStr = String(command);

    // Truncate long commands to 40 characters
    if (cmdStr.length > 40) {
      return cmdStr.substring(0, 37) + '...';
    }

    return cmdStr;
  }

  /**
   * No result summary for Bash tool.
   */
  formatResult(_input: Record<string, any>, _result: ToolResultBlock): string | null {
    return null;
  }
}
