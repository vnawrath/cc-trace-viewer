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

## Phase 6: Update Modal to Use Registry ✅

**Goal**: Update ToolCallModal to allow custom rendering via tool registry.

### Tasks

- [x] Update `src/utils/toolRegistry.ts`
  - Custom renderer support was already implemented in Phase 1:
    - `renderCustomInput?(input: Record<string, any>): React.ReactNode | null`
    - `renderCustomResult?(result: ToolResultBlock): React.ReactNode | null`
  - Registry methods already available:
    - `hasCustomInputRenderer(toolName: string): boolean`
    - `hasCustomResultRenderer(toolName: string): boolean`
    - `renderCustomInput(toolName: string, input: Record<string, any>): React.ReactNode | null`
    - `renderCustomResult(toolName: string, result: ToolResultBlock): React.ReactNode | null`
- [x] Update `src/components/ToolCallModal.tsx`
  - Import `toolRegistry` from `src/tools`
  - Update modal header to use `toolRegistry.get(toolUse.name).getDisplayName(toolUse.name)`
  - Before rendering JSON for input parameters:
    - Check `toolRegistry.hasCustomInputRenderer(toolUse.name)`
    - If true, use `toolRegistry.renderCustomInput()` instead of JSON
    - Fallback to JSON rendering if no custom renderer
  - Before rendering content for tool result:
    - Check `toolRegistry.hasCustomResultRenderer(toolUse.name)`
    - If true, use `toolRegistry.renderCustomResult()` instead of plain text
    - Fallback to formatted text rendering if no custom renderer
  - Preserved copy/download button functionality
  - Maintained keyboard shortcuts (ESC, Tab)

**Files Modified:**

- `src/components/ToolCallModal.tsx` (updated 30 lines - added custom renderer support)

**Files Created:**

- `src/utils/phase6.test.ts` (171 lines - 12 comprehensive tests)

**Verification:**

- [x] All programmatic tests pass (12/12 tests)
  - Custom renderer detection: ✓
  - Custom input/result rendering: ✓
  - Fallback to default JSON/text rendering: ✓
  - Unknown tools use base definition: ✓
  - Standard tools have no custom renderers: ✓
- [x] TypeScript compiles without errors
- [x] Build succeeds with no warnings

**Status**: COMPLETED

- Successfully integrated tool registry custom renderer support into ToolCallModal
- Modal now checks for custom renderers before falling back to JSON/text display
- Modal header uses getDisplayName() from registry
- All existing functionality preserved (copy buttons, keyboard shortcuts, download)
- Infrastructure in place for future custom renderers (e.g., TodoWrite visual display)
- All automated tests passing

---

## Phase 7: Cleanup and Testing ✅

**Goal**: Remove old code, add tests, and polish the implementation.

### Tasks

- [x] Remove deprecated code from `src/utils/messageFormatting.ts`
  - Old switch statement was already removed in Phase 4
  - Function now only uses `toolRegistry.formatToolCall()` and `toolRegistry.formatToolResult()`
  - All formatting logic centralized in tool definitions
- [x] Add unit tests for tool registry
  - `src/utils/toolRegistry.test.ts` already exists from Phase 1 (138 lines)
  - Tests base tool definition with unknown tools
  - Tests each custom tool definition with sample data
  - Tests edge cases: null inputs, malformed results, missing parameters
- [x] Add integration tests
  - Created `src/tests/toolDisplay.test.ts` (406 lines)
  - Tests MessagePreview with tool calls and results
  - Tests ToolCallBadge with and without results
  - Tests ToolCallModal with custom renderers
  - Tests cross-component consistency
  - Tests edge cases and long input handling
- [x] Documentation
  - JSDoc comments already present on all public methods in tool registry
  - Created `docs/tool-registry-guide.md` with comprehensive examples (342 lines)
  - Includes architecture overview, step-by-step guide, and best practices

**Files Created:**

- `src/tests/toolDisplay.test.ts` (406 lines - comprehensive integration tests)
- `docs/tool-registry-guide.md` (342 lines - developer guide)

**Files Modified:**

- `src/utils/messageFormatting.ts` (already cleaned in Phase 4)
- `src/utils/toolRegistry.ts` (JSDoc already present)

**Verification:**

- [x] Run all unit tests: All tests pass
  - `src/utils/toolRegistry.test.ts`: ✓ (10/10 tests)
  - `src/tools/phase2.test.ts`: ✓ (11/11 tests)
  - `src/tools/phase3.test.ts`: ✓ (30/30 tests)
  - `src/utils/phase4.test.ts`: ✓ (6/6 tests)
  - `src/utils/phase5.test.ts`: ✓ (11/11 tests)
  - `src/utils/phase6.test.ts`: ✓ (12/12 tests)
  - `src/tests/toolDisplay.test.ts`: ✓ (50+ tests covering all components)
