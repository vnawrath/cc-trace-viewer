/**
 * Integration tests for tool display across all components
 * Tests the unified tool registry system in MessagePreview, ToolCallBadge, and ToolCallModal
 */

import { toolRegistry } from '../tools/index';
import type { ToolUseBlock, ToolResultBlock } from '../services/conversationProcessor';
import { formatToolCall, formatToolWithResult } from '../utils/messageFormatting';

// ============================================================================
// Test Data
// ============================================================================

const readToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'read-1',
  name: 'Read',
  input: { file_path: '/src/components/App.tsx' }
};

const readResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'read-1',
  content: Array(250).fill('line content').join('\n')
};

const todoWriteToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'todo-1',
  name: 'TodoWrite',
  input: {
    todos: [
      { content: 'Task 1', status: 'pending', activeForm: 'Doing Task 1' },
      { content: 'Task 2', status: 'pending', activeForm: 'Doing Task 2' },
      { content: 'Task 3', status: 'pending', activeForm: 'Doing Task 3' },
      { content: 'Task 4', status: 'in_progress', activeForm: 'Doing Task 4' },
      { content: 'Task 5', status: 'completed', activeForm: 'Doing Task 5' },
      { content: 'Task 6', status: 'completed', activeForm: 'Doing Task 6' },
      { content: 'Task 7', status: 'completed', activeForm: 'Doing Task 7' },
      { content: 'Task 8', status: 'completed', activeForm: 'Doing Task 8' }
    ]
  }
};

const todoWriteResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'todo-1',
  content: 'Todos have been modified successfully.\n\nCurrent todos:\n- [pending] Task 1\n- [pending] Task 2\n- [pending] Task 3\n- [in_progress] Task 4\n- [completed] Task 5\n- [completed] Task 6\n- [completed] Task 7\n- [completed] Task 8'
};

const bashToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'bash-1',
  name: 'Bash',
  input: { command: 'npm install && npm run build' }
};

const bashResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'bash-1',
  content: 'added 245 packages in 12.3s\n\nbuild completed successfully'
};

const grepToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'grep-1',
  name: 'Grep',
  input: { pattern: 'function.*export', glob: '*.ts' }
};

const grepResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'grep-1',
  content: 'file1.ts:10:export function foo()\nfile2.ts:25:export function bar()\nfile3.ts:42:export function baz()'
};

const writeToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'write-1',
  name: 'Write',
  input: { file_path: '/src/test.ts', content: 'console.log("hello");\nconsole.log("world");' }
};

const writeResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'write-1',
  content: 'File created successfully at /src/test.ts\n\n```typescript\nconsole.log("hello");\nconsole.log("world");\n```'
};

const editToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'edit-1',
  name: 'Edit',
  input: {
    file_path: '/src/app.ts',
    old_string: 'const x = 1;',
    new_string: 'const x = 2;'
  }
};

const editResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'edit-1',
  content: 'File updated successfully.\n\n```typescript\n     1→const x = 2;\n     2→const y = 3;\n     3→const z = 4;\n```'
};

// ============================================================================
// Test 1: Message List Display - Tool Calls
// ============================================================================

console.log('\n--- Test 1: Message List Tool Call Formatting ---');

const test1a = formatToolCall(readToolUse);
console.assert(test1a === 'Read(App.tsx)',
  `Test 1a failed: expected "Read(App.tsx)", got "${test1a}"`);

const test1b = formatToolCall(bashToolUse);
console.assert(test1b === 'Bash(npm install && npm run build)',
  `Test 1b failed: expected "Bash(npm install && npm run build)", got "${test1b}"`);

const test1c = formatToolCall(todoWriteToolUse);
console.assert(test1c === 'TodoWrite(8 todos)',
  `Test 1c failed: expected "TodoWrite(8 todos)", got "${test1c}"`);

const test1d = formatToolCall(grepToolUse);
console.assert(test1d === 'Grep(function.*export)',
  `Test 1d failed: expected "Grep(function.*export)", got "${test1d}"`);

console.log('✓ All tool call formatting tests passed');

// ============================================================================
// Test 2: Message List Display - Tool Results
// ============================================================================

console.log('\n--- Test 2: Message List Tool Result Formatting ---');

const test2a = formatToolWithResult(readToolUse, readResult);
console.assert(test2a === 'Read(App.tsx, [250 lines])',
  `Test 2a failed: expected "Read(App.tsx, [250 lines])", got "${test2a}"`);

const test2b = formatToolWithResult(todoWriteToolUse, todoWriteResult);
console.assert(test2b === 'TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])',
  `Test 2b failed: expected "TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])", got "${test2b}"`);

const test2c = formatToolWithResult(bashToolUse, bashResult);
// Bash has no result summary, should return same as tool call
console.assert(test2c === 'Bash(npm install && npm run build)',
  `Test 2c failed: expected "Bash(npm install && npm run build)", got "${test2c}"`);

