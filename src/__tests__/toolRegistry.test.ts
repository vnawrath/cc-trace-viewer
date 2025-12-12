/**
 * Basic tests for toolRegistry
 * These tests verify the core functionality of the tool registry system.
 *
 * To verify manually:
 * 1. Check TypeScript compilation: npx tsc --noEmit
 * 2. Import in browser console and test interactively
 */

import { toolRegistry, ToolDefinition } from '../utils/toolRegistry';
import type { ToolUseBlock, ToolResultBlock } from '../services/conversationProcessor';

// Test 1: Base definition with unknown tool
const test1: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-1',
  name: 'UnknownTool',
  input: { file_path: '/test/file.ts' }
};
const result1 = toolRegistry.formatToolCall(test1);
console.assert(result1 === 'UnknownTool(/test/file.ts)', `Test 1 failed: expected "UnknownTool(/test/file.ts)", got "${result1}"`);

// Test 2: Base definition fallback to first parameter
const test2: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-2',
  name: 'CustomTool',
  input: { custom_param: 'value', another: 'thing' }
};
const result2 = toolRegistry.formatToolCall(test2);
console.assert(result2 === 'CustomTool(value)', `Test 2 failed: expected "CustomTool(value)", got "${result2}"`);

// Test 3: Base definition with empty input
const test3: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-3',
  name: 'EmptyTool',
  input: {}
};
const result3 = toolRegistry.formatToolCall(test3);
console.assert(result3 === 'EmptyTool', `Test 3 failed: expected "EmptyTool", got "${result3}"`);

// Test 4: Common keys priority - command
const test4: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-4',
  name: 'BashTool',
  input: { command: 'npm install', other: 'ignored' }
};
const result4 = toolRegistry.formatToolCall(test4);
console.assert(result4 === 'BashTool(npm install)', `Test 4 failed: expected "BashTool(npm install)", got "${result4}"`);

// Test 5: Common keys priority - pattern
const test5: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-5',
  name: 'GrepTool',
  input: { pattern: '.*\\.ts$', other: 'ignored' }
};
const result5 = toolRegistry.formatToolCall(test5);
console.assert(result5 === 'GrepTool(.*\\.ts$)', `Test 5 failed: expected "GrepTool(.*\\.ts$)", got "${result5}"`);

// Test 6: formatToolResult without custom result formatter
const test6ToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-6',
  name: 'GenericTool',
  input: { path: 'test.txt' }
};
const test6Result: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test-6',
  content: 'some result content'
};
const result6 = toolRegistry.formatToolResult(test6ToolUse, test6Result);
console.assert(result6 === 'GenericTool(test.txt)', `Test 6 failed: expected "GenericTool(test.txt)", got "${result6}"`);

// Test 7: Register custom tool definition
class TestTool extends ToolDefinition {
  formatInput(input: Record<string, any>): string {
    return input.test_param || '';
  }

  formatResult(_input: Record<string, any>, _result: ToolResultBlock): string | null {
    return 'custom result';
  }
}

toolRegistry.register('TestTool', new TestTool());

const test7: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-7',
  name: 'TestTool',
  input: { test_param: 'custom input' }
};
const result7 = toolRegistry.formatToolCall(test7);
console.assert(result7 === 'TestTool(custom input)', `Test 7 failed: expected "TestTool(custom input)", got "${result7}"`);

// Test 8: Custom tool with result
const test8ToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-8',
  name: 'TestTool',
  input: { test_param: 'custom input' }
};
const test8Result: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test-8',
  content: 'ignored'
};
const result8 = toolRegistry.formatToolResult(test8ToolUse, test8Result);
console.assert(result8 === 'TestTool(custom input, [custom result])', `Test 8 failed: expected "TestTool(custom input, [custom result])", got "${result8}"`);

// Test 9: URL parameter extraction
const test9: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-9',
  name: 'WebFetch',
  input: { url: 'https://example.com', prompt: 'ignored' }
};
const result9 = toolRegistry.formatToolCall(test9);
console.assert(result9 === 'WebFetch(https://example.com)', `Test 9 failed: expected "WebFetch(https://example.com)", got "${result9}"`);

// Test 10: Query parameter extraction
const test10: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-10',
  name: 'WebSearch',
  input: { query: 'test search' }
};
const result10 = toolRegistry.formatToolCall(test10);
console.assert(result10 === 'WebSearch(test search)', `Test 10 failed: expected "WebSearch(test search)", got "${result10}"`);

console.log('✓ All toolRegistry tests passed!');
