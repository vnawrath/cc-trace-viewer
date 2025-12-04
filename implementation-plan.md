# Implementation Plan: Conversation-Level Display Enhancement

## Overview

This plan enhances the cc-trace-viewer to display conversation-level information by reimplementing conversation detection and reconstruction logic inspired by claude-trace's approach. The goal is to make trace data more readable by showing:

1. **Session List**: Number of conversations per session + preview of the first user message from the longest conversation
2. **Request Table**: Expanded two-row layout showing user message preview and assistant response preview for each request

### Design Decisions

- **Conversation Detection**: Reimplement logic in our codebase (not reusing claude-trace code, using it only as reference)
- **Processing Location**: TraceParserService - process during initial parse
- **Request Display**: Two-row layout, always expanded (no collapse functionality)
- **Preview Selection**: Show longest conversation's first user message in session list

### Architecture

```
TraceParserService
  └─> parseSessionData()
       ├─> parseTraceEntries() [existing]
       ├─> detectConversations() [NEW]
       │    ├─> normalizeMessage() [NEW]
       │    ├─> hashFirstMessage() [NEW]
       │    └─> groupByConversation() [NEW]
       └─> extractConversationMetadata() [NEW]

SessionMetadata [ENHANCED]
  ├─> conversationCount [NEW]
  └─> conversationPreview [NEW]

RequestCard Component [ENHANCED]
  ├─> Stats Row (existing + user message)
  └─> Response Row (assistant message) [NEW]
```

---

## Phase 1: Implement Conversation Detection Logic

**Goal**: Add conversation detection and grouping to TraceParserService that identifies unique conversations within a session based on message history.

### Context

**Reference**: `docs/claude-trace/src/shared-conversation-processor.ts:490-585` demonstrates conversation detection by:
1. Normalizing first user message (removing timestamps, file refs, system reminders)
2. Creating hash from normalized message + system prompt + model
3. Grouping requests by this hash
4. Identifying the longest conversation in each group

**Files to Modify**:
- `src/services/traceParser.ts` - Add conversation detection functions
- `src/types/trace.ts` - Add conversation-related types

### Implementation Tasks

- [ ] **Define conversation types** in `src/types/trace.ts`
  ```typescript
  interface ConversationGroup {
    id: string;  // Hash of normalized first message
    requests: ClaudeTraceEntry[];
    firstUserMessage: string;
    longestRequestIndex: number;
    models: Set<string>;
    totalMessages: number;
  }

  interface ConversationMetadata {
    conversationCount: number;
    longestConversation: {
      firstUserMessage: string;
      messageCount: number;
    } | null;
  }
  ```

- [ ] **Implement message normalization** in `traceParser.ts`
  - Create `normalizeMessageForGrouping(message: string): string` function
  - Remove dynamic content:
    - Timestamps: `Generated YYYY-MM-DD HH:MM:SS` → `Generated [TIMESTAMP]`
    - File references: `The user opened the file X` → `The user opened file in IDE`
    - System reminders: `<system-reminder>...</system-reminder>` → `[SYSTEM-REMINDER]`
  - Use regex-based replacements
  - Reference: `docs/claude-trace/src/shared-conversation-processor.ts:776-800`

- [ ] **Implement conversation hashing** in `traceParser.ts`
  - Create `hashConversation(firstMessage: string, system: string | undefined, model: string): string` function
  - Generate stable hash from normalized first message + system + model
  - Use simple hash function (e.g., sum of char codes + JSON.stringify)

- [ ] **Implement conversation grouping** in `traceParser.ts`
  - Create `detectConversations(entries: ClaudeTraceEntry[]): ConversationGroup[]` function
  - Extract first user message from each request's message history
  - Group requests by conversation hash
  - Find longest conversation in each group (most messages in request.body.messages)
  - Reference: `docs/claude-trace/src/shared-conversation-processor.ts:517-545`

- [ ] **Implement conversation metadata extraction** in `traceParser.ts`
  - Create `extractConversationMetadata(conversations: ConversationGroup[]): ConversationMetadata` function
  - Count total conversations
  - Identify longest conversation overall
  - Extract its first user message for preview