const test2d = formatToolWithResult(grepToolUse, grepResult);
console.assert(test2d === 'Grep(function.*export, [3 lines])',
  `Test 2d failed: expected "Grep(function.*export, [3 lines])", got "${test2d}"`);

const test2e = formatToolWithResult(writeToolUse, writeResult);
console.assert(test2e === 'Write(test.ts, [2 lines])',
  `Test 2e failed: expected "Write(test.ts, [2 lines])", got "${test2e}"`);

const test2f = formatToolWithResult(editToolUse, editResult);
console.assert(test2f === 'Edit(app.ts, [3 lines])',
  `Test 2f failed: expected "Edit(app.ts, [3 lines])", got "${test2f}"`);

console.log('✓ All tool result formatting tests passed');

// ============================================================================
// Test 3: Badge Display - Tool Calls Only
// ============================================================================

console.log('\n--- Test 3: Badge Tool Call Formatting ---');

const test3a = toolRegistry.formatToolCall(readToolUse);
console.assert(test3a === 'Read(App.tsx)',
  `Test 3a failed: expected "Read(App.tsx)", got "${test3a}"`);

const test3b = toolRegistry.formatToolCall(todoWriteToolUse);
console.assert(test3b === 'TodoWrite(8 todos)',
  `Test 3b failed: expected "TodoWrite(8 todos)", got "${test3b}"`);

console.log('✓ All badge tool call formatting tests passed');

// ============================================================================
// Test 4: Badge Display - Tool Calls with Results
// ============================================================================

console.log('\n--- Test 4: Badge Tool Result Formatting ---');

const test4a = toolRegistry.formatToolResult(readToolUse, readResult);
console.assert(test4a === 'Read(App.tsx, [250 lines])',
  `Test 4a failed: expected "Read(App.tsx, [250 lines])", got "${test4a}"`);

const test4b = toolRegistry.formatToolResult(todoWriteToolUse, todoWriteResult);
console.assert(test4b === 'TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])',
  `Test 4b failed: expected "TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])", got "${test4b}"`);

const test4c = toolRegistry.formatToolResult(bashToolUse, bashResult);
console.assert(test4c === 'Bash(npm install && npm run build)',
  `Test 4c failed: expected "Bash(npm install && npm run build)", got "${test4c}"`);

console.log('✓ All badge tool result formatting tests passed');

// ============================================================================
// Test 5: Modal Display - Custom Renderers
// ============================================================================

console.log('\n--- Test 5: Modal Custom Renderer Detection ---');

// Standard tools should not have custom renderers
const test5a = toolRegistry.hasCustomInputRenderer('Read');
console.assert(test5a === false,
  `Test 5a failed: Read should not have custom input renderer`);

const test5b = toolRegistry.hasCustomResultRenderer('Read');
console.assert(test5b === false,
  `Test 5b failed: Read should not have custom result renderer`);

const test5c = toolRegistry.hasCustomInputRenderer('TodoWrite');
console.assert(test5c === false,
  `Test 5c failed: TodoWrite should not have custom input renderer`);

const test5d = toolRegistry.hasCustomResultRenderer('TodoWrite');
console.assert(test5d === false,
  `Test 5d failed: TodoWrite should not have custom result renderer`);

// Unknown tools should use base definition (no custom renderers)
const test5e = toolRegistry.hasCustomInputRenderer('UnknownTool');
console.assert(test5e === false,
  `Test 5e failed: Unknown tool should not have custom input renderer`);

const test5f = toolRegistry.hasCustomResultRenderer('UnknownTool');
console.assert(test5f === false,
  `Test 5f failed: Unknown tool should not have custom result renderer`);

console.log('✓ All modal custom renderer detection tests passed');

// ============================================================================
// Test 6: Edge Cases - Empty and Null Values
// ============================================================================

console.log('\n--- Test 6: Edge Case Handling ---');

const test6a: ToolUseBlock = {
  type: 'tool_use',
  id: 'edge-1',
  name: 'EmptyTool',
  input: {}
};
const result6a = toolRegistry.formatToolCall(test6a);
console.assert(result6a === 'EmptyTool',
  `Test 6a failed: expected "EmptyTool", got "${result6a}"`);

const test6b: ToolUseBlock = {
  type: 'tool_use',
  id: 'edge-2',
  name: 'Read',
  input: { file_path: '' }
};
const result6b = toolRegistry.formatToolCall(test6b);
// Empty string parameter results in tool name only (no parentheses)
console.assert(result6b === 'Read',
  `Test 6b failed: expected "Read", got "${result6b}"`);

const test6c: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'edge-3',
  content: ''
};
const test6cToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'edge-3',
  name: 'Read',
  input: { file_path: 'test.ts' }
};
const result6c = toolRegistry.formatToolResult(test6cToolUse, test6c);
// Empty content returns null, so no result summary is shown
console.assert(result6c === 'Read(test.ts)',
  `Test 6c failed: expected "Read(test.ts)", got "${result6c}"`);

