import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the BashOutput tool.
 * Shows bash_id parameter.
 * No result summary is provided.
 */
export class BashOutputTool extends ToolDefinition {
  /**
   * Extract bash_id parameter.
   */
  formatInput(input: Record<string, unknown>): string {
    const bashId = input.bash_id;
    if (!bashId) return '';

    return String(bashId);
  }

  /**
   * No result summary for BashOutput tool.
   */
  formatResult(_input: Record<string, unknown>, _result: ToolResultBlock): string | null {
    return null;
  }
}
