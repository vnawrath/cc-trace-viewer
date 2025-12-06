# Implementation Plan: Enhanced Message Display

## Goal

Reconstruct and display the complete conversation flow in the Messages tab of the Request Detail page, showing:

- System message at the top
- Alternating user and assistant messages with all content blocks
- Tool calls (tool_use blocks) with their parameters
- Tool results (tool_result blocks) paired with their tool_use blocks
- Final assistant response from the API response

## Overview

Currently, the Messages tab in `RequestDetailPage.tsx` only displays text content from messages, ignoring tool_use and tool_result blocks. This implementation will enhance the message display to show the complete conversation including all tool interactions, similar to how claude-trace renders conversations.

### Architecture

**Data Flow:**

```
ClaudeTraceEntry
  → processConversation()
  → ConversationMessage[] (with paired tools)
  → ConversationRenderer (UI component)
```

**Key Design Decisions:**

- **Tool Display:** Compact badges showing tool name + status, click to open modal with full details
- **Content Handling:** Tool parameters and results always collapsed, require user interaction to expand
- **Phase Strategy:** Incremental UI development (structure → tool calls → tool results → polish)

---

## Phase 1: Basic Conversation Structure

**Goal:** Create the foundation for displaying the complete conversation with proper message ordering.

### Context & Relevant Files

**Current Implementation:**

- `src/pages/RequestDetailPage.tsx:40-76` - `extractMessageContent()` function extracts only text content
- `src/pages/RequestDetailPage.tsx:364-388` - Messages tab renders only text messages
- `src/types/trace.ts:1-49` - Type definitions for `ClaudeTraceEntry`, `TraceRequest`, `TraceResponse`

**Claude-Trace Reference:**

- `docs/claude-trace/src/shared-conversation-processor.ts:590-638` - `processToolResults()` pairs tool_use with tool_result
- `docs/claude-trace/src/types.ts:28-32` - `EnhancedMessageParam` type with `toolResults` map
- `docs/claude-trace/frontend/src/components/simple-conversation-view.ts:671-729` - Conversation rendering

### Critical Bug: Streaming Response Parsing Does Not Extract Tool Calls

**Problem:** The current `reconstructResponseFromStream()` function in `src/services/traceParser.ts:409-478` has a fundamental flaw - it only extracts text content from streaming responses, completely ignoring tool_use blocks.

**Current Behavior:**

```typescript
// Line 461-464: Only builds a single text block
const reconstructedMessage = {
  content: [{ type: "text", text: contentPieces.join("") }], // Missing tool_use blocks!
};
```

**How Streaming Tool Calls Work (SSE format):**

1. `content_block_start` at index 0: `{"type":"text","text":""}` - initial text block
2. `content_block_delta` with `text_delta`: `{"text":"I'll implement..."}` - builds text
3. `content_block_start` at index 1: `{"type":"tool_use","id":"toolu_...","name":"Read","input":{}}` - tool block with empty input
4. `content_block_delta` with `input_json_delta`: `{"partial_json":"{\"file_path\": \"/Users..."}` - partial JSON
5. More `input_json_delta` events building up the JSON string
6. `content_block_stop` - signals to parse accumulated JSON into `input` object

**What's Missing:**

- Not tracking multiple content blocks by index
- Not processing `content_block_start` events for tool_use blocks (id, name)
- Not handling `input_json_delta` events (tool parameters)
- Not parsing accumulated JSON on `content_block_stop`

**Reference Implementation:** See `docs/claude-trace/src/shared-conversation-processor.ts:292-440` (`buildMessageFromEvents`) for the correct approach.

### Tasks

- [x] **Fix `reconstructResponseFromStream()` in `src/services/traceParser.ts` to properly extract tool_use blocks**

  - Refactor to track all content blocks by their `index` field (use array: `contentBlocks[]`)
  - On `content_block_start`: initialize block at `contentBlocks[event.index]` with initial data (type, id, name for tool_use)
  - On `content_block_delta`:
    - For `text_delta`: append `delta.text` to the text block
    - For `input_json_delta`: accumulate `delta.partial_json` as a string on the tool_use block
  - On `content_block_stop`: if block is `tool_use` with string input, parse JSON into `input` object
  - Build final content array: `content: contentBlocks.filter(block => block != null)`
  - Reference: `docs/claude-trace/src/shared-conversation-processor.ts:292-440` (`buildMessageFromEvents`)