- [ ] **Integrate into session parsing** in `traceParser.ts`
  - Modify `parseSessionData()` to call `detectConversations()`
  - Add conversation metadata to returned SessionData
  - Ensure backward compatibility (metadata optional)

### Verification Steps

- [ ] **Unit test: Message normalization**
  - Test that timestamps are replaced correctly
  - Test that file references are normalized
  - Test that system reminders are removed
  - Test that multiple replacements work together

- [ ] **Unit test: Conversation grouping**
  - Create test data with 2 conversations (different first messages)
  - Create test data with same conversation appearing twice (same first message)
  - Verify correct grouping and conversation count

- [ ] **Integration test: Full session parsing**
  - Load a real session file with multiple requests
  - Verify conversation detection completes without errors
  - Log conversation count and preview to console

- [ ] **Edge case testing**
  - Test with empty session (no requests)
  - Test with single request
  - Test with requests that have no messages
  - Verify no crashes, graceful degradation

---

## Phase 2: Display Conversation Count in Session List

**Goal**: Add conversation count as a new column in the SessionTable component.

### Context

**Current State**: SessionTable displays 9 columns: Status, Session ID, Start Time, Requests, Total Tokens, Duration, Models, Tools, Errors

**Files**:
- `src/components/SessionTable.tsx:84-156` - Table structure and columns
- `src/components/SessionTable.tsx:163-266` - SessionRow component
- `src/types/trace.ts:63-83` - SessionData type
- `src/services/sessionManager.ts:127-181` - extractSessionMetadata function

### Implementation Tasks

- [ ] **Update SessionData type** in `src/types/trace.ts`
  - Add `conversationCount: number` field to SessionData interface (line ~75)
  - Add to SessionMetadata interface as well (line ~110)
  - Make it optional initially for backward compatibility: `conversationCount?: number`

- [ ] **Update session discovery** in `src/services/sessionManager.ts`
  - Modify `extractSessionMetadata()` to call conversation detection
  - Add conversation count to returned metadata
  - Ensure performance: conversation detection should be fast (O(n) where n = requests)

- [ ] **Add Conversations column** in `src/components/SessionTable.tsx`
  - Add column header after "Requests" column (line ~100)
  - Make it sortable (add to sort logic, lines 14-62)
  - Use icon: Chat bubble or message icon from your icon library
  - Header text: "Convs" (abbreviated for space)

- [ ] **Display conversation count in SessionRow**
  - Add new `<td>` cell after request count (line ~215)
  - Display conversation count with same styling as request count
  - Right-aligned, monospace font, text-xs
  - Show dash "—" if conversationCount is undefined (backward compat)
  - Color: Use existing data color (cyan)

- [ ] **Adjust column widths**
  - Ensure table doesn't become too wide
  - Slightly reduce width of other columns if needed
  - Test responsive behavior

### Verification Steps

- [ ] **Visual verification**
  - Load application and view session list
  - Verify "Convs" column appears after "Requests"
  - Verify conversation counts display correctly
  - Verify column alignment matches other numeric columns

- [ ] **Sorting verification**
  - Click "Convs" column header
  - Verify sorting works (ascending/descending)
  - Verify sort indicator appears
  - Verify sessions reorder correctly

- [ ] **Data accuracy**
  - Manually count conversations in a test session
  - Verify displayed count matches manual count
  - Test with sessions containing 1, 2, 5+ conversations

- [ ] **Backward compatibility**
  - Test with sessions parsed before conversation detection was added
  - Verify dash "—" displays when conversationCount is missing
  - Verify no console errors

---

## Phase 3: Display Conversation Preview in Session List

**Goal**: Add preview of the first user message from the longest conversation to the SessionTable.

### Context

**Current State**: SessionTable shows basic metadata but no message content

**Design**: Add a new row or expand the Session ID cell to show a truncated preview of the longest conversation's first user message

**Files**:
- `src/components/SessionTable.tsx:163-266` - SessionRow component
- `src/types/trace.ts` - SessionData/SessionMetadata types
- `src/services/sessionManager.ts` - Session metadata extraction

