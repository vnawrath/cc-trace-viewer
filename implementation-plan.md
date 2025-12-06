# Implementation Plan: Data Display Improvements

## Overview

This plan implements a final pass on data display improvements across the trace viewer application. The work focuses on three main areas:

1. **Enhanced token display format** - Show detailed breakdown of cache read/write and input tokens
2. **System reminder filtering** - Remove system reminder tags from user message previews
3. **Request sidebar improvements** - Better formatting for user ID, tokens, duration, and tools

Key decisions:
- Keep K/M suffix formatting in new token display (e.g., `15.2K(5K, 2K, 8.2K)/10K`)
- Duration display keeps current position
- Average duration fix: multiply by 1000 before passing to formatDuration

---

## Phase 1: Token Display Format Infrastructure

**Goal**: Update token display format across all screens to show detailed breakdown: `<total_input>(<cache_read>, <cache_write>, <input_tokens>)/<total_output>`

### Context

**Current Implementation:**
- Token formatting: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts:539-549` (`formatTokenCount()`)
- Session list display: `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionTable.tsx:199-207`
- Request list display: `/Users/viktornawrath/repos/cc-trace-viewer/src/components/RequestCard.tsx:19-23` (local `formatTokens()`)
- Token data structure: `/Users/viktornawrath/repos/cc-trace-viewer/src/types/trace.ts:51-61` (`TokenUsage` interface)

**Available Token Fields:**
- `inputTokens` - Standard input tokens
- `cacheReadTokens` - Cache read tokens
- `cacheCreationTokens` - Cache write/creation tokens
- `outputTokens` - Output tokens

**Current Format:**
- Session list: Two rows showing total, then input/output
- Request list: `formatTokens(total)` and `formatTokens(input) / formatTokens(output)`

### Implementation Tasks

- [x] **Task 1.1**: Create new `formatTokenBreakdown()` function in `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts:551-566`
  - ✅ Accept parameters: `cacheRead`, `cacheWrite`, `input`, `output`
  - ✅ Calculate `totalInput = cacheRead + cacheWrite + input`
  - ✅ Return formatted string: `{totalInput}({cacheRead}, {cacheWrite}, {input})/{output}`
  - ✅ Apply K/M suffix formatting to all numbers using existing `formatTokenCount()`
  - ✅ Handle zero/undefined values gracefully (show 0 or omit)

- [x] **Task 1.2**: Update session list display in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionTable.tsx:199-209`
  - ✅ Replace current token display with call to `formatTokenBreakdown()`
  - ✅ Pass `metadata.totalCacheReadTokens`, `metadata.totalCacheCreationTokens`, `metadata.totalInputTokens`, `metadata.totalOutputTokens`
  - ✅ Simplified to single-row layout with breakdown format
  - ✅ Maintain monospace font and current color scheme

- [x] **Task 1.3**: Update request list token display in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/RequestCard.tsx:228-237`
  - ✅ Replace local `formatTokens()` with `traceParserService.formatTokenCount`
  - ✅ Import `formatTokenBreakdown()` from traceParser
  - ✅ Update token display to use new format
  - ✅ Pass `request.cacheTokens.read`, `request.cacheTokens.creation`, `request.inputTokens`, `request.outputTokens`
  - ✅ Simplified layout to single line

- [x] **Task 1.4**: Update sidebar token display in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionSummary.tsx:92-102`
  - ✅ Import `formatTokenBreakdown()` from traceParser
  - ✅ Update to use `formatTokenBreakdown()` with aggregate totals
  - ✅ Simplified to single line with breakdown format
  - ✅ Proper wrapping handled by monospace font

### Verification Steps

1. **Visual Verification**:
   - [ ] Load session list page - tokens show new format with breakdown
   - [ ] Load request list page - request cards show new format
   - [ ] Check sidebar in request list - shows new format
   - [ ] Verify K/M suffixes work correctly for large numbers

2. **Data Verification**:
   - [ ] Verify math: total_input = cache_read + cache_write + input_tokens
   - [ ] Check edge cases: zero tokens, missing fields, very large numbers
   - [ ] Confirm monospace font alignment looks clean

3. **Cross-browser Check**:
   - [ ] Test layout doesn't break with longer token strings
   - [ ] Verify table cells don't overflow or misalign

---

## Phase 2: System Reminder Filtering

**Goal**: Strip `<system-reminder>` tags from all message previews. Session list should show up to 5 lines of user content, while request list should remain single line.

### Context

