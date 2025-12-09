# Tool Registry Developer Guide

This guide explains how to add new tool definitions to the unified tool display system in CC Trace Viewer.

## Overview

The tool registry system provides consistent tool display formatting across all locations in the application:
- **Request List** (`MessagePreview`): Shows tool calls and results in amber
- **Request Details** (`ToolCallBadge`): Shows clickable badge chips for each tool
- **Tool Modal** (`ToolCallModal`): Shows detailed input/output for individual tools

All tool formatting is centralized in the `toolRegistry` singleton, which maps tool names to `ToolDefinition` instances.

## Display Format

**Tool Calls:** `ToolName(key_input_param)`
**Tool Results:** `ToolName(key_input_param, [result_summary])`

Examples:
- `Read(file.ts)` → `Read(file.ts, [250 lines])`
- `TodoWrite(8 todos)` → `TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])`
- `Bash(npm install)` → `Bash(npm install)` (no result summary)

Result summaries are optional and only shown when custom logic is defined for that tool.

## Architecture

```
src/
├── utils/
│   └── toolRegistry.ts         # Base ToolDefinition class and ToolRegistry
├── tools/
│   ├── ReadTool.ts             # Example: tool with result summary
│   ├── BashTool.ts             # Example: tool without result summary
│   ├── TodoWriteTool.ts        # Example: complex result parsing
│   └── index.ts                # Barrel export that registers all tools
└── tests/
    └── toolDisplay.test.ts     # Integration tests
```

## Adding a New Tool Definition

### Step 1: Create the Tool Definition File

Create a new file in `src/tools/` named `YourToolName.ts`:

```typescript
import { ToolDefinition } from '../utils/toolRegistry';
import type { ToolResultBlock } from '../services/conversationProcessor';

export class YourToolTool extends ToolDefinition {
  /**
   * Format input parameters for display
   * Extract the most important parameter(s) to show
   */
  formatInput(input: Record<string, any>): string {
    // Extract the key parameter from input
    const keyParam = input.your_param;

    // Optional: truncate long values
    if (keyParam && keyParam.length > 40) {
      return keyParam.slice(0, 40) + '...';
    }

    return keyParam || '';
  }

  /**
   * Format result summary for display (optional)
   * Return null if no summary should be shown
   */
  formatResult(_input: Record<string, any>, result: ToolResultBlock): string | null {
    // Extract text content from result
    const content = typeof result.content === 'string'
      ? result.content
      : '';

    // Parse and format the result
    // Example: count lines
    const lineCount = content.split('\n').length;
    return `${lineCount} lines`;
  }
}
```

### Step 2: Register the Tool

Add your tool to `src/tools/index.ts`:

```typescript
// Import your tool
import { YourToolTool } from './YourToolTool';

// Register it with the registry
toolRegistry.register('YourTool', new YourToolTool());
```

### Step 3: Add Tests

Add test cases to `src/tests/toolDisplay.test.ts` or create a dedicated test file:

```typescript
const yourToolUse: ToolUseBlock = {
  type: 'tool_use',
  id: 'test-1',
  name: 'YourTool',
  input: { your_param: 'test value' }
};

const yourToolResult: ToolResultBlock = {
  type: 'tool_result',
  tool_use_id: 'test-1',
  content: 'result content here'
};

const formatted = toolRegistry.formatToolResult(yourToolUse, yourToolResult);
console.assert(formatted === 'YourTool(test value, [expected result])',
  `Test failed: got "${formatted}"`);
```

## Examples

### Example 1: Tool with Result Summary (Read)

```typescript
export class ReadTool extends ToolDefinition {
  formatInput(input: Record<string, any>): string {
    const filePath = input.file_path || '';
    // Show only filename, not full path
    return filePath.split('/').pop() || filePath;
  }

  formatResult(_input: Record<string, any>, result: ToolResultBlock): string | null {
    const content = typeof result.content === 'string'
      ? result.content
      : Array.isArray(result.content)
        ? result.content.map(b => (b as any).text || '').join('\n')
        : '';

    const lineCount = content.split('\n').length;
    return `${lineCount} lines`;
  }
}
```

**Output:**
- Tool call: `Read(file.ts)`
- Tool result: `Read(file.ts, [250 lines])`

### Example 2: Tool without Result Summary (Bash)

```typescript
export class BashTool extends ToolDefinition {
  formatInput(input: Record<string, any>): string {
    const command = input.command || '';
    // Truncate long commands
    if (command.length > 40) {
      return command.slice(0, 40) + '...';
    }
    return command;
  }

  // formatResult is inherited from base class (returns null)
}
```