- [x] Create new utility service `src/services/conversationProcessor.ts`

  - Export `ConversationMessage` interface with fields:
    - `role: 'system' | 'user' | 'assistant'`
    - `content: ContentBlock[]` - Array of content blocks (text, tool_use, tool_result)
    - `toolResults?: Map<string, ToolResultBlock>` - Maps tool_use_id to tool_result for pairing
  - Export `ContentBlock` union type for `TextBlock | ToolUseBlock | ToolResultBlock`
  - Implement `processConversation(entry: ClaudeTraceEntry): ConversationMessage[]` function that:
    - Extracts system message if present (from `entry.request.body.system`)
    - Extracts all messages from `entry.request.body.messages` preserving order
    - Parses content blocks from each message (text, tool_use, tool_result)
    - Appends final assistant response from `entry.response.body.content` or reconstructed from `entry.response.body_raw`
    - Returns array of `ConversationMessage` objects

- [x] Create new component `src/components/ConversationView.tsx`

  - Accept props: `entry: ClaudeTraceEntry`
  - Call `processConversation()` to get messages
  - Render messages in order:
    - System message with distinct styling (purple border-left, purple background tint)
    - User messages (cyan border-left, cyan background tint)
    - Assistant messages (green border-left, green background tint)
  - For now, render only text blocks from each message (ignore tool blocks)
  - Use similar styling to current `CopyableText` component for consistency

- [x] Update `src/pages/RequestDetailPage.tsx`
  - Replace the Messages tab content (lines 365-388) with `<ConversationView entry={request} />`
  - Remove or deprecate `extractMessageContent()` function (lines 40-76) as it's replaced by `processConversation()`
  - Keep other tabs (Raw Request, Raw Response, Headers, Tools) unchanged

### Verification & Testing

- [x] Verify `reconstructResponseFromStream()` correctly extracts tool_use blocks from streaming responses
- [x] Verify tool_use blocks have proper id, name, and parsed input object (not empty `{}`)
- [ ] Verify system message displays at top with purple styling
- [ ] Verify user and assistant messages alternate correctly
- [ ] Verify final assistant response appears at the end (including any tool calls)
- [ ] Test with streaming responses (body_raw) and non-streaming responses (body)
- [ ] Test with conversations containing multiple message pairs
- [ ] Confirm no regression in other tabs (Raw Request, Raw Response, Headers, Tools)

**Test Cases:**

1. Request with system message + 1 user/assistant pair + final response
2. Request with no system message
3. Request with multiple user/assistant pairs (conversation history)
4. Streaming response (body_raw present) with text-only content
5. **Streaming response with tool_use blocks** (verify tool id, name, and input are extracted)
6. Streaming response with multiple content blocks (text + multiple tool_use)
7. Non-streaming response (body present) with tool_use blocks

---

## Phase 2: Tool Call Display

**Goal:** Display tool_use blocks from assistant messages as compact badges with modal for details.

**Dependency:** Phase 1 must be complete, including the `reconstructResponseFromStream()` fix. Without proper streaming response parsing, tool_use blocks from streaming responses won't be available for display.

### Context & Relevant Files

**Current Implementation:**

- `src/pages/RequestDetailPage.tsx:78-133` - `extractToolCallsFromResponse()` extracts tool calls (currently used in Tools tab)
- `src/components/ToolUsageDisplay.tsx` - Existing component for displaying tool summaries
- `src/pages/RequestDetailPage.tsx:441-548` - Tools tab shows tool definitions and calls

**Claude-Trace Reference:**

- `docs/claude-trace/frontend/src/components/simple-conversation-view.ts:544-574` - `renderToolContainer()` for tool display
- `docs/claude-trace/frontend/src/components/simple-conversation-view.ts:325-391` - `getToolDisplayName()` formats tool names

### Tasks

- [ ] Define tool block types in `src/services/conversationProcessor.ts` (types already exist, verify they match streaming parser output)

  - Add `ToolUseBlock` interface:
    - `type: 'tool_use'`
    - `id: string`
    - `name: string`
    - `input: Record<string, unknown>`
  - Update `ContentBlock` union to include `ToolUseBlock`
  - Update `processConversation()` to extract tool_use blocks from assistant messages

- [ ] Create `src/components/ToolCallBadge.tsx` component

  - Props: `toolUse: ToolUseBlock`, `onClick: () => void`
  - Render compact badge with:
    - Tool icon (gear/settings icon)
    - Tool name (e.g., "Read", "Bash", "Edit")
    - Status indicator (cyan color for tool call without result yet)
    - Clickable, triggers `onClick` to open modal
  - Styling: Small, inline badge (similar to tool badges in Tools tab)