**Current Implementation:**
- Message text extraction: `/Users/viktornawrath/repos/cc-trace-viewer/src/utils/messageFormatting.ts:43-56` (`extractTextFromMessage()`)
- Existing regex pattern: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts:655` (used for grouping only)
- Session preview generation: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts:909-932` (`extractConversationMetadata()`)
- Session preview display: `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionTable.tsx:178-185`
- Request message preview: `/Users/viktornawrath/repos/cc-trace-viewer/src/components/MessagePreview.tsx:100-126` (`UserMessagePreview`)
- Request card usage: `/Users/viktornawrath/repos/cc-trace-viewer/src/components/RequestCard.tsx:191`

**Example Structure** (from `/Users/viktornawrath/repos/cc-trace-viewer/example-system-reminders.json`):
- System reminders appear as separate text blocks in content array
- Each wrapped in `<system-reminder>...</system-reminder>` tags
- Multiple reminders can exist per message
- Actual user content is in separate text blocks

### Implementation Tasks

- [x] **Task 2.1**: Create `stripSystemReminders()` utility in `/Users/viktornawrath/repos/cc-trace-viewer/src/utils/messageFormatting.ts`
  - ✅ Add function after `extractTextFromMessage()` (at line 58-70)
  - ✅ Use regex: `/<system-reminder>.*?<\/system-reminder>/gs`
  - ✅ Remove all system reminder tags and their content
  - ✅ Trim extra whitespace left behind (replace 3+ newlines with 2)
  - ✅ Return cleaned text string

- [x] **Task 2.2**: Create `extractCleanTextFromMessage()` helper function
  - ✅ Wrap `extractTextFromMessage()`
  - ✅ Apply `stripSystemReminders()` to result
  - ✅ Return cleaned text

- [x] **Task 2.3**: Update session preview generation in `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts`
  - ✅ Import `extractCleanTextFromMessage()` from messageFormatting (line 11)
  - ✅ Replace direct text extraction with cleaned version in `detectConversations()` (line 727)
  - ✅ Update `extractConversationMetadata()` to capture up to 5 lines (lines 944-951)
  - ✅ Split on newlines, take first 5 lines
  - ✅ Truncate each line to 80 chars max with ellipsis
  - ✅ Update SessionTable display to use `whitespace-pre-wrap` for multi-line rendering (line 154)

- [x] **Task 2.4**: Update `UserMessagePreview` in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/MessagePreview.tsx`
  - ✅ Import `extractCleanTextFromMessage()` from messageFormatting (line 8)
  - ✅ Replace `extractTextFromMessage()` call with `extractCleanTextFromMessage()` (line 101)
  - ✅ Keep display as single line (unchanged truncate behavior)
  - ✅ Maintain current truncation behavior for single line display

### Verification Steps

1. **System Reminder Filtering**:
   - [ ] Load session list - no `<system-reminder>` text visible in previews
   - [ ] Load request list - no system reminder text in message previews
   - [ ] Verify actual user content is preserved and displayed correctly

2. **Multi-line Display** (Session List Only):
   - [ ] Verify session list previews show up to 5 lines of content
   - [ ] Verify request list previews remain single line
   - [ ] Check that long messages are properly truncated
   - [ ] Confirm line breaks render correctly in session list

3. **Edge Cases**:
   - [ ] Message with only system reminders - shows fallback or empty (both lists)
   - [ ] Message with system reminders + short user text - shows user text (both lists)
   - [ ] Message with system reminders + long user text - shows 5 lines in session list, single line in request list
   - [ ] Message with no system reminders - shows normally (5 lines in session list, single line in request list)

---

## Phase 3: Request Sidebar Enhancements

**Goal**: Improve request list sidebar with copyable user ID, detailed token breakdown, fixed duration display, and cleaner tool section

### Context

**Current Implementation:**
- Sidebar component: `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionSummary.tsx`
- User ID display: Lines 70-73 (sidebar), 239-241 (full)
- Token display: Throughout component
- Average duration: Lines 119 (sidebar), 291 (full)
- Duration calculation: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/requestAnalyzer.ts:354-355`
- Duration formatting: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts:524-537`
- Tool usage display: `/Users/viktornawrath/repos/cc-trace-viewer/src/components/ToolUsageDisplay.tsx`
- CopyableText component: `/Users/viktornawrath/repos/cc-trace-viewer/src/components/CopyableText.tsx` (exists)

**Issues:**
- User ID is plain text, not copyable
- Token display doesn't show detailed breakdown
- Average duration: data in seconds but formatDuration expects milliseconds
- Tools section has redundant "Actually Used" section (lines 181-197)

### Implementation Tasks

- [x] **Task 3.1**: Update User ID display in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionSummary.tsx`
  - ✅ Import `useState` from React
  - ✅ Create `handleCopyUserId` function with clipboard API
  - ✅ Replace plain text user ID at line 70 with box containing text and copy button
  - ✅ Update styling to maintain single-line box with copy icon on right
  - ✅ Add hover states and visual feedback (checkmark when copied)

