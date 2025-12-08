# Tool Display Unification - Implementation Plan

## Overview

This plan unifies tool call and tool result display across the CC Trace Viewer application. Currently, tool display logic is scattered across multiple files with inconsistent formatting. The new implementation will create a centralized tool registry system with extensible tool definitions.

### Current State

**Display Locations:**
- **Request List** (`src/components/MessagePreview.tsx`): Shows tool calls with amber highlighting, tool results with `[Tool Result]` prefix
- **Request Details** (`src/components/ConversationView.tsx` + `src/components/ToolCallBadge.tsx`): Shows clickable badge chips for each tool
- **Tool Modal** (`src/components/ToolCallModal.tsx`): Shows detailed input/output for individual tools

**Current Implementation:**
- `src/utils/messageFormatting.ts:216-276`: `formatToolCall()` function with switch statement for tool-specific formatting
- Tool result display is generic, doesn't show tool-specific information
- No consistent way to add custom display logic per tool

### Goals

1. **Create Tool Registry**: Centralized system mapping tool names to display definitions
2. **Extensible Tool Definitions**: Base class with smart defaults, easy to extend per tool
3. **Unified Display Format**: Consistent formatting across all display locations
4. **Tool Result Summaries**: Show informative result summaries alongside tool calls

### Display Format Specification

**Tool Calls:** `ToolName(key_input_param)`
**Tool Results:** `ToolName(key_input_param, [result_summary])`

Examples:
- `Read(file.ts)` → `Read(file.ts, [250 lines])`
- `TodoWrite(8 todos)` → `TodoWrite(8 todos, [3 pending, 1 in progress, 4 completed])`
- `Bash(npm install)` → `Bash(npm install)` (no result summary)

Result summaries are optional - only shown when custom logic is defined for that tool.

### Reference Files

- **Example Inputs/Outputs**: `Read-example.md`, `TodoWrite-example.md`, `Edit-example.md`, `Write-example.md`
- **Current Formatting Logic**: `src/utils/messageFormatting.ts`
- **Tool Type Definitions**: `src/services/conversationProcessor.ts:10-22`

---

## Phase 1: Create Tool Registry Foundation ✅

**Goal**: Build the core tool registry infrastructure with base tool definition class.

### Tasks

- [x] Create `src/utils/toolRegistry.ts` with base tool definition system
  - Define `ToolDefinition` base class with the following methods:
    - `formatInput(input: Record<string, any>): string` - Format input parameters for display
    - `formatResult(input: Record<string, any>, result: ToolResultBlock): string | null` - Format result summary (returns null for no summary)
    - `getDisplayName(): string` - Get display name (defaults to tool name)
    - `renderCustomInput?(input: Record<string, any>): React.ReactNode` - Optional custom input renderer for modal
    - `renderCustomResult?(result: ToolResultBlock): React.ReactNode` - Optional custom result renderer for modal
  - Define `ToolRegistry` class to manage tool definitions
    - `register(name: string, definition: ToolDefinition)`: Register a tool
    - `get(name: string): ToolDefinition`: Get tool definition (returns base if not found)
    - `formatToolCall(toolUse: ToolUseBlock): string`: Format tool call for display
    - `formatToolResult(toolUse: ToolUseBlock, result: ToolResultBlock): string`: Format tool result for display
- [x] Implement smart defaults in base `ToolDefinition` class
  - Default `formatInput()`: Extract first available parameter from common keys (`file_path`, `path`, `command`, `pattern`, `url`, `query`, `description`, `prompt`)
  - Default `formatResult()`: Return `null` (no result summary)
  - Default `getDisplayName()`: Return tool name as-is
- [x] Create singleton instance: `export const toolRegistry = new ToolRegistry()`

**Files Created:**
- `src/utils/toolRegistry.ts` (166 lines)
- `src/utils/toolRegistry.test.ts` (138 lines - inline verification tests)

**Verification:**
- [x] Import `toolRegistry` in test file and verify base definition works
- [x] Call `toolRegistry.formatToolCall()` with unknown tool name, verify it returns sensible default
- [x] Verify TypeScript types are correct and exports work

**Status**: COMPLETED
- Created comprehensive tool registry system with base ToolDefinition class
- Implemented all required methods with smart defaults
- Added optional custom renderer support for future phases
- TypeScript compiles without errors
- Test file validates all core functionality

---

## Phase 2: Implement Core Tool Definitions

**Goal**: Implement custom tool definitions for Read, Write, Edit, and TodoWrite as specified in goal.md.

### Tasks

