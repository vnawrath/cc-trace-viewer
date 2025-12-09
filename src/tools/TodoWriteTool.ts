import React from 'react';
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

  /**
   * Custom input renderer for TodoWrite tool
   * Shows todos as a visual list with status indicators and progress bar
   */
  renderCustomInput(input: Record<string, any>): React.ReactNode {
    const todos = input.todos;
    if (!Array.isArray(todos) || todos.length === 0) return null;

    // Count by status
    let pending = 0;
    let inProgress = 0;
    let completed = 0;

    for (const todo of todos) {
      if (typeof todo === 'object' && todo !== null && 'status' in todo) {
        const status = todo.status;
        if (status === 'pending') pending++;
        else if (status === 'in_progress') inProgress++;
        else if (status === 'completed') completed++;
      }
    }

    const total = todos.length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Status icon helper
    const getStatusIcon = (status: string) => {
      if (status === 'completed') {
        return React.createElement('svg', {
          className: 'w-4 h-4 text-green-400 flex-shrink-0',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-label': 'Completed'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          })
        );
      } else if (status === 'in_progress') {
        return React.createElement('svg', {
          className: 'w-4 h-4 text-amber-400 flex-shrink-0',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-label': 'In progress'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
          })
        );
      } else {
        return React.createElement('svg', {
          className: 'w-4 h-4 text-gray-500 flex-shrink-0',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-label': 'Pending'
        },
          React.createElement('circle', {
            cx: '12',
            cy: '12',
            r: '9',
            strokeWidth: 2
          })
        );
      }
    };

    return React.createElement('div', { className: 'space-y-3' },
      // Progress bar
      React.createElement('div', { className: 'space-y-1' },
        React.createElement('div', { className: 'flex justify-between text-xs text-gray-400' },
          React.createElement('span', null, `${completed} of ${total} completed`),
          React.createElement('span', null, `${completionPercentage}%`)
        ),
        React.createElement('div', { className: 'h-2 bg-gray-800 rounded-full overflow-hidden' },
          React.createElement('div', {
            className: 'h-full bg-green-500 transition-all duration-300',
            style: { width: `${completionPercentage}%` }
          })
        )
      ),
      // Todo list
      React.createElement('div', { className: 'space-y-2 max-h-64 overflow-y-auto' },
        todos.map((todo: any, idx: number) => {
          const status = todo.status || 'pending';
          const content = todo.content || '';
          const isCompleted = status === 'completed';

          return React.createElement('div', {
            key: idx,
            className: 'flex items-start space-x-2 text-sm'
          },
            getStatusIcon(status),
            React.createElement('span', {
              className: `flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`
            }, content)
          );
        })
      )
    );
  }

  /**
   * Custom result renderer for TodoWrite tool
   * Shows compact summary with colored status badges
   */
  renderCustomResult(_result: ToolResultBlock): React.ReactNode {
    // We don't use result content here, since the input contains the todo list
    // The result just confirms success, so we'll show a simple success indicator
    return React.createElement('div', { className: 'flex items-center space-x-2 text-green-400 text-sm' },
      React.createElement('svg', {
        className: 'w-4 h-4',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
        'aria-label': 'Success'
      },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M5 13l4 4L19 7'
        })
      ),
      React.createElement('span', { className: 'font-medium' }, 'Todos updated successfully')
    );
  }
}
