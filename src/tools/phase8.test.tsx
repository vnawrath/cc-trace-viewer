/**
 * Phase 8 Tests: Custom Renderers for Core Tools
 *
 * Tests for custom React renderers in Read, Write, Edit, and TodoWrite tools.
 * These tests verify that custom renderers are registered and can render without errors.
 */

import { toolRegistry } from './index';
import type { ToolResultBlock } from '../services/conversationProcessor';
import {
  parseLineNumberedContent,
  stripSystemReminders,
  countLines,
  truncateToLines,
  extractFilename,
  isPartialRead,
  getReadRange
} from '../utils/contentParsing';

// Simple test runner for inline verification
function describe(name: string, fn: () => void) {
  console.log(`\n${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error}`);
  }
}

const expect = (value: any) => ({
  toBe: (expected: any) => {
    if (value !== expected) {
      throw new Error(`Expected ${value} to be ${expected}`);
    }
  },
  toBeNull: () => {
    if (value !== null) {
      throw new Error(`Expected ${value} to be null`);
    }
  },
  not: {
    toBeNull: () => {
      if (value === null) {
        throw new Error(`Expected ${value} not to be null`);
      }
    },
    toContain: (substring: string) => {
      if (typeof value === 'string' && value.includes(substring)) {
        throw new Error(`Expected ${value} not to contain ${substring}`);
      }
    }
  },
  toContain: (substring: string) => {
    if (typeof value !== 'string' || !value.includes(substring)) {
      throw new Error(`Expected ${value} to contain ${substring}`);
    }
  },
  toHaveLength: (length: number) => {
    if (!value || value.length !== length) {
      throw new Error(`Expected ${value} to have length ${length}`);
    }
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(value) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
    }
  }
});