- [ ] Create `src/tools/ReadTool.ts`
  - Extract filename from `file_path` parameter for input display
  - Parse result content to count lines of output
  - Format result as: `[X lines]` where X is line count from result content
  - Handle both string and array content formats (see `Read-example.md`)
  - Register tool: `toolRegistry.register('Read', new ReadTool())`
- [ ] Create `src/tools/WriteTool.ts`
  - Extract filename from `file_path` parameter for input display
  - Check result content for success/creation message
  - Format result as: `[X lines]` based on content length written
  - Handle "File created" vs "File updated" cases (see `Write-example.md`)
  - Register tool: `toolRegistry.register('Write', new WriteTool())`
- [ ] Create `src/tools/EditTool.ts`
  - Extract filename from `file_path` parameter for input display
  - Parse result content showing file edit confirmation
  - Format result as: `[X lines]` based on the snippet shown in result (see `Edit-example.md`)
  - Register tool: `toolRegistry.register('Edit', new EditTool())`
- [ ] Create `src/tools/TodoWriteTool.ts`
  - Parse `todos` array from input to count total todos
  - Format input as: `X todos` (total count)
  - Parse result content to extract todo status counts
  - Format result as: `[X pending, Y in progress, Z completed]` (see `TodoWrite-example.md`)
  - Register tool: `toolRegistry.register('TodoWrite', new TodoWriteTool())`
- [ ] Create `src/tools/index.ts` barrel export
  - Import and register all tool definitions
  - Ensure registration happens on module load

**Files Created:**
- `src/tools/ReadTool.ts` (~60 lines)
- `src/tools/WriteTool.ts` (~60 lines)
- `src/tools/EditTool.ts` (~60 lines)
- `src/tools/TodoWriteTool.ts` (~80 lines)
- `src/tools/index.ts` (~15 lines)

**Verification:**
- [ ] Create test file with sample tool calls and results from example files
- [ ] Verify `Read(file.ts)` displays correctly with result `[250 lines]`
- [ ] Verify `TodoWrite(8 todos)` displays with result `[3 pending, 1 in progress, 4 completed]`
- [ ] Verify `Edit(file.tsx)` and `Write(file.ts)` display with line counts
- [ ] Test edge cases: empty results, malformed data, missing parameters

---

## Phase 3: Implement Additional Tool Definitions

**Goal**: Add tool definitions for remaining tools following goal.md specification.

### Tasks

- [ ] Create `src/tools/BashTool.ts`
  - Extract `command` parameter for input display
  - Truncate long commands to 40 characters
  - No result summary (return null)
  - Register tool: `toolRegistry.register('Bash', new BashTool())`
- [ ] Create `src/tools/GrepTool.ts`
  - Extract `pattern` parameter for input display
  - Count lines in result output
  - Format result as: `[X lines]`
  - Register tool: `toolRegistry.register('Grep', new GrepTool())`
- [ ] Create `src/tools/GlobTool.ts`
  - Extract `pattern` parameter for input display
  - Count lines in result output (matching files)
  - Format result as: `[X lines]`
  - Register tool: `toolRegistry.register('Glob', new GlobTool())`
- [ ] Create `src/tools/TaskTool.ts`
  - Extract `description` or `prompt` parameter for input display
  - Truncate to 40 characters
  - No result summary (return null)
  - Register tool: `toolRegistry.register('Task', new TaskTool())`
- [ ] Create `src/tools/WebFetchTool.ts`
  - Extract `url` parameter for input display
  - Truncate to 40 characters
  - No result summary (return null)
  - Register tool: `toolRegistry.register('WebFetch', new WebFetchTool())`
- [ ] Create `src/tools/WebSearchTool.ts`
  - Extract `query` parameter for input display
  - Truncate to 30 characters
  - No result summary (return null)
  - Register tool: `toolRegistry.register('WebSearch', new WebSearchTool())`
- [ ] Create tool definitions for remaining tools from goal.md:
  - `ExitPlanModeTool.ts`: Show truncated plan (5 words), no result
  - `NotebookEditTool.ts`: Show filename only, no result
  - `BashOutputTool.ts`: Show bash_id, no result
  - `KillShellTool.ts`: Show shell_id, no result
  - `SlashCommandTool.ts`: Show command, no result
- [ ] Update `src/tools/index.ts` to register all new tools

