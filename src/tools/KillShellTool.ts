import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the KillShell tool.
 * Shows shell_id parameter.
 * No result summary is provided.
 */
export class KillShellTool extends ToolDefinition {
  /**
   * Extract shell_id parameter.
   */
  formatInput(input: Record<string, any>): string {
    const shellId = input.shell_id;
    if (!shellId) return '';

    return String(shellId);
  }

  /**
   * No result summary for KillShell tool.
   */
  formatResult(_input: Record<string, any>, _result: ToolResultBlock): string | null {
    return null;
  }
}
