/**
 * Phase 4 integration tests
 * Tests the integration of tool registry into messageFormatting
 */

import { formatToolCall, formatToolWithResult } from '../utils/messageFormatting';
import type { ToolUseBlock, ToolResultBlock } from '../services/conversationProcessor';

console.log('=== Phase 4 Integration Tests ===\n');

// Test 1: formatToolCall with Read tool
const readToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'tool_1',
  name: 'Read',
  input: {
    file_path: '/Users/test/src/components/MessagePreview.tsx'
  }
};

const readFormatted = formatToolCall(readToolUse);
console.log('Test 1 - Read tool call:');
console.log(`  Expected: Read(MessagePreview.tsx)`);
console.log(`  Got:      ${readFormatted}`);
console.log(`  Status:   ${readFormatted === 'Read(MessagePreview.tsx)' ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 2: formatToolCall with Bash tool
const bashToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'tool_2',
  name: 'Bash',
  input: {
    command: 'npm run build'
  }
};

const bashFormatted = formatToolCall(bashToolUse);
console.log('Test 2 - Bash tool call:');
console.log(`  Expected: Bash(npm run build)`);
console.log(`  Got:      ${bashFormatted}`);
console.log(`  Status:   ${bashFormatted === 'Bash(npm run build)' ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: formatToolWithResult for Read tool
const readResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'tool_1',
  content: `     1→import { useState } from 'react';
     2→import { useNavigate } from 'react-router';
     3→
     4→export function MessagePreview() {
     5→  const [count, setCount] = useState(0);
     6→  return <div>Hello</div>;
     7→}`
};

const readWithResult = formatToolWithResult(readToolUse, readResult);
console.log('Test 3 - Read tool with result:');
console.log(`  Expected format: Read(MessagePreview.tsx, [N lines])`);
console.log(`  Got:             ${readWithResult}`);
console.log(`  Status:          ${readWithResult.includes('[') && readWithResult.includes('lines]') ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: formatToolWithResult for TodoWrite tool
const todoToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'tool_3',
  name: 'TodoWrite',
  input: {
    todos: [
      { content: 'Task 1', status: 'pending', activeForm: 'Working on task 1' },
      { content: 'Task 2', status: 'pending', activeForm: 'Working on task 2' },
      { content: 'Task 3', status: 'in_progress', activeForm: 'Working on task 3' },
      { content: 'Task 4', status: 'completed', activeForm: 'Working on task 4' },
      { content: 'Task 5', status: 'completed', activeForm: 'Working on task 5' }
    ]
  }
};

const todoResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'tool_3',
  content: `Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress.

<system-reminder>
Your todo list has changed. Here are the latest contents of your todo list:

[{"content":"Task 1","status":"pending","activeForm":"Working on task 1"},{"content":"Task 2","status":"pending","activeForm":"Working on task 2"},{"content":"Task 3","status":"in_progress","activeForm":"Working on task 3"},{"content":"Task 4","status":"completed","activeForm":"Working on task 4"},{"content":"Task 5","status":"completed","activeForm":"Working on task 5"}]
</system-reminder>`
};

const todoWithResult = formatToolWithResult(todoToolUse, todoResult);
console.log('Test 4 - TodoWrite tool with result:');
console.log(`  Expected format: TodoWrite(5 todos, [2 pending, 1 in progress, 2 completed])`);
console.log(`  Got:             ${todoWithResult}`);
console.log(`  Status:          ${todoWithResult.includes('5 todos') && todoWithResult.includes('2 pending') ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 5: formatToolWithResult for Bash tool (no result summary)
const bashResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'tool_2',
  content: 'Build completed successfully'
};

const bashWithResult = formatToolWithResult(bashToolUse, bashResult);
console.log('Test 5 - Bash tool with result (no summary):');
console.log(`  Expected: Bash(npm run build) (no result summary)`);
console.log(`  Got:      ${bashWithResult}`);
console.log(`  Status:   ${bashWithResult === 'Bash(npm run build)' ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 6: formatToolCall with unknown tool (base definition)
const unknownToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'tool_4',
  name: 'UnknownTool',
  input: {
    file_path: '/path/to/file.txt'
  }
};

const unknownFormatted = formatToolCall(unknownToolUse);
console.log('Test 6 - Unknown tool (base definition):');
console.log(`  Expected: UnknownTool(/path/to/file.txt)`);
console.log(`  Got:      ${unknownFormatted}`);
console.log(`  Status:   ${unknownFormatted === 'UnknownTool(/path/to/file.txt)' ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('=== Phase 4 Tests Complete ===');
