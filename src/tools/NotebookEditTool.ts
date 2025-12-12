import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the NotebookEdit tool.
 * Shows filename only from notebook_path parameter.
 * No result summary is provided.
 */
export class NotebookEditTool extends ToolDefinition {
  /**
   * Extract filename from notebook_path parameter.
   */
  formatInput(input: Record<string, unknown>): string {
    const notebookPath = input.notebook_path;
    if (!notebookPath) return '';

    // Extract just the filename from the path
    const parts = String(notebookPath).split('/');
    return parts[parts.length - 1];
  }

  /**
   * No result summary for NotebookEdit tool.
   */
  formatResult(_input: Record<string, unknown>, _result: ToolResultBlock): string | null {
    return null;
  }
}