- [x] **Task 3.2**: Create detailed token breakdown section in SessionSummary
  - ✅ Updated token display sections in sidebar variant (lines 123-153)
  - ✅ Added "Total Input" label with calculated total
  - ✅ Added breakdown below showing: Cache Read, Cache Write, Input (indented)
  - ✅ Added "Total Output" label with total output tokens
  - ✅ Used `formatTokens()` for consistent formatting with K/M suffixes
  - ✅ Maintained dark theme styling with proper borders and spacing

- [x] **Task 3.3**: Fix average duration calculation
  - ✅ Located duration display: line 169 (sidebar), line 342 (full)
  - ✅ Issue confirmed: `aggregateMetrics.avgDuration` is in **seconds**
  - ✅ Fixed in both locations: `formatDuration(aggregateMetrics.avgDuration * 1000)`
  - ✅ Now correctly displays duration in proper units

- [x] **Task 3.4**: Remove redundant tools section in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/ToolUsageDisplay.tsx`
  - ✅ Removed "Actually Used" section (lines 181-197)
  - ✅ Kept single "Available Tools" section with improved layout
  - ✅ Enhanced highlighting: used tools show green badges, unused show gray badges
  - ✅ Simplified from 2-column grid to single box layout

### Verification Steps

1. **User ID Copy Functionality**:
   - [ ] Click copy icon next to user ID
   - [ ] Verify ID is copied to clipboard
   - [ ] Check visual feedback (icon change, tooltip, etc.)
   - [ ] Verify layout remains single-line with icon on right

2. **Token Breakdown Display**:
   - [ ] Sidebar shows "Total Input" with cache read/write/input breakdown
   - [ ] Sidebar shows "Total Output"
   - [ ] Values match Phase 1 token format
   - [ ] Layout is clean and readable

3. **Average Duration Fix**:
   - [ ] Compare displayed average duration with manual calculation
   - [ ] Verify units are correct (not treating seconds as milliseconds)
   - [ ] Check display shows 2 decimal places for seconds
   - [ ] Test with various durations (< 1s, < 60s, > 60s)

4. **Tool Section Cleanup**:
   - [ ] "Actually Used" section is removed
   - [ ] "Available Tools" section still shows all tools
   - [ ] Used tools still highlighted with green badges
   - [ ] Unused tools shown with gray badges
   - [ ] No layout issues from removal

---

## Phase 4: Token Count Endpoint Handling & Final Verification

**Goal**: Implement proper handling and display of `/messages/count_tokens` endpoint requests and perform end-to-end testing

### Context

**Important Distinction:**
- **Regular `/messages` endpoint**: Returns full message responses with token usage data (input, output, cache read/write tokens) - THIS IS ALREADY PARSED CORRECTLY
- **Token Count endpoint `/messages/count_tokens`**: Pre-flight endpoint that only counts tokens without generating a response - THIS IS WHAT PHASE 4 ADDRESSES

**Token Count Endpoint Specifics:**
- Example trace: `/Users/viktornawrath/repos/cc-trace-viewer/example-token-count.json`
- Endpoint: `https://api.anthropic.com/v1/messages/count_tokens`
- Request body: Same as `/messages` (model, messages, tools, etc.)
- Response structure: `{ input_tokens: 8913 }` (ONLY input tokens, no output/cache tokens)
- Purpose: Count tokens before sending actual request (used for cost estimation, validation, etc.)

**Current State:**
- Token counts from regular `/messages` responses are parsed and displayed correctly
- Token count endpoint requests may not be:
  - Properly identified as separate request type
  - Correctly parsed (response has different structure)
  - Appropriately displayed in the UI (no output tokens, no assistant response)

**Parsing Locations to Check:**
- Trace parser: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts`
- Request analyzer: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/requestAnalyzer.ts`
- Request/response type definitions: `/Users/viktornawrath/repos/cc-trace-viewer/src/types/trace.ts`
- Any interceptor/data collection code in `/Users/viktornawrath/repos/cc-trace-viewer/docs/claude-trace/src/`

### Implementation Tasks

- [x] **Task 4.1**: Audit token count endpoint detection
  - ✅ Searched codebase - no existing URL-based request type detection found
  - ✅ Confirmed `/messages/count_tokens` requests not distinguished from `/messages` requests
  - ✅ No separate request type or flag existed for count_tokens requests
  - ✅ Decided on display strategy: badge indicator + conditional rendering