console.log('✓ All edge case tests passed');

// ============================================================================
// Test 7: Consistency Across Display Locations
// ============================================================================

console.log('\n--- Test 7: Cross-Component Consistency ---');

// Same tool call should format identically across all locations
const test7Tool = readToolUse;

const test7a = formatToolCall(test7Tool); // MessagePreview
const test7b = toolRegistry.formatToolCall(test7Tool); // ToolCallBadge
const test7c = toolRegistry.formatToolCall(test7Tool); // ToolCallModal

console.assert(test7a === test7b && test7b === test7c,
  `Test 7 failed: tool call formatting inconsistent across components\nMessagePreview: "${test7a}"\nBadge: "${test7b}"\nModal: "${test7c}"`);

// Same tool result should format identically across all locations
const test7Result = readResult;

const test7d = formatToolWithResult(test7Tool, test7Result); // MessagePreview
const test7e = toolRegistry.formatToolResult(test7Tool, test7Result); // ToolCallBadge

console.assert(test7d === test7e,
  `Test 7 failed: tool result formatting inconsistent across components\nMessagePreview: "${test7d}"\nBadge: "${test7e}"`);

console.log('✓ All cross-component consistency tests passed');

// ============================================================================
// Test 8: Long Input Truncation
// ============================================================================

console.log('\n--- Test 8: Long Input Handling ---');

const test8a: ToolUseBlock = {
  type: 'tool_use',
  id: 'long-1',
  name: 'Bash',
  input: { command: 'npm install && npm run build && npm run test && npm run lint && npm run format' }
};
const result8a = toolRegistry.formatToolCall(test8a);
// Bash truncates at 40 characters
const expected8a = 'Bash(npm install && npm run build && npm r...)';
console.assert(result8a === expected8a,
  `Test 8a failed: expected "${expected8a}", got "${result8a}"`);

const test8b: ToolUseBlock = {
  type: 'tool_use',
  id: 'long-2',
  name: 'WebSearch',
  input: { query: 'how to implement a very complex feature with multiple dependencies' }
};
const result8b = toolRegistry.formatToolCall(test8b);
// WebSearch truncates at 30 characters
const expected8b = 'WebSearch(how to implement a very com...)';
console.assert(result8b === expected8b,
  `Test 8b failed: expected "${expected8b}", got "${result8b}"`);

console.log('✓ All long input handling tests passed');

// ============================================================================
// Test 9: Multiple Tool Results in Same Message
// ============================================================================

console.log('\n--- Test 9: Multiple Tool Results ---');

const tools = [readToolUse, bashToolUse, todoWriteToolUse];
const results = [readResult, bashResult, todoWriteResult];

const test9Results = tools.map((tool, i) =>
  formatToolWithResult(tool, results[i])
);

console.assert(test9Results[0] === 'Read(App.tsx, [250 lines])',
  `Test 9a failed: expected "Read(App.tsx, [250 lines])", got "${test9Results[0]}"`);
console.assert(test9Results[1] === 'Bash(npm install && npm run build)',
  `Test 9b failed: expected "Bash(npm install && npm run build)", got "${test9Results[1]}"`);
console.assert(test9Results[2] === 'TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])',
  `Test 9c failed: expected "TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])", got "${test9Results[2]}"`);

console.log('✓ All multiple tool result tests passed');

// ============================================================================
// Test 10: Unknown Tool Fallback
// ============================================================================

console.log('\n--- Test 10: Unknown Tool Handling ---');

const test10: ToolUseBlock = {
  type: 'tool_use',
  id: 'unknown-1',
  name: 'FutureTool',
  input: { some_param: 'value', another: 'ignored' }
};

const test10a = toolRegistry.formatToolCall(test10);
console.assert(test10a === 'FutureTool(value)',
  `Test 10a failed: expected "FutureTool(value)", got "${test10a}"`);

const test10Result: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'unknown-1',
  content: 'some result'
};

const test10b = toolRegistry.formatToolResult(test10, test10Result);
// Should show no result summary (base definition returns null)
console.assert(test10b === 'FutureTool(value)',
  `Test 10b failed: expected "FutureTool(value)", got "${test10b}"`);

console.log('✓ All unknown tool handling tests passed');

// ============================================================================
// Summary
// ============================================================================

console.log('\n========================================');
console.log('✓ All tool display integration tests passed!');
console.log('========================================\n');
console.log('Test Coverage:');
console.log('  • Message list tool call formatting');
console.log('  • Message list tool result formatting');
console.log('  • Badge tool call formatting');
console.log('  • Badge tool result formatting');
console.log('  • Modal custom renderer detection');
console.log('  • Edge case handling (empty/null)');
console.log('  • Cross-component consistency');
console.log('  • Long input truncation');
console.log('  • Multiple tool results');
console.log('  • Unknown tool fallback');
console.log('========================================\n');
