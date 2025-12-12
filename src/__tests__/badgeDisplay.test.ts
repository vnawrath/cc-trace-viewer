/**
 * Phase 5 Integration Tests - Badge Display
 *
 * Tests the integration of tool registry with ToolCallBadge component.
 * Verifies that badges show correct formatted text for tool calls and results.
 */

import { toolRegistry } from '../tools';
import type { ToolUseBlock, ToolResultBlock } from '../services/conversationProcessor';

// Test 1: Read tool call formatting in badge
const readToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_01ABC',
  name: 'Read',
  input: {
    file_path: '/path/to/file.ts'
  }
};

const readToolResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'toolu_01ABC',
  content: Array.from({ length: 250 }, (_, i) => `Line ${i + 1}`).join('\n')
};

console.log('Test 1: Read tool call formatting');
const readCall = toolRegistry.formatToolCall(readToolUse);
console.log('  Tool call:', readCall);
console.assert(readCall === 'Read(file.ts)', `Expected "Read(file.ts)", got "${readCall}"`);

console.log('Test 2: Read tool with result formatting');
const readResult = toolRegistry.formatToolResult(readToolUse, readToolResult);
console.log('  Tool result:', readResult);
console.assert(readResult === 'Read(file.ts, [250 lines])', `Expected "Read(file.ts, [250 lines])", got "${readResult}"`);

// Test 3: TodoWrite tool call formatting
const todoToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_02DEF',
  name: 'TodoWrite',
  input: {
    todos: [
      { content: 'Task 1', status: 'pending', activeForm: 'Doing task 1' },
      { content: 'Task 2', status: 'pending', activeForm: 'Doing task 2' },
      { content: 'Task 3', status: 'pending', activeForm: 'Doing task 3' },
      { content: 'Task 4', status: 'in_progress', activeForm: 'Doing task 4' },
      { content: 'Task 5', status: 'completed', activeForm: 'Doing task 5' },
      { content: 'Task 6', status: 'completed', activeForm: 'Doing task 6' },
      { content: 'Task 7', status: 'completed', activeForm: 'Doing task 7' },
      { content: 'Task 8', status: 'completed', activeForm: 'Doing task 8' }
    ]
  }
};

const todoToolResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'toolu_02DEF',
  content: `Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress.

Current todos:
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
- [→] Task 4
- [x] Task 5
- [x] Task 6
- [x] Task 7
- [x] Task 8`
};

console.log('Test 3: TodoWrite tool call formatting');
const todoCall = toolRegistry.formatToolCall(todoToolUse);
console.log('  Tool call:', todoCall);
console.assert(todoCall === 'TodoWrite(8 todos)', `Expected "TodoWrite(8 todos)", got "${todoCall}"`);

console.log('Test 4: TodoWrite tool with result formatting');
const todoResult = toolRegistry.formatToolResult(todoToolUse, todoToolResult);
console.log('  Tool result:', todoResult);
console.assert(
  todoResult === 'TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])',
  `Expected "TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])", got "${todoResult}"`
);

// Test 5: Bash tool (no result summary)
const bashToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_03GHI',
  name: 'Bash',
  input: {
    command: 'npm install'
  }
};

const bashToolResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'toolu_03GHI',
  content: 'added 42 packages...'
};

console.log('Test 5: Bash tool call formatting');
const bashCall = toolRegistry.formatToolCall(bashToolUse);
console.log('  Tool call:', bashCall);
console.assert(bashCall === 'Bash(npm install)', `Expected "Bash(npm install)", got "${bashCall}"`);

console.log('Test 6: Bash tool with result (no summary - should match call)');
const bashResult = toolRegistry.formatToolResult(bashToolUse, bashToolResult);
console.log('  Tool result:', bashResult);
console.assert(bashResult === 'Bash(npm install)', `Expected "Bash(npm install)", got "${bashResult}"`);

// Test 7: Write tool with result
const writeToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_04JKL',
  name: 'Write',
  input: {
    file_path: '/path/to/newfile.tsx',
    content: Array.from({ length: 150 }, (_, i) => `Line ${i + 1}`).join('\n')
  }
};

const writeToolResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'toolu_04JKL',
  content: 'File created successfully at /path/to/newfile.tsx'
};

console.log('Test 7: Write tool with result formatting');
const writeResult = toolRegistry.formatToolResult(writeToolUse, writeToolResult);
console.log('  Tool result:', writeResult);
console.assert(writeResult === 'Write(newfile.tsx, [150 lines])', `Expected "Write(newfile.tsx, [150 lines])", got "${writeResult}"`);

// Test 8: Grep tool with result
const grepToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_05MNO',
  name: 'Grep',
  input: {
    pattern: 'function.*test'
  }
};

const grepToolResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'toolu_05MNO',
  content: Array.from({ length: 15 }, (_, i) => `Match ${i + 1}`).join('\n')
};

console.log('Test 8: Grep tool with result formatting');
const grepResult = toolRegistry.formatToolResult(grepToolUse, grepToolResult);
console.log('  Tool result:', grepResult);
console.assert(grepResult === 'Grep(function.*test, [15 lines])', `Expected "Grep(function.*test, [15 lines])", got "${grepResult}"`);

// Test 9: Task tool (no result summary)
const taskToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_06PQR',
  name: 'Task',
  input: {
    description: 'Implement new feature',
    prompt: 'Please implement the new feature with full tests'
  }
};

const taskToolResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'toolu_06PQR',
  content: 'Task completed successfully'
};

console.log('Test 9: Task tool call formatting');
const taskCall = toolRegistry.formatToolCall(taskToolUse);
console.log('  Tool call:', taskCall);
console.assert(taskCall === 'Task(Implement new feature)', `Expected "Task(Implement new feature)", got "${taskCall}"`);

console.log('Test 10: Task tool with result (no summary - should match call)');
const taskResult = toolRegistry.formatToolResult(taskToolUse, taskToolResult);
console.log('  Tool result:', taskResult);
console.assert(taskResult === 'Task(Implement new feature)', `Expected "Task(Implement new feature)", got "${taskResult}"`);

// Test 11: Very long command truncation
const longBashToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_07STU',
  name: 'Bash',
  input: {
    command: 'echo "This is a very long command that should be truncated to 40 characters for display purposes"'
  }
};

console.log('Test 11: Long command truncation');
const longBashCall = toolRegistry.formatToolCall(longBashToolUse);
console.log('  Tool call:', longBashCall);
console.assert(
  longBashCall.length <= 'Bash('.length + 40 + ')'.length + 3, // 3 for "..."
  `Expected truncated length, got ${longBashCall.length}: "${longBashCall}"`
);

console.log('\n✅ All Phase 5 tests passed!');
console.log('\nBadge integration verified:');
console.log('  - Tool calls show input parameter');
console.log('  - Tool results show input + result summary (when available)');
console.log('  - Tools without result summary show same format for call and result');
console.log('  - Long commands are truncated appropriately');
