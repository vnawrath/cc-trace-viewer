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

## Phase 2: Implement Core Tool Definitions ✅

**Goal**: Implement custom tool definitions for Read, Write, Edit, and TodoWrite as specified in goal.md.

### Tasks

- [x] Create `src/tools/ReadTool.ts`
  - Extract filename from `file_path` parameter for input display
  - Parse result content to count lines of output
  - Format result as: `[X lines]` where X is line count from result content
  - Handle both string and array content formats (see `Read-example.md`)
  - Register tool: `toolRegistry.register('Read', new ReadTool())`
- [x] Create `src/tools/WriteTool.ts`
  - Extract filename from `file_path` parameter for input display
  - Check result content for success/creation message
  - Format result as: `[X lines]` based on content length written
  - Handle "File created" vs "File updated" cases (see `Write-example.md`)
  - Register tool: `toolRegistry.register('Write', new WriteTool())`
- [x] Create `src/tools/EditTool.ts`
  - Extract filename from `file_path` parameter for input display
  - Parse result content showing file edit confirmation
  - Format result as: `[X lines]` based on the snippet shown in result (see `Edit-example.md`)
  - Register tool: `toolRegistry.register('Edit', new EditTool())`
- [x] Create `src/tools/TodoWriteTool.ts`
  - Parse `todos` array from input to count total todos
  - Format input as: `X todos` (total count)
  - Parse result content to extract todo status counts
  - Format result as: `[X pending, Y in progress, Z completed]` (see `TodoWrite-example.md`)
  - Register tool: `toolRegistry.register('TodoWrite', new TodoWriteTool())`
- [x] Create `src/tools/index.ts` barrel export
  - Import and register all tool definitions
  - Ensure registration happens on module load

**Files Created:**
- `src/tools/ReadTool.ts` (69 lines)
- `src/tools/WriteTool.ts` (47 lines)
- `src/tools/EditTool.ts` (52 lines)
- `src/tools/TodoWriteTool.ts` (61 lines)
- `src/tools/index.ts` (22 lines)
- `src/tools/phase2.test.ts` (234 lines - comprehensive test suite)

**Verification:**
- [x] Create test file with sample tool calls and results from example files
- [x] Verify `Read(file.ts)` displays correctly with result `[250 lines]`
- [x] Verify `TodoWrite(8 todos)` displays with result `[3 pending, 1 in progress, 4 completed]`
- [x] Verify `Edit(file.tsx)` and `Write(file.ts)` display with line counts
- [x] Test edge cases: empty results, malformed data, missing parameters

**Status**: COMPLETED
- Created all four core tool definitions with proper input/result formatting
- Implemented line counting for Read, Write, and Edit tools
- Implemented status breakdown for TodoWrite tool
- All tools registered successfully in barrel export
- Comprehensive test suite with 11 tests covering all scenarios (all tests pass)
- TypeScript compiles without errors
- Build succeeds with no warnings

---

## Phase 3: Implement Additional Tool Definitions ✅

**Goal**: Add tool definitions for remaining tools following goal.md specification.

### Tasks

- [x] Create `src/tools/BashTool.ts`
  - Extract `command` parameter for input display
  - Truncate long commands to 40 characters
  - No result summary (return null)
  - Register tool: `toolRegistry.register('Bash', new BashTool())`
- [x] Create `src/tools/GrepTool.ts`
  - Extract `pattern` parameter for input display
  - Count lines in result output
  - Format result as: `[X lines]`
  - Register tool: `toolRegistry.register('Grep', new GrepTool())`
- [x] Create `src/tools/GlobTool.ts`
  - Extract `pattern` parameter for input display
  - Count lines in result output (matching files)
  - Format result as: `[X lines]`
  - Register tool: `toolRegistry.register('Glob', new GlobTool())`
- [x] Create `src/tools/TaskTool.ts`
  - Extract `description` or `prompt` parameter for input display
  - Truncate to 40 characters
  - No result summary (return null)
  - Register tool: `toolRegistry.register('Task', new TaskTool())`
- [x] Create `src/tools/WebFetchTool.ts`
  - Extract `url` parameter for input display
  - Truncate to 40 characters
  - No result summary (return null)
  - Register tool: `toolRegistry.register('WebFetch', new WebFetchTool())`
- [x] Create `src/tools/WebSearchTool.ts`
  - Extract `query` parameter for input display
  - Truncate to 30 characters
  - No result summary (return null)
  - Register tool: `toolRegistry.register('WebSearch', new WebSearchTool())`
- [x] Create tool definitions for remaining tools from goal.md:
  - `ExitPlanModeTool.ts`: Show truncated plan (5 words), no result
  - `NotebookEditTool.ts`: Show filename only, no result
  - `BashOutputTool.ts`: Show bash_id, no result
  - `KillShellTool.ts`: Show shell_id, no result
  - `SlashCommandTool.ts`: Show command, no result
- [x] Update `src/tools/index.ts` to register all new tools

**Files Created:**
- `src/tools/BashTool.ts` (34 lines)
- `src/tools/GrepTool.ts` (57 lines)
- `src/tools/GlobTool.ts` (57 lines)
- `src/tools/TaskTool.ts` (34 lines)
- `src/tools/WebFetchTool.ts` (34 lines)
- `src/tools/WebSearchTool.ts` (34 lines)
- `src/tools/ExitPlanModeTool.ts` (38 lines)
- `src/tools/NotebookEditTool.ts` (29 lines)
- `src/tools/BashOutputTool.ts` (26 lines)
- `src/tools/KillShellTool.ts` (26 lines)
- `src/tools/SlashCommandTool.ts` (26 lines)
- `src/tools/phase3.test.ts` (301 lines - comprehensive test suite with 30 tests)
- Updated `src/tools/index.ts` (57 lines)

