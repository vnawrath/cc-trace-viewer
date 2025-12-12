/**
 * Phase 6 Integration Tests
 * Tests for custom renderer support in ToolCallModal via toolRegistry
 */

import { toolRegistry, ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

// Test custom tool definition with custom renderers
class CustomRendererTool extends ToolDefinition {
  formatInput(input: Record<string, any>): string {
    return input.test_param || 'default';
  }

  formatResult(_input: Record<string, any>, result: ToolResultBlock): string | null {
    if (typeof result.content === 'string') {
      return `custom: ${result.content.substring(0, 10)}`;
    }
    return null;
  }

  renderCustomInput(input: Record<string, any>): string {
    return `Custom input rendering: ${input.test_param}`;
  }

  renderCustomResult(result: ToolResultBlock): string {
    return `Custom result rendering: ${result.content}`;
  }
}

// Test tool without custom renderers (uses defaults)
class DefaultRendererTool extends ToolDefinition {
  formatInput(input: Record<string, any>): string {
    return input.file_path || '';
  }

  formatResult(_input: Record<string, any>, _result: ToolResultBlock): string | null {
    return 'test result';
  }
}

// Register test tools
toolRegistry.register('CustomRendererTool', new CustomRendererTool());
toolRegistry.register('DefaultRendererTool', new DefaultRendererTool());

console.log('=== Phase 6 Tests: Custom Renderer Support ===\n');

// Test 1: Check if custom input renderer is detected
console.log('Test 1: hasCustomInputRenderer for CustomRendererTool');
const hasCustomInput = toolRegistry.hasCustomInputRenderer('CustomRendererTool');
console.log(`Result: ${hasCustomInput}`);
console.log(`Expected: true`);
console.log(`Status: ${hasCustomInput === true ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 2: Check if custom result renderer is detected
console.log('Test 2: hasCustomResultRenderer for CustomRendererTool');
const hasCustomResult = toolRegistry.hasCustomResultRenderer('CustomRendererTool');
console.log(`Result: ${hasCustomResult}`);
console.log(`Expected: true`);
console.log(`Status: ${hasCustomResult === true ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: Check that default tool does not have custom input renderer
console.log('Test 3: hasCustomInputRenderer for DefaultRendererTool (should be false)');
const hasDefaultCustomInput = toolRegistry.hasCustomInputRenderer('DefaultRendererTool');
console.log(`Result: ${hasDefaultCustomInput}`);
console.log(`Expected: false`);
console.log(`Status: ${hasDefaultCustomInput === false ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: Check that default tool does not have custom result renderer
console.log('Test 4: hasCustomResultRenderer for DefaultRendererTool (should be false)');
const hasDefaultCustomResult = toolRegistry.hasCustomResultRenderer('DefaultRendererTool');
console.log(`Result: ${hasDefaultCustomResult}`);
console.log(`Expected: false`);
console.log(`Status: ${hasDefaultCustomResult === false ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 5: Render custom input
console.log('Test 5: renderCustomInput for CustomRendererTool');
const customInputResult = toolRegistry.renderCustomInput('CustomRendererTool', { test_param: 'test value' });
console.log(`Result: ${customInputResult}`);
console.log(`Expected: Custom input rendering: test value`);
console.log(`Status: ${customInputResult === 'Custom input rendering: test value' ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 6: Render custom result
console.log('Test 6: renderCustomResult for CustomRendererTool');
const testResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test-id',
  content: 'test content',
  is_error: false
};
const customResultRendered = toolRegistry.renderCustomResult('CustomRendererTool', testResult);
console.log(`Result: ${customResultRendered}`);
console.log(`Expected: Custom result rendering: test content`);
console.log(`Status: ${customResultRendered === 'Custom result rendering: test content' ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 7: Default tool returns null for custom input renderer
console.log('Test 7: renderCustomInput for DefaultRendererTool (should return null)');
const defaultInputResult = toolRegistry.renderCustomInput('DefaultRendererTool', { file_path: 'test.ts' });
console.log(`Result: ${defaultInputResult}`);
console.log(`Expected: null`);
console.log(`Status: ${defaultInputResult === null ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 8: Default tool returns null for custom result renderer
console.log('Test 8: renderCustomResult for DefaultRendererTool (should return null)');
const defaultResultRendered = toolRegistry.renderCustomResult('DefaultRendererTool', testResult);
console.log(`Result: ${defaultResultRendered}`);
console.log(`Expected: null`);
console.log(`Status: ${defaultResultRendered === null ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 9: Unknown tool (base definition) has no custom renderers
console.log('Test 9: hasCustomInputRenderer for unknown tool (should be false)');
const hasUnknownCustomInput = toolRegistry.hasCustomInputRenderer('UnknownTool');
console.log(`Result: ${hasUnknownCustomInput}`);
console.log(`Expected: false`);
console.log(`Status: ${hasUnknownCustomInput === false ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 10: Unknown tool returns null for custom input rendering
console.log('Test 10: renderCustomInput for unknown tool (should return null)');
const unknownInputResult = toolRegistry.renderCustomInput('UnknownTool', { some_param: 'value' });
console.log(`Result: ${unknownInputResult}`);
console.log(`Expected: null`);
console.log(`Status: ${unknownInputResult === null ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 11: getDisplayName uses tool name by default
console.log('Test 11: getDisplayName for DefaultRendererTool');
const displayName = toolRegistry.get('DefaultRendererTool').getDisplayName('DefaultRendererTool');
console.log(`Result: ${displayName}`);
console.log(`Expected: DefaultRendererTool`);
console.log(`Status: ${displayName === 'DefaultRendererTool' ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 12: Verify that standard tools (Read, Write, etc.) don't have custom renderers
console.log('Test 12: Standard tools should not have custom renderers');
const readHasCustomInput = toolRegistry.hasCustomInputRenderer('Read');
const readHasCustomResult = toolRegistry.hasCustomResultRenderer('Read');
const writeHasCustomInput = toolRegistry.hasCustomInputRenderer('Write');
const writeHasCustomResult = toolRegistry.hasCustomResultRenderer('Write');
console.log(`Read hasCustomInputRenderer: ${readHasCustomInput}`);
console.log(`Read hasCustomResultRenderer: ${readHasCustomResult}`);
console.log(`Write hasCustomInputRenderer: ${writeHasCustomInput}`);
console.log(`Write hasCustomResultRenderer: ${writeHasCustomResult}`);
console.log(`Expected: All false`);
const allFalse = !readHasCustomInput && !readHasCustomResult && !writeHasCustomInput && !writeHasCustomResult;
console.log(`Status: ${allFalse ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('=== Phase 6 Tests Complete ===');
