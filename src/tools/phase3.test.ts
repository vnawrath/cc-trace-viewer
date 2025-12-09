/**
 * Test suite for Phase 3 tool definitions.
 * Tests all additional tool definitions: Bash, Grep, Glob, Task, WebFetch, WebSearch,
 * ExitPlanMode, NotebookEdit, BashOutput, KillShell, and SlashCommand.
 */

import { toolRegistry } from '../utils/toolRegistry';
import type { ToolUseBlock, ToolResultBlock } from '../services/conversationProcessor';
import './index'; // Import to ensure all tools are registered

// Helper to create a ToolUseBlock
function createToolUse(name: string, input: Record<string, any>): ToolUseBlock {
  return {
    type: 'tool_use',
    id: 'test-id',
    name,
    input
  };
}

// Helper to create a ToolResultBlock
function createToolResult(content: any): ToolResultBlock {
  return {
    type: 'tool_result',
    tool_use_id: 'test-id',
    content
  };
}

console.log('=== Phase 3 Tool Tests ===\n');

// Test 1: Bash tool with short command
{
  const toolUse = createToolUse('Bash', { command: 'npm install' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'Bash(npm install)';
  console.assert(result === expected, `Test 1 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 1: Bash with short command');
}

// Test 2: Bash tool with long command (should truncate)
{
  const longCommand = 'npm install @types/react @types/node typescript webpack';
  const toolUse = createToolUse('Bash', { command: longCommand });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'Bash(npm install @types/react @types/node ...)';
  console.assert(result === expected, `Test 2 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 2: Bash with long command (truncated to 40 chars)');
}

// Test 3: Bash tool with result (should have no result summary)
{
  const toolUse = createToolUse('Bash', { command: 'npm test' });
  const toolResult = createToolResult('Test output\nAll tests passed');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'Bash(npm test)'; // No result summary
  console.assert(result === expected, `Test 3 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 3: Bash result (no summary)');
}

// Test 4: Grep tool with pattern
{
  const toolUse = createToolUse('Grep', { pattern: 'TODO' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'Grep(TODO)';
  console.assert(result === expected, `Test 4 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 4: Grep with pattern');
}

// Test 5: Grep tool with result showing line count
{
  const toolUse = createToolUse('Grep', { pattern: 'error' });
  const toolResult = createToolResult('file1.ts:10: error message\nfile2.ts:20: error here\nfile3.ts:30: another error');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'Grep(error, [3 lines])';
  console.assert(result === expected, `Test 5 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 5: Grep result with line count');
}

// Test 6: Glob tool with pattern
{
  const toolUse = createToolUse('Glob', { pattern: '**/*.ts' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'Glob(**/*.ts)';
  console.assert(result === expected, `Test 6 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 6: Glob with pattern');
}

// Test 7: Glob tool with result showing file count
{
  const toolUse = createToolUse('Glob', { pattern: '*.tsx' });
  const toolResult = createToolResult('App.tsx\nHeader.tsx\nFooter.tsx\nSidebar.tsx\nMain.tsx');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'Glob(*.tsx, [5 lines])';
  console.assert(result === expected, `Test 7 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 7: Glob result with file count');
}

// Test 8: Task tool with short description
{
  const toolUse = createToolUse('Task', { description: 'Review code changes' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'Task(Review code changes)';
  console.assert(result === expected, `Test 8 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 8: Task with short description');
}

// Test 9: Task tool with long description (should truncate)
{
  const longDesc = 'Review all the code changes in the pull request and provide feedback';
  const toolUse = createToolUse('Task', { description: longDesc });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'Task(Review all the code changes in the pu...)';
  console.assert(result === expected, `Test 9 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 9: Task with long description (truncated to 40 chars)');
}

// Test 10: Task tool with prompt parameter
{
  const toolUse = createToolUse('Task', { prompt: 'Search for bugs' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'Task(Search for bugs)';
  console.assert(result === expected, `Test 10 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 10: Task with prompt parameter');
}

// Test 11: Task tool with result (should have no result summary)
{
  const toolUse = createToolUse('Task', { description: 'Run tests' });
  const toolResult = createToolResult('Task completed successfully');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'Task(Run tests)';
  console.assert(result === expected, `Test 11 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 11: Task result (no summary)');
}

// Test 12: WebFetch tool with short URL
{
  const toolUse = createToolUse('WebFetch', { url: 'https://example.com' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'WebFetch(https://example.com)';
  console.assert(result === expected, `Test 12 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 12: WebFetch with short URL');
}

// Test 13: WebFetch tool with long URL (should truncate)
{
  const longUrl = 'https://example.com/api/v1/users/12345/profile/settings';
  const toolUse = createToolUse('WebFetch', { url: longUrl });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'WebFetch(https://example.com/api/v1/users/1234...)';
  console.assert(result === expected, `Test 13 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 13: WebFetch with long URL (truncated to 40 chars)');
}

// Test 14: WebFetch tool with result (should have no result summary)
{
  const toolUse = createToolUse('WebFetch', { url: 'https://api.example.com' });
  const toolResult = createToolResult('{"status": "success", "data": [...]}');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'WebFetch(https://api.example.com)';
  console.assert(result === expected, `Test 14 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 14: WebFetch result (no summary)');
}

// Test 15: WebSearch tool with short query
{
  const toolUse = createToolUse('WebSearch', { query: 'React hooks' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'WebSearch(React hooks)';
  console.assert(result === expected, `Test 15 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 15: WebSearch with short query');
}

// Test 16: WebSearch tool with long query (should truncate)
{
  const longQuery = 'How to implement authentication in React applications';
  const toolUse = createToolUse('WebSearch', { query: longQuery });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'WebSearch(How to implement authentica...)';
  console.assert(result === expected, `Test 16 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 16: WebSearch with long query (truncated to 30 chars)');
}

// Test 17: WebSearch tool with result (should have no result summary)
{
  const toolUse = createToolUse('WebSearch', { query: 'TypeScript' });
  const toolResult = createToolResult('Search results...');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'WebSearch(TypeScript)';
  console.assert(result === expected, `Test 17 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 17: WebSearch result (no summary)');
}

// Test 18: ExitPlanMode tool with short plan
{
  const toolUse = createToolUse('ExitPlanMode', { plan: 'Implement feature X' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'ExitPlanMode(Implement feature X)';
  console.assert(result === expected, `Test 18 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 18: ExitPlanMode with short plan');
}

// Test 19: ExitPlanMode tool with long plan (should truncate to 5 words)
{
  const longPlan = 'Implement authentication feature with JWT tokens and refresh logic';
  const toolUse = createToolUse('ExitPlanMode', { plan: longPlan });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'ExitPlanMode(Implement authentication feature with JWT...)';
  console.assert(result === expected, `Test 19 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 19: ExitPlanMode with long plan (truncated to 5 words)');
}

// Test 20: ExitPlanMode tool with result (should have no result summary)
{
  const toolUse = createToolUse('ExitPlanMode', { plan: 'Complete the task' });
  const toolResult = createToolResult('Plan mode exited');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'ExitPlanMode(Complete the task)';
  console.assert(result === expected, `Test 20 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 20: ExitPlanMode result (no summary)');
}

// Test 21: NotebookEdit tool with notebook path
{
  const toolUse = createToolUse('NotebookEdit', { notebook_path: '/path/to/notebook.ipynb' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'NotebookEdit(notebook.ipynb)';
  console.assert(result === expected, `Test 21 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 21: NotebookEdit with notebook path');
}

// Test 22: NotebookEdit tool with result (should have no result summary)
{
  const toolUse = createToolUse('NotebookEdit', { notebook_path: '/notebooks/analysis.ipynb' });
  const toolResult = createToolResult('Cell updated successfully');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'NotebookEdit(analysis.ipynb)';
  console.assert(result === expected, `Test 22 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 22: NotebookEdit result (no summary)');
}

// Test 23: BashOutput tool with bash_id
{
  const toolUse = createToolUse('BashOutput', { bash_id: 'shell-123' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'BashOutput(shell-123)';
  console.assert(result === expected, `Test 23 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 23: BashOutput with bash_id');
}

// Test 24: BashOutput tool with result (should have no result summary)
{
  const toolUse = createToolUse('BashOutput', { bash_id: 'shell-456' });
  const toolResult = createToolResult('Command output here...');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'BashOutput(shell-456)';
  console.assert(result === expected, `Test 24 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 24: BashOutput result (no summary)');
}

// Test 25: KillShell tool with shell_id
{
  const toolUse = createToolUse('KillShell', { shell_id: 'shell-789' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'KillShell(shell-789)';
  console.assert(result === expected, `Test 25 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 25: KillShell with shell_id');
}

// Test 26: KillShell tool with result (should have no result summary)
{
  const toolUse = createToolUse('KillShell', { shell_id: 'shell-999' });
  const toolResult = createToolResult('Shell terminated');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'KillShell(shell-999)';
  console.assert(result === expected, `Test 26 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 26: KillShell result (no summary)');
}

// Test 27: SlashCommand tool with command
{
  const toolUse = createToolUse('SlashCommand', { command: '/commit' });
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'SlashCommand(/commit)';
  console.assert(result === expected, `Test 27 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 27: SlashCommand with command');
}

// Test 28: SlashCommand tool with result (should have no result summary)
{
  const toolUse = createToolUse('SlashCommand', { command: '/help' });
  const toolResult = createToolResult('Command executed');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'SlashCommand(/help)';
  console.assert(result === expected, `Test 28 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 28: SlashCommand result (no summary)');
}

// Test 29: Edge case - empty result content for Grep
{
  const toolUse = createToolUse('Grep', { pattern: 'xyz' });
  const toolResult = createToolResult('');
  const result = toolRegistry.formatToolResult(toolUse, toolResult);
  const expected = 'Grep(xyz)'; // No result summary for empty content
  console.assert(result === expected, `Test 29 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 29: Grep with empty result');
}

// Test 30: Edge case - missing parameter falls back to default
{
  const toolUse = createToolUse('Bash', {});
  const result = toolRegistry.formatToolCall(toolUse);
  const expected = 'Bash'; // No input parameter
  console.assert(result === expected, `Test 30 failed: expected "${expected}", got "${result}"`);
  console.log('✓ Test 30: Bash with missing parameter');
}

console.log('\n=== All Phase 3 Tests Passed! ===');
