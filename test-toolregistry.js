/**
 * Simple test script for toolRegistry
 * Run with: node test-toolregistry.js
 */

// Import the compiled JS (after running tsc)
import { toolRegistry, ToolDefinition } from './dist/utils/toolRegistry.js';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('✓', message);
    testsPassed++;
  } else {
    console.error('✗', message);
    testsFailed++;
  }
}

console.log('\n=== Testing ToolRegistry ===\n');

// Test 1: Base definition with unknown tool
console.log('Test 1: Unknown tool uses base definition');
const unknownToolResult = toolRegistry.formatToolCall({
  type: 'tool_use',
  id: 'test-1',
  name: 'UnknownTool',
  input: { file_path: '/test/file.ts' }
});
assert(unknownToolResult === 'UnknownTool(/test/file.ts)', 'Unknown tool formats with default (file_path)');

// Test 2: Base definition fallback to first parameter
console.log('\nTest 2: Base definition fallback to first parameter');
const firstParamResult = toolRegistry.formatToolCall({
  type: 'tool_use',
  id: 'test-2',
  name: 'CustomTool',
  input: { custom_param: 'value', another: 'thing' }
});
assert(firstParamResult === 'CustomTool(value)', 'Fallback to first parameter works');

// Test 3: Base definition with empty input
console.log('\nTest 3: Empty input handling');
const emptyInputResult = toolRegistry.formatToolCall({
  type: 'tool_use',
  id: 'test-3',
  name: 'EmptyTool',
  input: {}
});
assert(emptyInputResult === 'EmptyTool', 'Empty input returns just tool name');

// Test 4: Base definition checks common keys in order
console.log('\nTest 4: Common keys priority');
const commandResult = toolRegistry.formatToolCall({
  type: 'tool_use',
  id: 'test-4',
  name: 'BashTool',
  input: { command: 'npm install', other: 'ignored' }
});
assert(commandResult === 'BashTool(npm install)', 'Command parameter extracted');

const patternResult = toolRegistry.formatToolCall({
  type: 'tool_use',
  id: 'test-5',
  name: 'GrepTool',
  input: { pattern: '.*\\.ts$', other: 'ignored' }
});
assert(patternResult === 'GrepTool(.*\\.ts$)', 'Pattern parameter extracted');

// Test 5: formatToolResult without custom result formatter
console.log('\nTest 5: Tool result without custom formatter');
const toolUse = {
  type: 'tool_use',
  id: 'test-6',
  name: 'GenericTool',
  input: { path: 'test.txt' }
};
const toolResult = {
  type: 'tool_result',
  tool_use_id: 'test-6',
  content: 'some result content'
};
const resultFormatted = toolRegistry.formatToolResult(toolUse, toolResult);
assert(resultFormatted === 'GenericTool(test.txt)', 'Result without custom formatter shows just tool call');

// Test 6: Register custom tool definition
console.log('\nTest 6: Register custom tool definition');
class TestTool extends ToolDefinition {
  formatInput(input) {
    return input.test_param || '';
  }

  formatResult(input, result) {
    return 'custom result';
  }
}

toolRegistry.register('TestTool', new TestTool());

const customToolCall = toolRegistry.formatToolCall({
  type: 'tool_use',
  id: 'test-7',
  name: 'TestTool',
  input: { test_param: 'custom input' }
});
assert(customToolCall === 'TestTool(custom input)', 'Custom tool formats input correctly');

const customToolResult = toolRegistry.formatToolResult(
  {
    type: 'tool_use',
    id: 'test-8',
    name: 'TestTool',
    input: { test_param: 'custom input' }
  },
  {
    type: 'tool_result',
    tool_use_id: 'test-8',
    content: 'ignored'
  }
);
assert(customToolResult === 'TestTool(custom input, [custom result])', 'Custom tool formats result correctly');

// Test 7: Custom renderer methods
console.log('\nTest 7: Custom renderer detection');
class ToolWithRenderer extends ToolDefinition {
  renderCustomInput(input) {
    return 'custom rendered input';
  }
}

toolRegistry.register('ToolWithRenderer', new ToolWithRenderer());
assert(toolRegistry.hasCustomInputRenderer('ToolWithRenderer'), 'Detects custom input renderer');
assert(!toolRegistry.hasCustomResultRenderer('ToolWithRenderer'), 'Detects no result renderer');
assert(!toolRegistry.hasCustomInputRenderer('UnknownTool'), 'Returns false for unknown tool');

// Test 8: URL parameter extraction
console.log('\nTest 8: URL parameter extraction');
const urlResult = toolRegistry.formatToolCall({
  type: 'tool_use',
  id: 'test-9',
  name: 'WebFetch',
  input: { url: 'https://example.com', prompt: 'ignored' }
});
assert(urlResult === 'WebFetch(https://example.com)', 'URL parameter extracted first');

// Test 9: Query parameter extraction
console.log('\nTest 9: Query parameter extraction');
const queryResult = toolRegistry.formatToolCall({
  type: 'tool_use',
  id: 'test-10',
  name: 'WebSearch',
  input: { query: 'test search' }
});
assert(queryResult === 'WebSearch(test search)', 'Query parameter extracted');

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  process.exit(1);
}