**Verification:**
- [x] Test all tool definitions with sample data (30 tests, all passing)
- [x] Verify tools with result summaries show correct format (Grep and Glob)
- [x] Verify tools without result summaries show nothing after tool call (Bash, Task, WebFetch, WebSearch, ExitPlanMode, NotebookEdit, BashOutput, KillShell, SlashCommand)
- [x] Check truncation works correctly for long parameters (Bash, Task, WebFetch, WebSearch, ExitPlanMode)
- [x] TypeScript compiles without errors
- [x] Build succeeds with no warnings

**Status**: COMPLETED
- Created all 11 additional tool definitions with proper input formatting and result summaries
- Implemented line counting for Grep and Glob tools
- Implemented truncation for Bash (40 chars), Task (40 chars), WebFetch (40 chars), WebSearch (30 chars), and ExitPlanMode (5 words)
- All tools registered successfully in barrel export
- Comprehensive test suite with 30 tests covering all scenarios (all tests pass)
- TypeScript compiles without errors
- Build succeeds with no warnings

---

## Phase 4: Integrate Registry into Request List Display ✅

**Goal**: Update MessagePreview component to use tool registry for displaying tool calls and results.

### Tasks

- [x] Update `src/utils/messageFormatting.ts`
  - Import `toolRegistry` from `src/tools/index.ts`
  - Update `formatToolCall()` function to use `toolRegistry.formatToolCall()` instead of switch statement
  - Add new function: `formatToolWithResult(toolUse: ToolUseBlock, result: ToolResultBlock): string`
  - Replaced old switch statement logic with registry calls
  - Fixed type compatibility by importing types from `conversationProcessor`
- [x] Update `src/components/MessagePreview.tsx`
  - Line 110: Replace `[Tool result]` prefix with actual tool result formatting
  - Import `formatToolWithResult` from messageFormatting
  - Update `UserMessagePreview` component:
    - When showing tool results, format each result using registry
    - Display format: `ToolName(input, [result])` in amber color
    - Handle multiple tool results in same message
    - Build map of tool_use_id to ToolUseBlock to match results to calls
  - Update `AssistantMessagePreview` component:
    - Tool calls continue using `formatToolCall` (via registry)
    - Maintain amber highlighting for tool calls
- [x] Handle edge cases in MessagePreview:
  - Messages with both text and tool results
  - Messages with multiple tool results
  - Tool results without matching tool call (fallback to old behavior)
  - Truncate long formatted strings appropriately

**Files Modified:**
- `src/utils/messageFormatting.ts` (replaced ~65 lines with ~15 lines, removed switch statement)
- `src/components/MessagePreview.tsx` (updated ~40 lines with tool result matching logic)

**Files Created:**
- `src/utils/phase4.test.ts` (145 lines - integration tests)

**Verification:**
- [x] All programmatic tests pass (6/6 tests)
  - Read tool call formatting: ✓
  - Bash tool call formatting: ✓
  - Read tool with result summary: ✓
  - TodoWrite tool with result summary: ✓
  - Bash tool with no result summary: ✓
  - Unknown tool with base definition: ✓
- [x] TypeScript compiles without errors
- [x] Build succeeds with no warnings

**Status**: COMPLETED
- Successfully integrated tool registry into request list display
- Tool calls now formatted using registry (removed ~60 lines of switch statement code)
- Tool results now show proper format: `ToolName(input, [result_summary])`
- Amber highlighting preserved for tool calls and results
- Edge cases handled: orphaned results, multiple results, missing tool calls
- All automated tests passing

---

## Phase 5: Integrate Registry into Badge Display ✅

**Goal**: Update ToolCallBadge to show result summaries in badge text.

### Tasks

- [x] Update `src/components/ToolCallBadge.tsx`
  - Import `toolRegistry` and `ToolResultBlock` type
  - Add optional `toolResult?: ToolResultBlock` prop to `ToolCallBadgeProps`
  - Update badge text to show both input and result:
    - Without result: `ToolName(input)`
    - With result: `ToolName(input, [result])`
  - Use `toolRegistry.formatToolCall()` for input formatting
  - Use `toolRegistry.formatToolResult()` when result is available
  - Truncate if badge text exceeds 60 characters
  - Update tooltip to show full formatted text
- [x] Update `src/components/ConversationView.tsx`
  - Pass `toolResult` prop to `ToolCallBadge` component
  - Tool result already available via `message.toolResults?.get(block.id)`
  - Update line ~94 to include result in badge props

**Files Modified:**
- `src/components/ToolCallBadge.tsx` (updated 30 lines - replaced manual parameter extraction with tool registry)
- `src/components/ConversationView.tsx` (updated 1 line - added toolResult prop)

**Files Created:**
- `src/utils/phase5.test.ts` (223 lines - 11 integration tests)

**Verification:**
- [x] All programmatic tests pass (11/11 tests)
  - Read tool call and result formatting: ✓
  - TodoWrite tool call and result formatting: ✓
  - Bash tool with no result summary: ✓
  - Write tool with result summary: ✓
  - Grep tool with result summary: ✓
  - Task tool with no result summary: ✓
  - Long command truncation: ✓
- [x] TypeScript compiles without errors
- [x] Build succeeds with no warnings

**Status**: COMPLETED
- Successfully integrated tool registry into badge display
- Badges now show formatted input for tool calls: `ToolName(input)`
- Badges show formatted input + result summary for completed tools: `ToolName(input, [result])`
- Tools without result summaries show same format for call and result
- Badge text is truncated to 60 characters max for compact display
- Tooltip shows full formatted text without truncation
- Color coding preserved (green for completed, cyan for pending)
- All automated tests passing

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