### Implementation Tasks

- [ ] **Update SessionMetadata type** in `src/types/trace.ts`
  - Add `conversationPreview?: string` field to SessionData (line ~75)
  - Add to SessionMetadata as well (line ~110)
  - Extract from longest conversation's first user message

- [ ] **Update conversation metadata extraction** in `src/services/traceParser.ts`
  - In `extractConversationMetadata()`, extract first user message text
  - Handle different message content types:
    - Text content: extract from `content[0].text`
    - Multiple content blocks: concatenate text blocks
    - Tool use: show "[Tool use]" placeholder
  - Limit to first 200 characters for storage efficiency
  - Reference: Message structure in `docs/claude-trace/src/types.ts`

- [ ] **Enhance SessionRow display** in `src/components/SessionTable.tsx`
  - Option A: Add preview below Session ID in same cell
  - Option B: Add as new column (may be too wide)
  - **Recommendation: Option A** - Add preview as second line in Session ID cell
  - Structure (line ~201-205):
    ```tsx
    <div className="flex flex-col gap-0.5">
      <div className="font-mono">{truncatedId}</div>
      {session.conversationPreview && (
        <div className="text-[10px] text-gray-500 italic truncate max-w-xs">
          {session.conversationPreview}
        </div>
      )}
    </div>
    ```

- [ ] **Add tooltip with full message**
  - Wrap in tooltip component if preview is truncated
  - Show full first user message on hover
  - Reuse existing tooltip pattern from SessionRow (line 202)

- [ ] **Style preview text**
  - Very small font: text-[10px]
  - Muted color: text-gray-500
  - Italic to distinguish from ID
  - Single line with ellipsis truncation
  - Max width to prevent expanding cell too much

### Verification Steps

- [ ] **Visual verification**
  - Load session list
  - Verify preview text appears below Session ID
  - Verify text is properly truncated
  - Verify styling is subtle and doesn't dominate

- [ ] **Content verification**
  - Check multiple sessions
  - Verify preview matches the actual first user message
  - Verify it comes from the longest conversation
  - Test with sessions containing different message types

- [ ] **Tooltip verification**
  - Hover over previews
  - Verify full message appears in tooltip
  - Verify tooltip doesn't block other UI elements

- [ ] **Edge cases**
  - Test with sessions that have no conversations
  - Test with very long first messages (>1000 chars)
  - Test with messages containing special characters/markdown
  - Test with messages that are only tool use

---

## Phase 4: Enhance Request Table with Two-Row Layout

**Goal**: Modify RequestCard component to render each request as two table rows - one for stats + user message, one for response content.

### Context

**Current State**: `src/components/RequestCard.tsx:149-222` renders compact single row with: Status, Timestamp, Model, Duration, Tokens, Tools, Actions

**New Design**:
- Row 1: Status | Timestamp | Model | Duration | Tokens | Tools | User Message Preview
- Row 2: (empty) | (empty) | (empty) | (empty) | (empty) | (empty) | Assistant Response Preview

**Files**:
- `src/components/RequestCard.tsx` - Request row rendering
- `src/pages/RequestListPage.tsx:225-293` - Table structure
- `src/types/trace.ts` - Request data types

### Implementation Tasks

- [ ] **Modify RequestCard to return multiple rows**
  - Change return type from single `<tr>` to fragment with two `<tr>` elements
  - Maintain key prop on first row: `key={request.id}`
  - Add key to second row: `key={request.id}-response`
  - Lines to modify: 149-222

- [ ] **Implement first row (stats + user message)**
  - Keep existing columns: Status, Timestamp, Model, Duration, Tokens, Tools
  - Remove "Actions" column (View → link)
  - Add new column: "User Message" that spans remaining width
  - Extract last user message from `request.request.body.messages`
  - Show truncated preview (first 150 characters)
  - Style: text-xs, text-gray-300, italic
  - Make entire row clickable (wrap in Link like SessionRow)