- [ ] Create `src/components/ToolCallModal.tsx` component

  - Props: `toolUse: ToolUseBlock | null`, `onClose: () => void`
  - Render modal overlay when `toolUse` is not null
  - Display in modal:
    - Tool name (header)
    - Tool ID
    - Tool input parameters (formatted JSON with syntax highlighting)
    - Copy button for JSON
    - Close button (X) and click outside to close
  - Use similar styling to existing modals in the app

- [ ] Update `src/components/ConversationView.tsx`
  - Add state for modal: `const [selectedTool, setSelectedTool] = useState<ToolUseBlock | null>(null)`
  - When rendering content blocks, check for tool_use type
  - For each tool_use block, render `<ToolCallBadge>` inline with text
  - Render `<ToolCallModal>` at component root level
  - Example layout for assistant message with tool:
    ```
    [assistant]
    Text before tool...
    <ToolCallBadge name="Read" onClick={() => setSelectedTool(toolUse)} />
    Text after tool...
    ```

### Verification & Testing

- [ ] Verify tool_use blocks appear as compact badges inline with message text
- [ ] Verify clicking badge opens modal with tool details
- [ ] Verify modal displays tool name, ID, and formatted input parameters
- [ ] Verify modal closes on X click and outside click
- [ ] Verify copy button in modal works correctly
- [ ] Test with messages containing multiple tool calls
- [ ] Test with different tool types (Read, Bash, Edit, Grep, etc.)

**Test Cases:**

1. Assistant message with single tool_use block
2. Assistant message with multiple tool_use blocks
3. Assistant message with text before and after tool_use
4. Assistant message with only tool_use (no text)
5. Tool calls with large input parameters (long file paths, big JSON objects)

---

## Phase 3: Tool Result Pairing and Display

**Goal:** Pair tool_result blocks with their corresponding tool_use blocks and display results.

### Context & Relevant Files

**Current Implementation:**

- Tool results currently not extracted or displayed anywhere in the UI

**Claude-Trace Reference:**

- `docs/claude-trace/src/shared-conversation-processor.ts:590-638` - `processToolResults()` implements pairing logic
- `docs/claude-trace/src/types.ts:28-32` - `EnhancedMessageParam` with `toolResults` map
- `docs/claude-trace/frontend/src/components/simple-conversation-view.ts:544-574` - Renders tool results below tool_use

**Pairing Algorithm (from claude-trace):**

