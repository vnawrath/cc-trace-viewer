import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the ExitPlanMode tool.
 * Shows truncated plan (5 words).
 * No result summary is provided.
 */
export class ExitPlanModeTool extends ToolDefinition {
  /**
   * Extract and truncate plan parameter to 5 words.
   */
  formatInput(input: Record<string, unknown>): string {
    const plan = input.plan;
    if (!plan) return '';

    const planStr = String(plan);

    // Split into words and take first 5
    const words = planStr.trim().split(/\s+/);
    if (words.length <= 5) {
      return planStr;
    }

    return words.slice(0, 5).join(' ') + '...';
  }

  /**
   * No result summary for ExitPlanMode tool.
   */
  formatResult(_input: Record<string, unknown>, _result: ToolResultBlock): string | null {
    return null;
  }
}