- [ ] **Implement second row (response preview)**
  - First 6 cells: empty `<td>` elements (for alignment)
  - 7th cell: Assistant response content
  - Extract response from `request.response.body.content`
  - Show truncated preview (first 200 characters)
  - Style: text-xs, text-gray-400, slightly indented
  - Different background: bg-gray-900/40 to distinguish from first row

- [ ] **Add visual hierarchy**
  - First row: slightly bolder, bg-gray-900
  - Second row: slightly muted, bg-gray-900/40
  - Thin border between row pairs: border-b border-gray-800 on second row
  - No border between rows within a pair

- [ ] **Update table structure** in `RequestListPage.tsx`
  - Ensure table layout accommodates variable row heights
  - Update column count in `<colgroup>` if present
  - Verify spacing and alignment remain correct

- [ ] **Handle edge cases**
  - Requests with no user messages: show "—" in user message cell
  - Requests with failed responses: show error message in response cell
  - Requests with empty responses: show "—" or "[No response]"

### Verification Steps

- [ ] **Visual verification**
  - Load request list for a session
  - Verify each request displays as two rows
  - Verify alignment of all columns
  - Verify background colors create visual grouping

- [ ] **Content verification**
  - Check that user message previews match actual messages
  - Check that response previews match actual responses
  - Verify truncation works correctly (ellipsis at end)

- [ ] **Click behavior**
  - Click first row: should navigate to request detail
  - Click second row: should also navigate (entire pair is one request)
  - Verify navigation works correctly