- [x] TypeScript compiles without errors: `npx tsc --noEmit` ✓
- [x] Build succeeds: `npm run build` ✓
- [ ] Manual testing with real trace files:
  - Load trace with diverse tool usage
  - Navigate through request list, detail pages, and modals
  - Verify all tool displays are consistent and informative
- [ ] Visual polish:
  - Review truncation lengths across all display locations
  - Ensure consistent spacing and styling
  - Check responsive behavior for long tool names
- [ ] Accessibility audit: Test keyboard navigation and screen readers
- [ ] Performance check: Ensure no regression with large trace files
- [ ] Cross-browser testing: Verify in Chrome, Firefox, Safari

**Status**: COMPLETED (Programmatic Testing)

- All deprecated code removed (completed in Phase 4)
- Comprehensive unit and integration tests created and passing (80+ tests total)
- Developer documentation created with examples and best practices
- TypeScript compiles without errors
- Build succeeds with no warnings
- All automated tests pass successfully
- Ready for manual testing and validation

---

## Phase 8: Implement Custom Renderers for Core Tools

**Goal**: Add custom React renderers for Read, Write, Edit, and TodoWrite tools to provide rich, tool-specific UI in the ToolCallModal.

**Rationale**: While Phases 1-7 implemented text-based formatting for badges and list displays, the modal can benefit from custom visual components that better present tool inputs and results. This phase completes the original goal.md requirement for custom modal renderers.

### Background Research

**Infrastructure (already in place from Phase 6):**

- `ToolCallModal.tsx` checks for custom renderers via `toolRegistry.hasCustomInputRenderer()` and `toolRegistry.hasCustomResultRenderer()`
- Falls back to JSON/text display if no custom renderer is defined
- Custom renderers receive the same styling containers as default renderers

**Existing Utilities:**

- `src/utils/messageFormatting.ts` provides `stripSystemReminders(text: string)` to clean tool output
- System reminders follow format: `<system-reminder>...</system-reminder>`
- Example files show real-world inputs/outputs: `Read-example.md`, `TodoWrite-example.md`, `Edit-example.md`, `Write-example.md`

### Tasks

#### Utility Functions

- [x] Create `src/utils/contentParsing.ts` with shared parsing utilities:
  - `parseLineNumberedContent(content: string): Array<{lineNum: number, text: string}>` - Parse content with format `{spaces}{lineNum}→{text}`
  - `stripSystemReminders(content: string): string` - Re-export from messageFormatting for convenience
  - `extractSystemReminders(content: string): string[]` - Extract all system-reminder tags into array
  - `countLines(content: string): number` - Count lines in content (handle both numbered and plain text)
  - TypeScript types for return values

#### ReadTool Custom Renderers

- [x] Update `src/tools/ReadTool.ts` to add custom renderers:
  - **`renderCustomInput(input)`**:
    - Display file path prominently with file icon
    - Show optional parameters if present (`offset`, `limit`)
    - Use cyan color for file path to match existing theme
    - Layout: Vertical stack with labeled rows
  - **`renderCustomResult(result)`**:
    - Strip system reminders using `stripSystemReminders()`
    - Parse line-numbered content using `parseLineNumberedContent()`
    - Display in monospace font with line numbers
    - Show file stats at top (total lines, range displayed if truncated)
    - Use `text-gray-300` for content, `text-gray-500` for line numbers
    - Consider adding a subtle border between line numbers and content
    - Handle both full file reads and partial reads (offset/limit)

#### WriteTool Custom Renderers

- [x] Update `src/tools/WriteTool.ts` to add custom renderers:
  - **`renderCustomInput(input)`**:
    - Display file path with "Create file" or "Overwrite file" indicator
    - Show file size/line count from `content` parameter
    - Use green accent for "create" operation
    - Preview first 3-5 lines of content with "... and X more lines" indicator
  - **`renderCustomResult(result)`**:
    - Strip system reminders
    - Parse success message to extract file path
    - Display success indicator with checkmark icon
    - Show operation type (created vs updated) with appropriate color
    - Keep minimal since result content is brief

#### EditTool Custom Renderers

- [x] Update `src/tools/EditTool.ts` to add custom renderers:
  - **`renderCustomInput(input)`**:
    - Display file path with "Edit file" indicator
    - Show a diff-style view of the change:
      - Old content in red background (`bg-red-950/30 border-red-700`)
      - New content in green background (`bg-green-950/30 border-green-700`)
      - Use `-` and `+` prefixes for clarity
    - Truncate if content is very long (>20 lines), with expand option
    - Handle multiline strings properly
  - **`renderCustomResult(result)`**:
    - Strip system reminders
    - Parse success message and extract snippet
    - Parse line-numbered snippet using `parseLineNumberedContent()`
    - Highlight the edited section (around the change)
    - Show context lines with muted styling
    - Display edit summary at top (X lines changed)

#### TodoWriteTool Custom Renderers

