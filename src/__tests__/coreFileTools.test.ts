/**
 * Phase 2 Tool Registry Tests
 * Tests for Read, Write, Edit, and TodoWrite tools
 */

import { toolRegistry } from '../tools/index';
import type { ToolUseBlock, ToolResultBlock } from '../services/conversationProcessor';

console.log('=== Phase 2 Tool Registry Tests ===\n');

// Test 1: Read tool - formatInput
console.log('Test 1: Read tool - formatInput');
const readToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test1',
  name: 'Read',
  input: {
    file_path: '/Users/viktornawrath/repos/cc-trace-viewer/implementation-plan.md'
  }
};
const readCallFormatted = toolRegistry.formatToolCall(readToolUse);
console.log(`  Input: ${readToolUse.input.file_path}`);
console.log(`  Expected: Read(implementation-plan.md)`);
console.log(`  Actual:   ${readCallFormatted}`);
console.log(`  ✓ ${readCallFormatted === 'Read(implementation-plan.md)' ? 'PASS' : 'FAIL'}\n`);

// Test 2: Read tool - formatResult with line count
console.log('Test 2: Read tool - formatResult with line count');
const readResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test1',
  content: `     1→# CC Trace Viewer Implementation Plan
     2→
     3→## Project Overview
     4→
     5→The CC Trace Viewer is a React-based web application...
     6→
     7→**Current Status:** UI foundation complete.
     8→
     9→**Technology Stack:** React 19 + TypeScript + Vite
    10→`
};
const readResultFormatted = toolRegistry.formatToolResult(readToolUse, readResult);
console.log(`  Expected: Read(implementation-plan.md, [10 lines])`);
console.log(`  Actual:   ${readResultFormatted}`);
console.log(`  ✓ ${readResultFormatted === 'Read(implementation-plan.md, [10 lines])' ? 'PASS' : 'FAIL'}\n`);

// Test 3: Write tool - formatInput
console.log('Test 3: Write tool - formatInput');
const writeToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test2',
  name: 'Write',
  input: {
    file_path: '/Users/viktornawrath/repos/cc-trace-viewer/src/hooks/useVirtualization.ts',
    content: `import { useState, useEffect, useRef, useMemo } from 'react';

export interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  return { scrollTop };
}`
  }
};
const writeCallFormatted = toolRegistry.formatToolCall(writeToolUse);
console.log(`  Input: ${writeToolUse.input.file_path}`);
console.log(`  Expected: Write(useVirtualization.ts)`);
console.log(`  Actual:   ${writeCallFormatted}`);
console.log(`  ✓ ${writeCallFormatted === 'Write(useVirtualization.ts)' ? 'PASS' : 'FAIL'}\n`);

// Test 4: Write tool - formatResult with line count
console.log('Test 4: Write tool - formatResult with line count');
const writeResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test2',
  content: 'File created successfully at: /Users/viktornawrath/repos/cc-trace-viewer/src/hooks/useVirtualization.ts'
};
const writeResultFormatted = toolRegistry.formatToolResult(writeToolUse, writeResult);
console.log(`  Expected: Write(useVirtualization.ts, [13 lines])`);
console.log(`  Actual:   ${writeResultFormatted}`);
console.log(`  ✓ ${writeResultFormatted === 'Write(useVirtualization.ts, [13 lines])' ? 'PASS' : 'FAIL'}\n`);

// Test 5: Edit tool - formatInput
console.log('Test 5: Edit tool - formatInput');
const editToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test3',
  name: 'Edit',
  input: {
    file_path: '/Users/viktornawrath/repos/cc-trace-viewer/src/components/LoadingSkeleton.tsx',
    old_string: 'interface SkeletonProps {\n  className?: string;\n}',
    new_string: 'interface SkeletonProps {\n  className?: string;\n  size?: string;\n}'
  }
};
const editCallFormatted = toolRegistry.formatToolCall(editToolUse);
console.log(`  Input: ${editToolUse.input.file_path}`);
console.log(`  Expected: Edit(LoadingSkeleton.tsx)`);
console.log(`  Actual:   ${editCallFormatted}`);
console.log(`  ✓ ${editCallFormatted === 'Edit(LoadingSkeleton.tsx)' ? 'PASS' : 'FAIL'}\n`);