- [ ] **Responsive testing**
  - Test with long messages (verify truncation)
  - Test with short messages (verify layout doesn't break)
  - Test with different window widths

- [ ] **Edge case testing**
  - Test with streaming requests
  - Test with failed requests (error responses)
  - Test with tool-only messages (no text content)

---

## Phase 5: Implement Message Content Rendering

**Goal**: Add proper rendering of message content including text, thinking blocks, and tool usage indicators.

### Context

**Current State**: Message previews are simple truncated strings. We need rich rendering that handles different content types.

**Claude Response Structure** (from `docs/claude-trace/src/types.ts`):
- `content` array can contain:
  - `text` blocks: `{ type: "text", text: string }`
  - `tool_use` blocks: `{ type: "tool_use", id: string, name: string, input: any }`
  - `thinking` blocks: `{ type: "thinking", thinking: string }`

**Files**:
- Create new `src/components/MessagePreview.tsx` component
- Create new `src/utils/messageFormatting.ts` utility
- Update `src/components/RequestCard.tsx` to use new component

### Implementation Tasks

- [ ] **Create message formatting utilities** in `src/utils/messageFormatting.ts`
  - Create `extractTextFromMessage(message: Message): string`
    - Handle single vs multiple content blocks
    - Concatenate text blocks with space separator
    - Return empty string if no text content
  - Create `extractTextFromMessageParam(message: MessageParam): string`
    - Handle user message structure (simpler than assistant)
    - Extract from string or content array
  - Create `hasThinkingContent(message: Message): boolean`
  - Create `getToolsUsed(message: Message): string[]`
    - Extract tool names from tool_use blocks
    - Return array of unique tool names

- [ ] **Create MessagePreview component** in `src/components/MessagePreview.tsx`
  - Props:
    ```typescript
    interface MessagePreviewProps {
      content: string;
      maxLength?: number;
      showThinking?: boolean;
      showTools?: boolean;
      toolsUsed?: string[];
      hasThinking?: boolean;
      className?: string;
    }
    ```
  - Render truncated text with ellipsis
  - Show thinking indicator: `[Thinking] + text preview`
  - Show tool indicators: `[🔧 tool1, tool2] + text preview`
  - Style with appropriate colors:
    - Text: text-gray-300
    - Thinking: text-purple-400
    - Tools: text-amber-400

- [ ] **Create UserMessagePreview component** in `src/components/MessagePreview.tsx`
  - Wrapper for user messages specifically
  - Extract last user message from message history
  - Handle edge cases (no user messages, empty content)
  - Props:
    ```typescript
    interface UserMessagePreviewProps {
      messages: MessageParam[];
      maxLength?: number;
      className?: string;
    }
    ```

- [ ] **Create AssistantMessagePreview component** in `src/components/MessagePreview.tsx`
  - Wrapper for assistant responses
  - Show thinking indicator if present
  - Show tool usage if present
  - Extract and display text content
  - Props:
    ```typescript
    interface AssistantMessagePreviewProps {
      content: ContentBlock[];
      stopReason?: string | null;
      maxLength?: number;
      className?: string;
    }
    ```

- [ ] **Update RequestCard to use new components**
  - Replace simple string truncation with UserMessagePreview (first row)
  - Replace simple string truncation with AssistantMessagePreview (second row)
  - Pass appropriate styling classes
  - Handle loading states and errors

- [ ] **Add markdown support (optional enhancement)**
  - Consider adding light markdown parsing for code blocks
  - Inline code: wrap in `<code>` tags with monospace font
  - Bold/italic: preserve basic formatting
  - Keep it lightweight - full markdown not needed

### Verification Steps

- [ ] **Visual verification**
  - Load request list
  - Verify text content displays correctly
  - Verify thinking indicators appear for requests with thinking
  - Verify tool indicators appear for requests with tool use
  - Verify colors match design system

- [ ] **Content accuracy**
  - Compare previews with full messages in detail view
  - Verify truncation happens at correct length
  - Verify multi-block messages are concatenated properly

- [ ] **Different content types**
  - Test with text-only messages
  - Test with messages containing thinking
  - Test with messages containing tool use
  - Test with messages containing both thinking and tools
  - Test with messages containing multiple text blocks

- [ ] **Edge cases**
  - Very short messages (< maxLength)
  - Very long messages (>> maxLength)
  - Messages with only tool use (no text)
  - Messages with special characters
  - Empty messages

- [ ] **Performance**
  - Test with large session (100+ requests)
  - Verify rendering is smooth
  - Check for any performance issues with message extraction

---

## Testing & Verification

### Overall Integration Testing

After all phases are complete:

- [ ] **End-to-end flow**
  1. Select a directory with multiple trace files
  2. Verify session list shows conversation count and preview
  3. Click into a session
  4. Verify request table shows two-row layout with message previews
  5. Click into a request detail
  6. Verify detail view still works correctly

- [ ] **Cross-browser testing**
  - Test in Chrome/Edge
  - Test in Firefox
  - Test in Safari
  - Verify File System Access API works in all

- [ ] **Performance testing**
  - Test with large trace files (1000+ requests)
  - Verify conversation detection completes in reasonable time
  - Verify UI remains responsive
  - Check memory usage

- [ ] **Accessibility**
  - Verify keyboard navigation still works
  - Verify screen reader compatibility (basic)
  - Verify color contrast meets standards

### Regression Testing

- [ ] **Existing features still work**
  - Directory selection and persistence
  - Session filtering and sorting
  - Request filtering (status, model, tools)
  - Request detail view
  - Token usage display
  - Duration calculations

- [ ] **Error handling**
  - Test with corrupted JSONL files
  - Test with partial/incomplete requests
  - Test with unexpected data structures
  - Verify graceful degradation

---

## Success Criteria

- ✅ Session list displays conversation count for each session
- ✅ Session list shows preview of first user message from longest conversation
- ✅ Request table displays each request as two rows
- ✅ First row shows request stats + user message preview
- ✅ Second row shows assistant response preview
- ✅ Message previews properly handle text, thinking, and tool use
- ✅ All existing functionality continues to work
- ✅ No performance degradation with large files
- ✅ Code follows existing patterns and style
- ✅ No code reused from docs/claude-trace (reimplemented)

---

## Notes

- All conversation detection logic should be reimplemented in our codebase, not imported from docs/claude-trace
- Use docs/claude-trace only as reference documentation to understand the approach
- Maintain backward compatibility throughout - old sessions should continue to work
- Keep the terminal dark aesthetic consistent across all new UI elements
- Conversation detection should be performant - optimize for O(n) complexity where possible
