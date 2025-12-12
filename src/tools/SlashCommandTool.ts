import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the SlashCommand tool.
 * Shows command parameter.
 * No result summary is provided.
 */
export class SlashCommandTool extends ToolDefinition {
  /**
   * Extract command parameter.
   */
  formatInput(input: Record<string, unknown>): string {
    const command = input.command;
    if (!command) return '';

    return String(command);
  }

  /**
   * No result summary for SlashCommand tool.
   */
  formatResult(_input: Record<string, unknown>, _result: ToolResultBlock): string | null {
    return null;
  }
}
