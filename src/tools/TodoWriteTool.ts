import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

/**
 * Tool definition for the TodoWrite tool.
 * Counts todos and formats status breakdown.
 */
export class TodoWriteTool extends ToolDefinition {
  /**
   * Count total todos from the input array.
   */
  formatInput(input: Record<string, any>): string {
    const todos = input.todos;
    if (!Array.isArray(todos)) return '';

    const count = todos.length;
    return `${count} ${count === 1 ? 'todo' : 'todos'}`;
  }

  /**
   * Parse result content to extract todo status counts.
   * Format as: "[X pending, Y in progress, Z completed]"
   */
  formatResult(input: Record<string, any>, _result: ToolResultBlock): string | null {
    // Try to get counts from input todos since that's the source of truth
    const todos = input.todos;
    if (!Array.isArray(todos) || todos.length === 0) return null;

    // Count todos by status
    let pending = 0;
    let inProgress = 0;
    let completed = 0;

    for (const todo of todos) {
      if (typeof todo === 'object' && todo !== null && 'status' in todo) {
        const status = todo.status;
        if (status === 'pending') {
          pending++;
        } else if (status === 'in_progress') {
          inProgress++;
        } else if (status === 'completed') {
          completed++;
        }
      }
    }

    // Build result summary
    const parts: string[] = [];
    if (pending > 0) {
      parts.push(`${pending} pending`);
    }
    if (inProgress > 0) {
      parts.push(`${inProgress} in progress`);
    }
    if (completed > 0) {
      parts.push(`${completed} completed`);
    }

    if (parts.length === 0) return null;

    return parts.join(', ');
  }
}