- [x] Update `src/tools/TodoWriteTool.ts` to add custom renderers:
  - **`renderCustomInput(input)`**:
    - Parse `todos` array from input
    - Display as visual todo list with status indicators:
      - **Pending**: Gray circle icon, `text-gray-400`
      - **In Progress**: Yellow/amber spinner or dot, `text-amber-400`
      - **Completed**: Green checkmark, `text-green-400`, strikethrough text
    - Show `content` field for each todo
    - Add progress bar at top showing completion percentage
    - Group by status or show in provided order (experiment with both)
  - **`renderCustomResult(result)`**:
    - Strip system reminders (which contain JSON state)
    - Parse result message for status counts
    - Display as a compact summary with colored badges:
      - "3 pending" in gray badge
      - "1 in progress" in amber badge
      - "4 completed" in green badge
    - Show progress percentage or bar
    - Keep minimal since the input view is more interesting

#### Styling and Polish

- [x] Create shared component styles in custom renderers:
  - Consistent spacing: `space-y-2` for compact sections, `space-y-4` for major sections
  - File paths: `text-cyan-400 bg-gray-800/50 px-2 py-1 rounded font-mono text-sm`
  - Section labels: `text-gray-400 text-xs uppercase tracking-wide`
  - Success indicators: Use Heroicons checkmark with `text-green-400`
  - Code blocks: `font-mono text-sm bg-gray-950 border border-gray-700 rounded p-2`
  - Line numbers: `text-gray-500 text-xs select-none mr-3`
  - Diff backgrounds: Match ToolCallModal success/error colors
- [x] Ensure responsive behavior:
  - Wrap long file paths
  - Truncate inline code snippets appropriately
  - Add horizontal scroll for wide code blocks
- [x] Accessibility:
  - Add `aria-label` to icons
  - Ensure color is not the only indicator (use icons + text)
  - Support keyboard navigation within custom components

#### System Reminder Handling

- [x] Implement consistent system-reminder handling across all tools:
  - Use `stripSystemReminders()` to remove from displayed content
  - Never show system reminders in custom renderers (they're internal Claude context)
  - If debugging is needed, optionally add a dev-only "Show raw output" toggle
  - Test with real example files that contain system reminders

### Files Modified

- `src/tools/ReadTool.ts` - Add ~80 lines for custom renderers
- `src/tools/WriteTool.ts` - Add ~60 lines for custom renderers
- `src/tools/EditTool.ts` - Add ~100 lines for custom renderers
- `src/tools/TodoWriteTool.ts` - Add ~90 lines for custom renderers

### Files Created

- `src/utils/contentParsing.ts` (~100 lines - shared parsing utilities)
- `src/tools/phase8.test.tsx` (~400 lines - React component rendering tests)

### Verification

- [x] Unit tests for parsing utilities:
  - `parseLineNumberedContent()` with various formats
  - `stripSystemReminders()` with nested/escaped tags
  - `extractSystemReminders()` with multiple reminders
  - Edge cases: empty content, malformed line numbers
- [x] Component rendering tests:
  - Each tool's custom input renderer with example data
  - Each tool's custom result renderer with example data
  - Verify system reminders are stripped from output
  - Test with real data from `*-example.md` files
- [ ] Visual testing in browser:
  - Open ToolCallModal for each tool type
  - Verify custom renderers display correctly
  - Check that copy/download buttons still work
  - Test with long content (truncation, scrolling)
  - Verify fallback to JSON/text for tools without custom renderers
- [ ] Integration testing:
  - Load real trace files with Read, Write, Edit, TodoWrite tools
  - Click through multiple tool modals in sequence
  - Verify consistent styling across all custom renderers
  - Test responsive behavior with different viewport sizes
- [ ] Accessibility audit:
  - Screen reader testing on custom components
  - Keyboard navigation through modals
  - Color contrast checks
  - Icon alt text verification
- [x] TypeScript and build:
  - `npx tsc --noEmit` passes ✓
  - `npm run build` succeeds with no warnings ✓
  - No console errors in browser (to be verified)

**Status**: IMPLEMENTATION COMPLETE - AWAITING MANUAL TESTING

- All utility functions implemented and tested
- All custom renderers implemented for Read, Write, Edit, and TodoWrite tools
- TypeScript compiles without errors
- Build succeeds successfully
- Comprehensive test suite created (phase8.test.tsx with 33+ tests)
- Ready for browser-based visual testing and validation

---

## Summary

This implementation creates a clean, extensible tool registry system that unifies tool display across the entire application. The phased approach ensures:

1. **Phase 1-2**: Foundation and core tools (Read, Write, Edit, TodoWrite)
2. **Phase 3**: Complete tool coverage following goal.md spec
3. **Phase 4-5**: Integration into request list and badges
4. **Phase 6**: Advanced modal customization infrastructure
5. **Phase 7**: Polish and testing
6. **Phase 8**: Custom modal renderers for core tools

Each phase is independently testable and delivers incremental value. The total implementation adds ~2,000 lines of new code and modifies ~250 lines of existing code.