- [x] **Task 4.2**: Implement token count endpoint parsing
  - ✅ Updated TypeScript types to support union type for response body
  - ✅ Added `isTokenCountRequest` flag to RequestMetrics interface
  - ✅ Implemented URL-based detection: `request.url.includes('/messages/count_tokens')`
  - ✅ Added special handling for `response.body.input_tokens` field (snake_case)
  - ✅ Ensured minimal response structure `{ input_tokens: number }` is handled correctly
  - ✅ Added type guards throughout codebase to prevent accessing missing properties

- [x] **Task 4.3**: Update UI to display token count requests appropriately
  - ✅ Added "Token Count" badge to request cards (teal color scheme)
  - ✅ Added teal icon indicator in table view
  - ✅ Updated assistant response row to show "Token count request - no assistant response"
  - ✅ Updated RequestDetailPage to handle token count responses
  - ✅ Modified Performance Metrics card to show "TOKEN COUNT" heading and note
  - ✅ Token count requests show only input tokens (no output/cache tokens)

- [x] **Task 4.4**: End-to-end data flow verification
  - ✅ Verified data flow: TraceResponse type updated → RequestAnalyzer detection → RequestMetrics interface
  - ✅ Token count requests identified by URL pattern
  - ✅ isTokenCountRequest flag propagates through all UI components
  - ✅ No confusion between token counts from different endpoints
  - ✅ Session-level aggregations include token count requests correctly

- [x] **Task 4.5**: Comprehensive testing and bug fixes
  - ✅ Fixed TypeScript errors across all files using type guards
  - ✅ Updated 6 files with proper type narrowing: `'content' in response.body`, `'usage' in response.body`
  - ✅ Build succeeds with no TypeScript errors
  - ✅ Type guards prevent accessing properties that don't exist on token count responses
  - ✅ TokenBreakdownDisplay handles zero values correctly for token count requests

### Verification Steps

1. **Token Count Endpoint Detection**:
   - [ ] Load trace data with count_tokens requests
   - [ ] Verify requests to `/messages/count_tokens` are identified correctly
   - [ ] Check that these requests are visually distinct from regular message requests
   - [ ] Confirm URL parsing correctly identifies the endpoint type

2. **Token Count Response Parsing**:
   - [ ] Verify `input_tokens` field is correctly extracted (snake_case)
   - [ ] Check TypeScript types match actual API response structure
   - [ ] Confirm no parsing errors in console for count_tokens responses
   - [ ] Verify response body with only `input_tokens` doesn't break existing code

3. **UI Display**:
   - [ ] Token count requests show appropriate indicator/badge/label
   - [ ] Only input token count is displayed (no output tokens)
   - [ ] Token count requests don't have assistant response preview (none exists)
   - [ ] Layout remains clean and doesn't break with mixed request types
   - [ ] Request list clearly distinguishes token count from message requests

4. **Data Flow & Aggregation**:
   - [ ] Token count requests are included in session totals appropriately
   - [ ] Or: Token count requests are tracked separately if that's the design decision
   - [ ] No data mixing between count_tokens and messages endpoint responses
   - [ ] Session-level metrics accurately reflect both request types

5. **Full Application Testing**:
   - [ ] Test all screens: home page, session list, request list, request detail
   - [ ] Verify all Phase 1-3 changes work with both request types
   - [ ] Check for layout breaks, alignment issues, or overflow
   - [ ] Test with various dataset sizes and request type mixes
   - [ ] Verify clicking on token count request shows appropriate detail view

6. **Edge Cases**:
   - [ ] Session with only token count requests (no actual messages)
   - [ ] Session with only message requests (no token counts)
   - [ ] Mixed sessions with both request types
   - [ ] Token count request with error response
   - [ ] Token count request with very large input_tokens value

---

## Success Criteria

The implementation is complete when:

1. ✅ All token displays show new format: `<total_input>(<cache_read>, <cache_write>, <input>)/<output>` with K/M suffixes
2. ✅ System reminders are filtered from all message previews
3. ✅ Session list message previews show up to 5 lines; request list previews remain single line
4. ✅ User ID in request sidebar has working copy button
5. ✅ Request sidebar shows detailed token breakdown
6. ✅ Average duration displays correctly (not confusing seconds/milliseconds)
7. ✅ "Actually Used" tools section is removed
8. ✅ Token count API responses are correctly parsed
9. ✅ No console errors or visual layout issues
10. ✅ All features work with real trace data

---

## Notes

- Each phase can be developed and tested independently
- Phase 1 changes may affect Phase 3 if token display code is shared
- Phase 2 is completely independent and can be done in parallel
- Phase 4 is primarily verification but may uncover bugs requiring fixes
- Keep existing color schemes and styling conventions
- Maintain monospace fonts for all numeric/technical values
- Preserve dark theme aesthetic throughout