// Test 6: Edit tool - formatResult with snippet line count
console.log('Test 6: Edit tool - formatResult with snippet line count');
const editResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test3',
  content: `The file /Users/viktornawrath/repos/cc-trace-viewer/src/components/LoadingSkeleton.tsx has been updated. Here's the result of running \`cat -n\` on a snippet of the edited file:
     1→interface SkeletonProps {
     2→  className?: string;
     3→  size?: string;
     4→}
     5→
     6→function Skeleton({ className = '', size = 'md' }: SkeletonProps) {
     7→  return (
     8→    <div
     9→      className={\`animate-pulse bg-gray-200 rounded \${className}\`}
    10→      aria-hidden="true"
    11→    />
    12→  );
    13→}`
};
const editResultFormatted = toolRegistry.formatToolResult(editToolUse, editResult);
console.log(`  Expected: Edit(LoadingSkeleton.tsx, [13 lines])`);
console.log(`  Actual:   ${editResultFormatted}`);
console.log(`  ✓ ${editResultFormatted === 'Edit(LoadingSkeleton.tsx, [13 lines])' ? 'PASS' : 'FAIL'}\n`);

// Test 7: TodoWrite tool - formatInput
console.log('Test 7: TodoWrite tool - formatInput');
const todoWriteToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test4',
  name: 'TodoWrite',
  input: {
    todos: [
      { content: 'Add loading states', status: 'pending', activeForm: 'Adding loading states' },
      { content: 'Implement search', status: 'pending', activeForm: 'Implementing search' },
      { content: 'Add export functionality', status: 'pending', activeForm: 'Adding export functionality' },
      { content: 'Performance optimizations', status: 'in_progress', activeForm: 'Implementing performance optimizations' },
      { content: 'Add keyboard shortcuts', status: 'completed', activeForm: 'Adding keyboard shortcuts' },
      { content: 'Implement dark theme', status: 'completed', activeForm: 'Implementing dark theme' },
      { content: 'Create help overlay', status: 'completed', activeForm: 'Creating help overlay' },
      { content: 'Run final tests', status: 'completed', activeForm: 'Running final tests' }
    ]
  }
};
const todoWriteCallFormatted = toolRegistry.formatToolCall(todoWriteToolUse);
console.log(`  Input: ${Array.isArray(todoWriteToolUse.input.todos) ? todoWriteToolUse.input.todos.length : 0} todos`);
console.log(`  Expected: TodoWrite(8 todos)`);
console.log(`  Actual:   ${todoWriteCallFormatted}`);
console.log(`  ✓ ${todoWriteCallFormatted === 'TodoWrite(8 todos)' ? 'PASS' : 'FAIL'}\n`);

// Test 8: TodoWrite tool - formatResult with status breakdown
console.log('Test 8: TodoWrite tool - formatResult with status breakdown');
const todoWriteResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test4',
  content: 'Todos have been modified successfully.'
};
const todoWriteResultFormatted = toolRegistry.formatToolResult(todoWriteToolUse, todoWriteResult);
console.log(`  Expected: TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])`);
console.log(`  Actual:   ${todoWriteResultFormatted}`);
console.log(`  ✓ ${todoWriteResultFormatted === 'TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])' ? 'PASS' : 'FAIL'}\n`);

// Test 9: Unknown tool falls back to base definition
console.log('Test 9: Unknown tool falls back to base definition');
const unknownToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test5',
  name: 'UnknownTool',
  input: {
    file_path: '/some/path/file.txt',
    content: 'test content'
  }
};
const unknownCallFormatted = toolRegistry.formatToolCall(unknownToolUse);
console.log(`  Expected: UnknownTool(/some/path/file.txt)`);
console.log(`  Actual:   ${unknownCallFormatted}`);
console.log(`  ✓ ${unknownCallFormatted === 'UnknownTool(/some/path/file.txt)' ? 'PASS' : 'FAIL'}\n`);

// Test 10: Edge case - empty todos array
console.log('Test 10: Edge case - empty todos array');
const emptyTodoToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test6',
  name: 'TodoWrite',
  input: {
    todos: []
  }
};
const emptyTodoCallFormatted = toolRegistry.formatToolCall(emptyTodoToolUse);
console.log(`  Expected: TodoWrite(0 todos)`);
console.log(`  Actual:   ${emptyTodoCallFormatted}`);
console.log(`  ✓ ${emptyTodoCallFormatted === 'TodoWrite(0 todos)' ? 'PASS' : 'FAIL'}\n`);

// Test 11: Edge case - Read with no content
console.log('Test 11: Edge case - Read with no content');
const emptyReadResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test7',
  content: ''
};
const emptyReadResultFormatted = toolRegistry.formatToolResult(readToolUse, emptyReadResult);
console.log(`  Expected: Read(implementation-plan.md) (no result summary)`);
console.log(`  Actual:   ${emptyReadResultFormatted}`);
console.log(`  ✓ ${emptyReadResultFormatted === 'Read(implementation-plan.md)' ? 'PASS' : 'FAIL'}\n`);

console.log('=== All Phase 2 Tests Complete ===');
