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

- [ ] **Task 1.1**: Create new `formatTokenBreakdown()` function in `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts`
  - Accept parameters: `cacheRead`, `cacheWrite`, `input`, `output`
  - Calculate `totalInput = cacheRead + cacheWrite + input`
  - Return formatted string: `{totalInput}({cacheRead}, {cacheWrite}, {input})/{output}`
  - Apply K/M suffix formatting to all numbers using existing `formatTokenCount()`
  - Handle zero/undefined values gracefully (show 0 or omit)

- [ ] **Task 1.2**: Update session list display in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionTable.tsx:199-207`
  - Replace current token display with call to `formatTokenBreakdown()`
  - Pass `metadata.totalCacheReadTokens`, `metadata.totalCacheCreationTokens`, `metadata.totalInputTokens`, `metadata.totalOutputTokens`
  - Keep two-row layout if needed for readability
  - Maintain monospace font and current color scheme

- [ ] **Task 1.3**: Update request list token display in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/RequestCard.tsx`
  - Remove local `formatTokens()` function (lines 19-23)
  - Import `formatTokenBreakdown()` from traceParser
  - Update lines 230-235 to use new format
  - Pass `request.cacheReadTokens`, `request.cacheCreationTokens`, `request.inputTokens`, `request.outputTokens`
  - Adjust layout if text is too long for table cell

- [ ] **Task 1.4**: Update sidebar token display in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionSummary.tsx`
  - Locate token display sections (sidebar and full variants)
  - Update to use `formatTokenBreakdown()` with aggregate totals
  - Ensure proper wrapping for longer format string

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

**Goal**: Strip `<system-reminder>` tags from message previews and show up to 5 lines of actual user content

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

- [ ] **Task 2.1**: Create `stripSystemReminders()` utility in `/Users/viktornawrath/repos/cc-trace-viewer/src/utils/messageFormatting.ts`
  - Add function after `extractTextFromMessage()` (around line 57)
  - Use regex: `/<system-reminder>.*?<\/system-reminder>/gs`
  - Remove all system reminder tags and their content
  - Trim extra whitespace left behind
  - Return cleaned text string

- [ ] **Task 2.2**: Create `extractCleanTextFromMessage()` helper function
  - Wrap `extractTextFromMessage()`
  - Apply `stripSystemReminders()` to result
  - Return cleaned text

- [ ] **Task 2.3**: Update session preview generation in `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts:909-932`
  - Import `extractCleanTextFromMessage()` from messageFormatting
  - Replace direct text extraction with cleaned version (around line 920)
  - Update preview to capture up to 5 lines instead of current limit
  - Change from 200 characters to counting newlines (max 5 lines)
  - Trim to reasonable character limit per line (e.g., 80 chars per line)

- [ ] **Task 2.4**: Update `UserMessagePreview` in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/MessagePreview.tsx:100-126`
  - Import `extractCleanTextFromMessage()` from messageFormatting
  - Replace `extractTextFromMessage()` call (around line 106)
  - Update display to show up to 5 lines with proper line breaks
  - Add CSS for multi-line truncation with `line-clamp-5` or similar

### Verification Steps

1. **System Reminder Filtering**:
   - [ ] Load session list - no `<system-reminder>` text visible in previews
   - [ ] Load request list - no system reminder text in message previews
   - [ ] Verify actual user content is preserved and displayed correctly

2. **Multi-line Display**:
   - [ ] Verify previews show up to 5 lines of content
   - [ ] Check that long messages are properly truncated
   - [ ] Confirm line breaks render correctly

3. **Edge Cases**:
   - [ ] Message with only system reminders - shows fallback or empty
   - [ ] Message with system reminders + short user text - shows user text
   - [ ] Message with system reminders + long user text - shows 5 lines
   - [ ] Message with no system reminders - shows normally

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