**Files Created:**
- `src/tools/BashTool.ts` (~40 lines)
- `src/tools/GrepTool.ts` (~50 lines)
- `src/tools/GlobTool.ts` (~50 lines)
- `src/tools/TaskTool.ts` (~40 lines)
- `src/tools/WebFetchTool.ts` (~40 lines)
- `src/tools/WebSearchTool.ts` (~40 lines)
- `src/tools/ExitPlanModeTool.ts` (~40 lines)
- `src/tools/NotebookEditTool.ts` (~40 lines)
- `src/tools/BashOutputTool.ts` (~30 lines)
- `src/tools/KillShellTool.ts` (~30 lines)
- `src/tools/SlashCommandTool.ts` (~35 lines)

**Verification:**
- [ ] Test all tool definitions with sample data
- [ ] Verify tools with result summaries show correct format
- [ ] Verify tools without result summaries show nothing after tool call
- [ ] Check truncation works correctly for long parameters

---

## Phase 4: Integrate Registry into Request List Display

**Goal**: Update MessagePreview component to use tool registry for displaying tool calls and results.

### Tasks

- [ ] Update `src/utils/messageFormatting.ts`
  - Import `toolRegistry` from `src/utils/toolRegistry.ts`
  - Update `formatToolCall()` function to use `toolRegistry.formatToolCall()` instead of switch statement
  - Add new function: `formatToolWithResult(toolUse: ToolUseBlock, result: ToolResultBlock): string`
  - Keep backward compatibility during migration
  - Mark old switch statement logic as deprecated
- [ ] Update `src/components/MessagePreview.tsx`
  - Line 110: Replace `[Tool result]` prefix with actual tool result formatting
  - Import `formatToolWithResult` from messageFormatting
  - Update `UserMessagePreview` component:
    - When showing tool results, format each result using registry
    - Display format: `ToolName(input, [result])` in amber color
    - Handle multiple tool results in same message
  - Update `AssistantMessagePreview` component:
    - Ensure tool calls continue using `formatToolCall` (via registry)
    - Maintain amber highlighting for tool calls
- [ ] Handle edge cases in MessagePreview:
  - Messages with both text and tool results
  - Messages with multiple tool results
  - Tool results without matching tool call (orphaned results)
  - Truncate long formatted strings appropriately

**Files Modified:**
- `src/utils/messageFormatting.ts` (update ~30 lines, add ~20 lines)
- `src/components/MessagePreview.tsx` (update ~40 lines)

**Verification:**
- [ ] Load trace with various tool calls and results
- [ ] Verify request list shows formatted tool calls: `Read(file.ts)`, `Bash(npm install)`
- [ ] Verify request list shows formatted tool results: `Read(file.ts, [250 lines])`
- [ ] Verify amber highlighting is preserved
- [ ] Test with messages containing multiple tool calls/results
- [ ] Check truncation works for long tool names/parameters

---

## Phase 5: Integrate Registry into Badge Display

**Goal**: Update ToolCallBadge to show result summaries in badge text.

### Tasks

- [ ] Update `src/components/ToolCallBadge.tsx`
  - Import `toolRegistry` and `ToolResultBlock` type
  - Add optional `toolResult?: ToolResultBlock` prop to `ToolCallBadgeProps`
  - Update badge text to show both input and result:
    - Without result: `ToolName(input)`
    - With result: `ToolName(input, [result])`
  - Use `toolRegistry.formatToolCall()` for input formatting
  - Use `toolRegistry.formatToolResult()` when result is available
  - Keep badge compact - may need to truncate very long formatted strings
  - Update tooltip to show full formatted text
- [ ] Update `src/components/ConversationView.tsx`
  - Pass `toolResult` prop to `ToolCallBadge` component
  - Tool result already available via `message.toolResults?.get(block.id)`
  - Update line ~94 to include result in badge props

**Files Modified:**
- `src/components/ToolCallBadge.tsx` (update ~30 lines)
- `src/components/ConversationView.tsx` (update ~10 lines)

**Verification:**
- [ ] Open request detail page with tool calls
- [ ] Verify badges show tool call format: `Read(file.ts)`
- [ ] Verify completed badges show result: `Read(file.ts, [250 lines])`
- [ ] Verify badges remain clickable and tooltip shows full text
- [ ] Check badge width is reasonable (truncate if needed)
- [ ] Verify color coding (green for completed, cyan for pending) still works

---

## Phase 6: Update Modal to Use Registry

**Goal**: Update ToolCallModal to allow custom rendering via tool registry.

### Tasks