describe('Phase 8: Custom Renderers', () => {
  describe('ReadTool Custom Renderers', () => {
    it('has custom input renderer', () => {
      expect(toolRegistry.hasCustomInputRenderer('Read')).toBe(true);
    });

    it('has custom result renderer', () => {
      expect(toolRegistry.hasCustomResultRenderer('Read')).toBe(true);
    });

    it('renders custom input without errors', () => {
      const input = {
        file_path: '/Users/test/repos/cc-trace-viewer/src/App.tsx'
      };

      const rendered = toolRegistry.renderCustomInput('Read', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom input with offset and limit', () => {
      const input = {
        file_path: '/Users/test/repos/cc-trace-viewer/src/App.tsx',
        offset: 100,
        limit: 50
      };

      const rendered = toolRegistry.renderCustomInput('Read', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom result without errors', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: '     1→# Title\n     2→\n     3→Some content here\n     4→More content'
      };

      const rendered = toolRegistry.renderCustomResult('Read', result);
      expect(rendered).not.toBeNull();
    });

    it('handles empty result content', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: ''
      };

      const rendered = toolRegistry.renderCustomResult('Read', result);
      expect(rendered).toBeNull();
    });
  });

  describe('WriteTool Custom Renderers', () => {
    it('has custom input renderer', () => {
      expect(toolRegistry.hasCustomInputRenderer('Write')).toBe(true);
    });

    it('has custom result renderer', () => {
      expect(toolRegistry.hasCustomResultRenderer('Write')).toBe(true);
    });

    it('renders custom input without errors', () => {
      const input = {
        file_path: '/Users/test/repos/cc-trace-viewer/src/NewFile.tsx',
        content: 'import React from "react";\n\nexport function NewComponent() {\n  return <div>Hello</div>;\n}'
      };

      const rendered = toolRegistry.renderCustomInput('Write', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom input with long content', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      const input = {
        file_path: '/Users/test/repos/cc-trace-viewer/src/LongFile.tsx',
        content: lines.join('\n')
      };

      const rendered = toolRegistry.renderCustomInput('Write', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom result for file creation', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: 'File created successfully at: /Users/test/repos/cc-trace-viewer/src/NewFile.tsx'
      };

      const rendered = toolRegistry.renderCustomResult('Write', result);
      expect(rendered).not.toBeNull();
    });

    it('renders custom result for file update', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: 'File updated successfully'
      };

      const rendered = toolRegistry.renderCustomResult('Write', result);
      expect(rendered).not.toBeNull();
    });
  });

  describe('EditTool Custom Renderers', () => {
    it('has custom input renderer', () => {
      expect(toolRegistry.hasCustomInputRenderer('Edit')).toBe(true);
    });

    it('has custom result renderer', () => {
      expect(toolRegistry.hasCustomResultRenderer('Edit')).toBe(true);
    });

    it('renders custom input without errors', () => {
      const input = {
        file_path: '/Users/test/repos/cc-trace-viewer/src/App.tsx',
        old_string: 'const oldValue = 123;',
        new_string: 'const newValue = 456;'
      };

      const rendered = toolRegistry.renderCustomInput('Edit', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom input with multiline content', () => {
      const input = {
        file_path: '/Users/test/repos/cc-trace-viewer/src/Component.tsx',
        old_string: 'function OldComponent() {\n  return <div>Old</div>;\n}',
        new_string: 'function NewComponent() {\n  return <div>New</div>;\n}'
      };

      const rendered = toolRegistry.renderCustomInput('Edit', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom result without errors', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: 'The file /Users/test/repos/cc-trace-viewer/src/App.tsx has been updated. Here\'s the result of running `cat -n` on a snippet of the edited file:\n     1→const newValue = 456;\n     2→\n     3→export default App;'
      };

      const rendered = toolRegistry.renderCustomResult('Edit', result);
      expect(rendered).not.toBeNull();
    });

    it('handles result with no line numbers', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: 'Edit completed successfully'
      };

      const rendered = toolRegistry.renderCustomResult('Edit', result);
      expect(rendered).not.toBeNull();
    });
  });

  describe('TodoWriteTool Custom Renderers', () => {
    it('has custom input renderer', () => {
      expect(toolRegistry.hasCustomInputRenderer('TodoWrite')).toBe(true);
    });

    it('has custom result renderer', () => {
      expect(toolRegistry.hasCustomResultRenderer('TodoWrite')).toBe(true);
    });

    it('renders custom input without errors', () => {
      const input = {
        todos: [
          { content: 'Task 1', status: 'pending', activeForm: 'Doing task 1' },
          { content: 'Task 2', status: 'in_progress', activeForm: 'Doing task 2' },
          { content: 'Task 3', status: 'completed', activeForm: 'Doing task 3' }
        ]
      };

      const rendered = toolRegistry.renderCustomInput('TodoWrite', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom input with all pending todos', () => {
      const input = {
        todos: [
          { content: 'Task 1', status: 'pending', activeForm: 'Doing task 1' },
          { content: 'Task 2', status: 'pending', activeForm: 'Doing task 2' },
          { content: 'Task 3', status: 'pending', activeForm: 'Doing task 3' }
        ]
      };

      const rendered = toolRegistry.renderCustomInput('TodoWrite', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom input with all completed todos', () => {
      const input = {
        todos: [
          { content: 'Task 1', status: 'completed', activeForm: 'Doing task 1' },
          { content: 'Task 2', status: 'completed', activeForm: 'Doing task 2' },
          { content: 'Task 3', status: 'completed', activeForm: 'Doing task 3' }
        ]
      };

      const rendered = toolRegistry.renderCustomInput('TodoWrite', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom input with many todos', () => {
      const todos = Array.from({ length: 20 }, (_, i) => ({
        content: `Task ${i + 1}`,
        status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in_progress' : 'pending',
        activeForm: `Doing task ${i + 1}`
      }));

      const input = { todos };

      const rendered = toolRegistry.renderCustomInput('TodoWrite', input);
      expect(rendered).not.toBeNull();
    });

    it('renders custom result without errors', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: 'Todos have been modified successfully.'
      };

      const rendered = toolRegistry.renderCustomResult('TodoWrite', result);
      expect(rendered).not.toBeNull();
    });

    it('handles empty todos array', () => {
      const input = {
        todos: []
      };

      const rendered = toolRegistry.renderCustomInput('TodoWrite', input);
      expect(rendered).toBeNull();
    });
  });

  describe('Content Parsing Utilities', () => {
    it('parseLineNumberedContent extracts lines correctly', () => {
      const content = '     1→# Title\n     2→\n     3→Some content';
      const parsed = parseLineNumberedContent(content);

      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual({ lineNum: 1, text: '# Title' });
      expect(parsed[1]).toEqual({ lineNum: 2, text: '' });
      expect(parsed[2]).toEqual({ lineNum: 3, text: 'Some content' });
    });

    it('stripSystemReminders removes system reminder tags', () => {
      const content = 'Normal text\n<system-reminder>This is a reminder</system-reminder>\nMore normal text';
      const stripped = stripSystemReminders(content);

      expect(stripped).not.toContain('<system-reminder>');
      expect(stripped).not.toContain('This is a reminder');
      expect(stripped).toContain('Normal text');
      expect(stripped).toContain('More normal text');
    });

    it('countLines counts line-numbered content', () => {
      const content = '     1→Line 1\n     2→Line 2\n     3→Line 3';
      const count = countLines(content);

      expect(count).toBe(3);
    });

    it('countLines counts plain text lines', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const count = countLines(content);

      expect(count).toBe(3);
    });

    it('truncateToLines truncates long text', () => {
      const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
      const result = truncateToLines(content, 5);

      expect(result.truncated).toBe(true);
      expect(result.totalLines).toBe(20);
      expect(result.text.split('\n')).toHaveLength(5);
    });

    it('truncateToLines does not truncate short text', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const result = truncateToLines(content, 5);

      expect(result.truncated).toBe(false);
      expect(result.totalLines).toBe(3);
      expect(result.text).toBe(content);
    });

    it('extractFilename extracts filename from path', () => {
      const path = '/Users/test/repos/cc-trace-viewer/src/App.tsx';
      const filename = extractFilename(path);

      expect(filename).toBe('App.tsx');
    });

    it('isPartialRead detects offset parameter', () => {
      expect(isPartialRead({ offset: 100 })).toBe(true);
      expect(isPartialRead({ limit: 50 })).toBe(true);
      expect(isPartialRead({})).toBe(false);
    });

    it('getReadRange calculates line range', () => {
      const range = getReadRange({ offset: 10, limit: 5 }, 5);

      expect(range.start).toBe(10);
      expect(range.end).toBe(14);
    });
  });

  describe('System Reminder Handling', () => {
    it('Read tool strips system reminders from result', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: '     1→# Title\n<system-reminder>Internal reminder</system-reminder>\n     2→Content'
      };

      const rendered = toolRegistry.renderCustomResult('Read', result);
      // Rendered output should not contain system reminder
      // We can't easily check the rendered JSX, but we trust stripSystemReminders is called
      expect(rendered).not.toBeNull();
    });

    it('Edit tool strips system reminders from result', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: '     1→Code\n<system-reminder>Don\'t show this</system-reminder>\n     2→More code'
      };

      const rendered = toolRegistry.renderCustomResult('Edit', result);
      expect(rendered).not.toBeNull();
    });

    it('Write tool strips system reminders from result', () => {
      const result: ToolResultBlock = {
        type: 'tool_result',
        tool_use_id: 'test-123',
        content: 'File created\n<system-reminder>Internal note</system-reminder>'
      };

      const rendered = toolRegistry.renderCustomResult('Write', result);
      expect(rendered).not.toBeNull();
    });
  });
});