- [ ] **Task 3.1**: Update User ID display in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/SessionSummary.tsx`
  - Import `CopyableText` component
  - Replace plain text user ID at line 73 with `<CopyableText value={metadata.userId} />`
  - Update styling to maintain single-line box with copy icon on right
  - Ensure copy icon is visible and properly aligned

- [ ] **Task 3.2**: Create detailed token breakdown section in SessionSummary
  - Locate token display sections in sidebar variant (around lines 100-130)
  - Add "Total Input" label with breakdown:
    - Show: `{totalInput}` as main value
    - Show breakdown below: `Cache Read: {cacheRead}`, `Cache Write: {cacheWrite}`, `Input: {input}`
  - Add "Total Output" label with `{totalOutput}`
  - Use `formatTokenBreakdown()` from Phase 1 for consistent formatting
  - Apply similar updates to full variant if needed

- [ ] **Task 3.3**: Fix average duration calculation
  - Locate duration display: line 119 (sidebar), line 291 (full)
  - The issue: `aggregateMetrics.avgDuration` is in **seconds** (from requestAnalyzer.ts:355)
  - The fix: Multiply by 1000 before passing to `formatDuration()`
  - Change: `formatDuration(aggregateMetrics.avgDuration)` → `formatDuration(aggregateMetrics.avgDuration * 1000)`
  - Add `.toFixed(2)` after formatDuration if more precision needed for seconds display

- [ ] **Task 3.4**: Remove redundant tools section in `/Users/viktornawrath/repos/cc-trace-viewer/src/components/ToolUsageDisplay.tsx`
  - Remove "Actually Used" section (lines 181-197)
  - Keep only "Available Tools" section (lines 163-179)
  - Ensure highlighting of used tools remains (green vs gray badges)
  - Adjust grid/layout if needed after removal

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

## Phase 4: Token Count API Response & Final Verification

**Goal**: Verify token count API response parsing is correct and perform end-to-end testing

### Context

**Token Count API:**
- Example response: `/Users/viktornawrath/repos/cc-trace-viewer/example-token-count.json`
- Response structure: `{ input_tokens: 8913 }`
- API endpoint: `https://api.anthropic.com/v1/messages/count_tokens`

**Parsing Locations to Check:**
- Trace parser: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/traceParser.ts`
- Request analyzer: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/requestAnalyzer.ts`
- Any interceptor/data collection code in `/Users/viktornawrath/repos/cc-trace-viewer/docs/claude-trace/src/`

### Implementation Tasks

- [ ] **Task 4.1**: Audit token count response parsing
  - Search codebase for token count API handling
  - Check if `response.body.input_tokens` is correctly extracted
  - Verify field name matches example: `input_tokens` (not `inputTokens`)
  - Check if response is properly typed in TypeScript

- [ ] **Task 4.2**: Fix token count parsing if issues found
  - Update field name access if camelCase was incorrectly used
  - Add proper TypeScript type for count_tokens response
  - Ensure parsed values are stored in correct TraceEntry fields
  - Add fallback/error handling for missing token counts

- [ ] **Task 4.3**: End-to-end data flow verification
  - Trace a request from API response → parsing → display
  - Verify token counts flow through: API → TraceEntry → SessionData → UI
  - Check that all token fields (input, cache read, cache write, output) are captured
  - Confirm calculations (totals, aggregates) are correct

- [ ] **Task 4.4**: Comprehensive testing and bug fixes
  - Load real trace data with various token counts
  - Test with sessions that have no cache usage
  - Test with sessions that have heavy cache usage
  - Test with token count API responses vs regular message responses
  - Fix any edge cases or display issues discovered

### Verification Steps

1. **Token Count API Response**:
   - [ ] Identify where token count responses are parsed
   - [ ] Verify `input_tokens` field is correctly accessed
   - [ ] Check TypeScript types match actual API response
   - [ ] Confirm no parsing errors in console

2. **Data Flow**:
   - [ ] Token count data flows from API → display without loss
   - [ ] All token types (input, cache read/write, output) are preserved
   - [ ] Aggregations (session totals, request totals) are correct
   - [ ] No undefined/NaN values in token displays

3. **Full Application Testing**:
   - [ ] Test all screens: home page, session list, request list, request detail
   - [ ] Verify all Phase 1-3 changes work together
   - [ ] Check for layout breaks, alignment issues, or overflow
   - [ ] Test with various dataset sizes (small, medium, large sessions)

4. **Edge Cases**:
   - [ ] Session with zero tokens in some fields
   - [ ] Session with missing token data
   - [ ] Very large token counts (millions)
   - [ ] Mixed data: some requests with full token data, some without

---

## Success Criteria

The implementation is complete when:

1. ✅ All token displays show new format: `<total_input>(<cache_read>, <cache_write>, <input>)/<output>` with K/M suffixes
2. ✅ System reminders are filtered from all message previews
3. ✅ Message previews show up to 5 lines of actual user content
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