1. Scan through messages sequentially
2. When assistant message has tool_use block, track it by `tool_use.id`
3. When user message has tool_result block, match it to pending tool_use by `tool_result.tool_use_id`
4. Store the pairing in assistant message's `toolResults` map: `{ [tool_use_id]: tool_result }`
5. Mark user messages that contain only tool_result blocks as hidden (they're just API plumbing)

### Tasks

- [ ] Define tool result types in `src/services/conversationProcessor.ts`

  - Add `ToolResultBlock` interface:
    - `type: 'tool_result'`
    - `tool_use_id: string`
    - `content: string | Array<{type: string; [key: string]: unknown}>` - Result content
    - `is_error?: boolean`
  - Update `ContentBlock` union to include `ToolResultBlock`
  - Update `ConversationMessage` to include:
    - `toolResults?: Map<string, ToolResultBlock>` - Maps tool_use_id to result
    - `hide?: boolean` - Flag to hide messages with only tool_result blocks

- [ ] Implement tool pairing in `src/services/conversationProcessor.ts`

  - Add `pairToolResults(messages: ConversationMessage[]): ConversationMessage[]` function
  - Algorithm:
    ```
    1. Create pendingToolUses map: { [tool_use_id]: messageIndex }
    2. Loop through messages:
       a. If assistant message has tool_use blocks:
          - Track each tool_use.id in pendingToolUses
       b. If user message has tool_result blocks:
          - Find corresponding tool_use in pendingToolUses
          - Add tool_result to that assistant message's toolResults map
          - Remove from pendingToolUses
       c. If user message has ONLY tool_result blocks (no text):
          - Set message.hide = true
    3. Return enhanced messages
    ```
  - Call `pairToolResults()` at the end of `processConversation()` before returning

- [ ] Update `src/components/ToolCallModal.tsx`

  - Add prop: `toolResult?: ToolResultBlock`
  - Update layout to show result if present:
    - Tool input section (collapsible)
    - Tool result section (collapsible, collapsed by default)
    - Result status badge (success/error)
    - Result content (formatted text or JSON)
    - Copy button for result content
  - Style error results with red tint, success with green tint

- [ ] Update `src/components/ToolCallBadge.tsx`

  - Add prop: `hasResult: boolean`
  - Update status indicator:
    - If `hasResult === true`: Show green checkmark icon + green tint
    - If `hasResult === false`: Show cyan pending icon + cyan tint
  - Keep clickable behavior to open modal with result

- [ ] Update `src/components/ConversationView.tsx`
  - Filter out hidden messages when rendering: `messages.filter(msg => !msg.hide)`
  - When rendering tool_use blocks, check if `message.toolResults` has matching result
  - Pass `toolResult` to modal when tool is clicked
  - Pass `hasResult` to badge component

### Verification & Testing

- [ ] Verify tool_result blocks are paired correctly with tool_use blocks by ID
- [ ] Verify user messages with only tool_result blocks are hidden
- [ ] Verify tool badges show green checkmark when result is available
- [ ] Verify tool badges show cyan pending icon when result is not available
- [ ] Verify modal displays both input and result when result is available
- [ ] Verify result section is collapsed by default
- [ ] Verify error results are styled with red tint
- [ ] Test with multiple tool calls and results in single conversation
- [ ] Test with unpaired tool calls (result not yet available)

**Test Cases:**

1. Assistant message with tool_use → User message with tool_result (proper pairing)
2. Assistant message with multiple tool_use → User message with multiple tool_result
3. User message with only tool_result blocks (should be hidden)
4. User message with text + tool_result blocks (should be visible)
5. Tool call with error result (is_error: true)
6. Tool call with very long result content (file contents, command output)
7. Streaming response with tool calls and results

---

## Phase 4: Polish and UX Enhancements

**Goal:** Improve user experience with better styling, interactions, and edge case handling.

### Context & Relevant Files

**Current Implementation:**

- `src/components/CopyableText.tsx` - Reusable component with copy functionality
- `src/pages/RequestDetailPage.tsx:302-360` - Tab navigation with keyboard shortcuts
- `src/utils/messageFormatting.ts` - Utility functions for formatting messages

**Claude-Trace Reference:**

- `docs/claude-trace/frontend/src/utils/markdown.ts` - Markdown rendering for text content
- `docs/claude-trace/frontend/src/components/simple-conversation-view.ts:82-145` - Content formatting with markdown

### Tasks

- [ ] Enhance text content rendering in `src/components/ConversationView.tsx`

  - Add markdown rendering for text blocks (similar to claude-trace)
  - Install and configure markdown parser (e.g., `marked` or `markdown-it`)
  - Apply syntax highlighting for code blocks in text
  - Preserve line breaks and formatting
  - Handle edge cases: empty content, malformed markdown

- [ ] Improve tool result display in `src/components/ToolCallModal.tsx`

  - Add line numbers for large text outputs
  - Add "Copy" button for result content
  - Add "Download" button for very large results (>10KB)
  - Detect and format JSON results automatically
  - Detect and highlight code in results (bash output, file contents)
  - Add search/filter for long results

- [ ] Add keyboard shortcuts to modal

  - `Escape` key to close modal
  - `Ctrl+C` / `Cmd+C` to copy content
  - `Tab` to switch between input and result sections

- [ ] Enhance tool badge UI in `src/components/ToolCallBadge.tsx`

  - Add tooltip on hover showing tool name and status
  - Add loading animation for pending results (if applicable)
  - Add icons for different tool types (file icon for Read, terminal for Bash, etc.)
  - Consider showing key parameter in badge (e.g., "Read(file.txt)" instead of just "Read")

- [ ] Handle edge cases in `src/services/conversationProcessor.ts`

  - Handle missing response body (failed requests)
  - Handle malformed content blocks
  - Handle unpaired tool calls (tool_use without tool_result)
  - Handle duplicate tool_use_id (edge case, should log warning)
  - Handle very large conversations (>100 messages)

- [ ] Add loading states and error handling

  - Show skeleton loader while processing conversation
  - Show error message if conversation processing fails
  - Gracefully degrade if tool pairing fails (show unmatched tools separately)

- [ ] Performance optimizations

  - Memoize `processConversation()` result with `useMemo`
  - Virtualize message list for very long conversations (react-window or similar)
  - Lazy-load tool result content when modal opens (don't process until needed)

- [ ] Accessibility improvements
  - Add ARIA labels to badges, buttons, and modal
  - Ensure modal is keyboard navigable
  - Ensure proper focus management when modal opens/closes
  - Add screen reader announcements for tool status changes

### Verification & Testing

- [ ] Verify markdown renders correctly in text blocks (bold, italic, code, links)
- [ ] Verify code blocks have syntax highlighting
- [ ] Verify tool badges have appropriate icons and tooltips
- [ ] Verify keyboard shortcuts work in modal (Escape, Ctrl+C, Tab)
- [ ] Verify copy and download buttons work for tool results
- [ ] Verify performance with large conversations (>50 messages)
- [ ] Verify graceful handling of malformed data
- [ ] Verify accessibility with keyboard navigation and screen readers
- [ ] Test with failed requests (no response body)
- [ ] Test with unpaired tool calls

**Test Cases:**

1. Message with markdown formatting (bold, italic, code, lists)
2. Message with code blocks (JavaScript, Python, Bash)
3. Very long conversation (>100 messages)
4. Failed request with no response body
5. Malformed content blocks (missing fields, wrong types)
6. Keyboard navigation through conversation and modal
7. Screen reader testing with NVDA or VoiceOver
8. Tool result with very large content (>100KB)
9. Tool call with no matching result
10. Multiple tool calls with same name but different parameters

---

## Implementation Notes

### File Structure

New files to create:

```
src/
  services/
    conversationProcessor.ts          # Phase 1: Core conversation processing
  components/
    ConversationView.tsx              # Phase 1: Main conversation display
    ToolCallBadge.tsx                 # Phase 2: Compact tool badge
    ToolCallModal.tsx                 # Phase 2: Tool details modal
```

Modified files:

```
src/
  pages/
    RequestDetailPage.tsx             # Phase 1: Replace Messages tab content
  types/
    trace.ts                          # Phase 1-3: Add new types as needed
```

### Dependencies

Potential new dependencies:

- **markdown-it** or **marked** (Phase 4): Markdown parsing and rendering
- **highlight.js** or **prism** (Phase 4): Syntax highlighting for code blocks
- **react-window** (Phase 4, optional): Virtual scrolling for long conversations

### Design System Consistency

Maintain consistency with existing components:

- Use existing color tokens from Tailwind config (`terminal-cyan`, `terminal-green`, etc.)
- Match styling of `CopyableText` component for text blocks
- Match badge styling from Tools tab
- Use existing modal patterns from the app
- Follow existing component structure and naming conventions

### Data Flow Summary

```
RequestDetailPage
  ↓ (passes ClaudeTraceEntry)
ConversationView
  ↓ (calls conversationProcessor.processConversation())
conversationProcessor
  ↓ (returns ConversationMessage[])
ConversationView
  ↓ (renders messages with badges)
ToolCallBadge (inline)
  ↓ (onClick opens modal)
ToolCallModal (overlay)
```

### Testing Strategy

For each phase:

1. **Unit Tests:** Test service functions in isolation (conversationProcessor)
2. **Component Tests:** Test components with mock data (ConversationView, ToolCallBadge, ToolCallModal)
3. **Integration Tests:** Test full flow from RequestDetailPage with real trace data
4. **Manual Testing:** Test in browser with various trace files
5. **Edge Case Testing:** Test with malformed data, failed requests, large files

### Rollout Plan

- Each phase is independently deployable
- Phase 1 provides immediate value (better message display)
- Phase 2-3 add progressive enhancement (tool visibility)
- Phase 4 improves UX but not required for functionality
- Can pause after any phase based on priority/resources

---

## Success Criteria

**Phase 1:**

- ✅ Streaming response parser extracts all content blocks (text AND tool_use)
- ✅ Tool_use blocks from streaming responses have correct id, name, and parsed input
- ✅ System message visible at top
- ✅ All user and assistant messages display in order
- ✅ Final assistant response included (with tool calls if any)
- ✅ Text content properly formatted

**Phase 2:**

- ✅ Tool calls visible as badges in messages
- ✅ Modal opens with tool details on click
- ✅ Tool parameters formatted and copyable

**Phase 3:**

- ✅ Tool results paired with tool calls
- ✅ Badge indicates result availability
- ✅ Modal shows both input and result
- ✅ User messages with only results are hidden

**Phase 4:**

- ✅ Markdown and code rendering working
- ✅ Keyboard shortcuts functional
- ✅ Edge cases handled gracefully
- ✅ Performance acceptable for large conversations

---

## Open Questions / Future Enhancements

1. **Thinking Blocks:** Claude-trace supports `thinking` blocks. Should we display these in Phase 4?
2. **System Reminders:** Should we parse and display `<system-reminder>` tags separately?
3. **Cache Indicators:** Should we show cache_control markers on cached messages?
4. **Export Feature:** Should we add ability to export conversation as HTML or Markdown?
5. **Conversation Comparison:** Should we add ability to compare multiple requests side-by-side?
6. **Real-time Updates:** Should we support watching trace files for new requests in real-time?

These can be addressed in future phases or separate feature work.