- [ ] Update `src/utils/toolRegistry.ts`
  - Add support for custom renderers in `ToolDefinition`:
    - `renderCustomInput?(input: Record<string, any>): React.ReactNode | null`
    - `renderCustomResult?(result: ToolResultBlock): React.ReactNode | null`
  - Update `ToolRegistry` to expose these methods:
    - `hasCustomInputRenderer(toolName: string): boolean`
    - `hasCustomResultRenderer(toolName: string): boolean`
    - `renderCustomInput(toolName: string, input: Record<string, any>): React.ReactNode | null`
    - `renderCustomResult(toolName: string, result: ToolResultBlock): React.ReactNode | null`
- [ ] Update `src/components/ToolCallModal.tsx`
  - Import `toolRegistry`
  - Before rendering JSON for input parameters:
    - Check `toolRegistry.hasCustomInputRenderer(toolUse.name)`
    - If true, use `toolRegistry.renderCustomInput()` instead of JSON
  - Before rendering content for tool result:
    - Check `toolRegistry.hasCustomResultRenderer(toolUse.name)`
    - If true, use `toolRegistry.renderCustomResult()` instead of plain text
  - Fallback to current JSON/text rendering if no custom renderer
  - Update modal header to use `toolRegistry.getDisplayName()`
- [ ] Implement custom renderer for TodoWrite (optional enhancement)
  - Create visual todo list display in modal
  - Show todo items grouped by status
  - Use checkboxes and color coding

**Files Modified:**
- `src/utils/toolRegistry.ts` (add ~40 lines)
- `src/components/ToolCallModal.tsx` (update ~50 lines)
- `src/tools/TodoWriteTool.ts` (optional: add ~60 lines for custom renderer)

**Verification:**
- [ ] Open tool call modal for various tools
- [ ] Verify JSON fallback works for tools without custom renderers
- [ ] If TodoWrite custom renderer implemented, verify it displays nicely
- [ ] Test modal with tools that have custom input/result renderers
- [ ] Verify copy/download buttons still work with custom renderers
- [ ] Check keyboard shortcuts (ESC, Tab) still function correctly

---

## Phase 7: Cleanup and Testing

**Goal**: Remove old code, add tests, and polish the implementation.

### Tasks

- [ ] Remove deprecated code from `src/utils/messageFormatting.ts`
  - Remove old switch statement in `formatToolCall()` function (lines 232-275)
  - Update function to only use `toolRegistry.formatToolCall()`
  - Remove helper functions that are now in tool definitions
- [ ] Add unit tests for tool registry
  - Create `src/utils/toolRegistry.test.ts`
  - Test base tool definition with unknown tools
  - Test each custom tool definition with sample data
  - Test edge cases: null inputs, malformed results, missing parameters
- [ ] Add integration tests
  - Create `src/tests/toolDisplay.test.ts`
  - Test MessagePreview with tool calls and results
  - Test ToolCallBadge with and without results
  - Test ToolCallModal with custom renderers
- [ ] Visual polish
  - Review truncation lengths across all display locations
  - Ensure consistent spacing and styling
  - Check responsive behavior for long tool names
  - Verify accessibility (ARIA labels, keyboard navigation)
- [ ] Documentation
  - Add JSDoc comments to all public methods in tool registry
  - Create `docs/tool-registry-guide.md` with examples of adding new tools
  - Update existing comments in modified files

**Files Created:**
- `src/utils/toolRegistry.test.ts` (~200 lines)
- `src/tests/toolDisplay.test.ts` (~150 lines)
- `docs/tool-registry-guide.md` (~100 lines)

**Files Modified:**
- `src/utils/messageFormatting.ts` (remove ~60 lines)
- Various files (add JSDoc comments)

**Verification:**
- [ ] Run all unit tests: `npm test`
- [ ] Run full integration test suite
- [ ] Manual testing with real trace files:
  - Load trace with diverse tool usage
  - Navigate through request list, detail pages, and modals
  - Verify all tool displays are consistent and informative
- [ ] Performance check: Ensure no regression with large trace files
- [ ] Accessibility audit: Test keyboard navigation and screen readers
- [ ] Cross-browser testing: Verify in Chrome, Firefox, Safari

---

## Summary

This implementation creates a clean, extensible tool registry system that unifies tool display across the entire application. The phased approach ensures:

1. **Phase 1-2**: Foundation and core tools (Read, Write, Edit, TodoWrite)
2. **Phase 3**: Complete tool coverage following goal.md spec
3. **Phase 4-5**: Integration into request list and badges
4. **Phase 6**: Advanced modal customization
5. **Phase 7**: Polish and testing

Each phase is independently testable and delivers incremental value. The total implementation adds ~1,500 lines of new code and modifies ~200 lines of existing code.