**Output:**
- Tool call: `Bash(npm install)`
- Tool result: `Bash(npm install)` (no summary)

### Example 3: Complex Result Parsing (TodoWrite)

```typescript
export class TodoWriteTool extends ToolDefinition {
  formatInput(input: Record<string, any>): string {
    if (!input.todos || !Array.isArray(input.todos)) {
      return '';
    }
    return `${input.todos.length} todos`;
  }

  formatResult(_input: Record<string, any>, result: ToolResultBlock): string | null {
    const content = typeof result.content === 'string' ? result.content : '';

    // Parse status counts from content
    const pendingMatch = content.match(/\[pending\]/g);
    const inProgressMatch = content.match(/\[in_progress\]/g);
    const completedMatch = content.match(/\[completed\]/g);

    const pending = pendingMatch ? pendingMatch.length : 0;
    const inProgress = inProgressMatch ? inProgressMatch.length : 0;
    const completed = completedMatch ? completedMatch.length : 0;

    const parts = [];
    if (pending > 0) parts.push(`${pending} pending`);
    if (inProgress > 0) parts.push(`${inProgress} in progress`);
    if (completed > 0) parts.push(`${completed} completed`);

    return parts.join(', ');
  }
}
```

**Output:**
- Tool call: `TodoWrite(8 todos)`
- Tool result: `TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])`

## Base Definition Defaults

If you don't create a custom tool definition, the base `ToolDefinition` class provides smart defaults:

### Default Input Formatting

The base class checks these parameters in order:
1. `file_path`
2. `path`
3. `command`
4. `pattern`
5. `url`
6. `query`
7. `description`
8. `prompt`

If none are found, it uses the first parameter value.

### Default Result Formatting

Returns `null` (no result summary).

### Default Display Name

Returns the tool name as-is.

## Advanced: Custom Modal Renderers

For complex tools that need custom UI in the modal, you can implement optional custom renderers:

```typescript
export class CustomTool extends ToolDefinition {
  formatInput(input: Record<string, any>): string {
    // ... basic formatting for badges/list
  }

  renderCustomInput(input: Record<string, any>): React.ReactNode | null {
    // Return a React component for modal input display
    return (
      <div className="custom-input-display">
        {/* Your custom UI here */}
      </div>
    );
  }

  renderCustomResult(result: ToolResultBlock): React.ReactNode | null {
    // Return a React component for modal result display
    return (
      <div className="custom-result-display">
        {/* Your custom UI here */}
      </div>
    );
  }
}
```

The modal will automatically use your custom renderers if they're defined, otherwise it falls back to JSON/text display.

## Testing

Always test your tool definition with:

1. **Unit tests** - Test formatInput and formatResult directly
2. **Integration tests** - Verify display across all components
3. **Edge cases** - Empty inputs, null values, malformed results
4. **Manual testing** - Load a trace file and verify visual appearance

Run tests with:
```bash
npm test
```

## Best Practices

1. **Keep it simple** - Only show the most important parameter in input formatting
2. **Be consistent** - Follow existing patterns for similar tools
3. **Handle edge cases** - Check for null/undefined/empty values
4. **Truncate wisely** - Long values should be truncated with `...`
5. **Test thoroughly** - Add tests for your tool definition
6. **Document parsing** - Add comments explaining complex result parsing

## Troubleshooting

### Tool not showing formatted text

1. Check that your tool is registered in `src/tools/index.ts`
2. Verify the tool name matches exactly (case-sensitive)
3. Ensure `formatInput()` returns a non-empty string

### Result summary not appearing

1. Check that `formatResult()` returns a string, not null
2. Verify the result parsing logic handles your result content format
3. Test with actual result data from a trace file

### TypeScript errors

1. Ensure you're importing types from `src/services/conversationProcessor`
2. Check that your methods match the `ToolDefinition` interface
3. Run `npx tsc --noEmit` to check for type errors

## Reference Files

- **Base system**: `src/utils/toolRegistry.ts`
- **Example tools**: `src/tools/ReadTool.ts`, `src/tools/TodoWriteTool.ts`
- **Integration**: `src/utils/messageFormatting.ts`
- **Components**: `src/components/MessagePreview.tsx`, `src/components/ToolCallBadge.tsx`
- **Tests**: `src/tests/toolDisplay.test.ts`
