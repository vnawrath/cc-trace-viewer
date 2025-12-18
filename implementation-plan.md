# Implementation Plan: Navigation & Conversation Visual Grouping

## Overview

This plan adds navigation controls (prev/next buttons) and visual conversation grouping to the CC Trace Viewer. The implementation distinguishes single-turn requests from multi-turn conversations and provides visual color coding to identify different conversation threads within a session.

**Key Features:**
- Prev/Next session navigation on session view (RequestListPage)
- Prev/Next request navigation on request detail view (RequestDetailPage)
- Grey left border + muted text for single-turn conversations
- Deterministic color-coded left borders for multi-turn conversation groups
- Conversation grouping based on system prompt, model, and normalized first user message

---

## Phase 1: Session & Request Navigation

**Goal:** Add prev/next navigation buttons to both session and request views.

### Context & Files

**Session Navigation (RequestListPage):**
- Current file: `/Users/viktornawrath/repos/cc-trace-viewer/src/pages/RequestListPage.tsx`
- Hook: `/Users/viktornawrath/repos/cc-trace-viewer/src/hooks/useSessionData.ts`
- Service: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/sessionManager.ts`

**Request Navigation (RequestDetailPage):**
- Current file: `/Users/viktornawrath/repos/cc-trace-viewer/src/pages/RequestDetailPage.tsx`
- Hook: `/Users/viktornawrath/repos/cc-trace-viewer/src/hooks/useRequestList.ts`

### Implementation Steps

#### 1.1 Add Session Navigation to useSessionData Hook

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/hooks/useSessionData.ts`

- [x] Add function `getAdjacentSessions(currentSessionId: string)` that returns `{ prevSessionId: string | null, nextSessionId: string | null }`
- [x] Sort sessions chronologically by sessionId (format: `log-YYYY-MM-DD-HH-mm-ss`)
- [x] Find current session index and return prev/next based on position
- [x] Export this function from the hook

**Status:** ✅ Implemented - Function added at line 101

#### 1.2 Add Session Navigation UI to RequestListPage

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/pages/RequestListPage.tsx`

- [x] Call `getAdjacentSessions(sessionId)` from useSessionData hook
- [x] Add navigation buttons in header/breadcrumb area:
  - "← Previous Session" (disabled if `prevSessionId === null`)
  - "Next Session →" (disabled if `nextSessionId === null`)
- [x] Use `useNavigate()` to navigate to `/sessions/${prevSessionId}/requests` or `/sessions/${nextSessionId}/requests`
- [x] Add keyboard shortcuts: Alt+Left (prev session), Alt+Right (next session)

**Status:** ✅ Implemented - Navigation buttons added at line 197, keyboard shortcuts at line 40

#### 1.3 Add Request Navigation to useRequestList Hook

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/hooks/useRequestList.ts`

- [x] Add function `getAdjacentRequests(currentRequestId: string, filteredRequests: RequestMetrics[])`
- [x] Return `{ prevRequestId: string | null, nextRequestId: string | null }`
- [x] Use the **filtered** request list (honors active filters)
- [x] Find current request in filtered list and return prev/next IDs

**Status:** ✅ Implemented - Function added at line 134

#### 1.4 Add Request Navigation UI to RequestDetailPage

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/pages/RequestDetailPage.tsx`

- [x] Import and use `getAdjacentRequests()` from useRequestList hook
- [x] Add navigation buttons in header area:
  - "← Previous Request" (disabled if `prevRequestId === null`)
  - "Next Request →" (disabled if `nextRequestId === null`)
- [x] Use `useNavigate()` to navigate to `/sessions/${sessionId}/requests/${prevRequestId}` or next
- [x] Add keyboard shortcuts: Left Arrow (prev request), Right Arrow (next request)

**Status:** ✅ Implemented - Navigation buttons added at line 308, keyboard shortcuts at line 133

---

## Phase 2: Conversation Grouping Logic

**Goal:** Implement logic to identify single-turn conversations and group multi-turn conversations by conversation thread.

### Context & Files

Reference implementation in claude-trace:
- `/Users/viktornawrath/repos/cc-trace-viewer/docs/claude-trace/src/shared-conversation-processor.ts` (lines 496-533, 776-800)

New files to create:
- Service: `/Users/viktornawrath/repos/cc-trace-viewer/src/services/conversationGrouper.ts`
- Types: Update `/Users/viktornawrath/repos/cc-trace-viewer/src/types/trace.ts`

### Implementation Steps

#### 2.1 Define Conversation Group Types

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/types/trace.ts`

- [x] Add interface `ConversationThreadGroup`:
  ```typescript
  interface ConversationThreadGroup {
    groupId: string;          // Hash of system+model+firstMessage
    groupIndex: number;       // Sequential index (0, 1, 2...)
    requestIds: string[];     // All request IDs in this group
    isSingleTurn: boolean;    // True if messages.length <= 2
    systemPrompt: string;     // System prompt text
    model: string;            // Model name
    firstUserMessage: string; // Normalized first user message
    color?: string;           // Generated color (hsl format)
  }
  ```
- [x] Add `conversationThreadGroup?: ConversationThreadGroup` field to `RequestMetrics` interface

**Status:** ✅ Implemented - Interface added at line 157, field added to RequestMetrics
**Test:** ✅ TypeScript compiles without errors.

#### 2.2 Create Conversation Grouping Service

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/services/conversationGrouper.ts`

- [x] Create class `ConversationGrouperService`
- [x] Implement `groupConversations(requests: ClaudeTraceEntry[]): Map<string, ConversationThreadGroup>`
  - Group by: system prompt + model + normalized first user message
  - Identify single-turn: `request.messages.length <= 2`
  - Generate groupId: hash of `JSON.stringify({ system, model, firstMessage })`
  - Assign sequential groupIndex to each unique group

**Status:** ✅ Implemented - Service created with full grouping logic

**Test:**
- [x] Test with mock data containing single-turn requests (verify `isSingleTurn: true`)
- [x] Test with multi-turn requests sharing same first message (verify grouped together)
- [x] Test with different system prompts (verify separate groups)
**Status:** ✅ All tests passing (15/15 tests in conversationGrouper.test.ts)

#### 2.3 Implement Message Normalization

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/services/conversationGrouper.ts`

- [x] Add `normalizeMessage(content: string): string` function
- [x] Strip dynamic content patterns:
  - Timestamps: `YYYY-MM-DD HH:MM:SS` → `[TIMESTAMP]`
  - URLs: `http://...` → `[URL]` (processed first to avoid conflicts)
  - File paths: specific paths → `[FILE]`
  - System reminders: `<system-reminder>...</system-reminder>` → `[SYSTEM-REMINDER]`
- [x] Trim whitespace and normalize line breaks

**Status:** ✅ Implemented - Full normalization with proper ordering to avoid conflicts

**Test:**
- [x] Test with messages containing timestamps (verify normalization)
- [x] Test with file paths (verify normalization)
- [x] Test identical messages with different timestamps (verify they match after normalization)
- [x] Test with URLs (verify normalization)
- [x] Test with system reminders (verify normalization)
**Status:** ✅ All normalization tests passing (Tests 6-9)

#### 2.4 Implement Deterministic Color Generation

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/services/conversationGrouper.ts`

- [x] Add `generateColorFromHash(groupId: string): string` function
- [x] Use simple hash function to convert groupId to number (bitwise operations)
- [x] Generate HSL color: `hsl(${hue}, 70%, 50%)`
  - Hue: derived from hash (0-360 degrees)
  - Fixed saturation (70%) and lightness (50%) for consistency
- [x] Return color string in HSL format

**Status:** ✅ Implemented - Deterministic HSL color generation based on groupId hash

**Test:**
- [x] Test same groupId returns same color (deterministic)
- [x] Test different groupIds return different colors
- [x] Verify colors are visually distinct (manual check of generated colors)
**Status:** ✅ Color generation tests passing (Tests 10-11)

#### 2.5 Integrate with Request Analyzer

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/services/requestAnalyzer.ts`

- [x] Import `ConversationGrouperService`
- [x] In `analyzeRequests()` function (line 232):
  - Call `conversationGrouper.groupConversations(requests)`
  - Match each request to its conversation group
  - Assign `conversationThreadGroup` field to each `RequestMetrics` object
  - Colors are already generated in the grouper service

**Status:** ✅ Implemented - Full integration with request analyzer at line 232-256

**Test:**
- [x] Build verifies TypeScript compilation
- [x] Integration tested via automated tests
- Manual testing needed (see test-plan-2.md):
  - [ ] Load a session with multiple requests
  - [ ] Verify each RequestMetrics has `conversationThreadGroup` populated
  - [ ] Verify single-turn requests have `isSingleTurn: true`
  - [ ] Verify multi-turn requests in same conversation have same groupId and color

---

## Phase 3: Visual Styling for Conversation Groups

**Goal:** Apply colored left borders and styling to distinguish single-turn from multi-turn conversations in the UI.

**📋 Detailed Strategy Document:** See [phase-3-detailed-strategy.md](./phase-3-detailed-strategy.md) for comprehensive implementation approach, including:
- Architecture overview and data flow
- Component-by-component analysis
- Implementation steps with code examples
- Testing strategy and success criteria
- Rollback plan and future enhancements

### Context & Files

**Components to Update:**
- `/Users/viktornawrath/repos/cc-trace-viewer/src/components/RequestCard.tsx`
- `/Users/viktornawrath/repos/cc-trace-viewer/src/pages/RequestDetailPage.tsx`

**Reference styling from claude-trace:**
- `/Users/viktornawrath/repos/cc-trace-viewer/docs/claude-trace/frontend/src/components/simple-conversation-view.ts` (lines 764-775)

### Implementation Steps

#### 3.1 Add Border Styling to RequestCard

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/components/RequestCard.tsx`

- [ ] Extract `conversationGroup` from `request.conversationGroup`
- [ ] Calculate border style:
  - **Single-turn:** `borderLeft: "4px solid rgb(156, 163, 175)"` (grey, Tailwind gray-400)
  - **Multi-turn:** `borderLeft: "4px solid ${conversationGroup.color}"`
- [ ] Apply border style to main card container div
- [ ] For single-turn requests, add `opacity: 0.6` to text content

**Test:**
- [ ] Verify single-turn requests show grey left border with muted text
- [ ] Verify multi-turn requests show colored left border
- [ ] Verify requests in same conversation group have same colored border
- [ ] Verify different conversation groups have different colored borders

#### 3.2 Add Border Styling to RequestDetailPage

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/pages/RequestDetailPage.tsx`

- [ ] Get `conversationGroup` from current request
- [ ] Apply same border logic as RequestCard:
  - Single-turn: grey border + muted styling
  - Multi-turn: colored border matching the conversation group
- [ ] Add border to main content container or message display area

**Test:**
- [ ] Navigate to a single-turn request detail, verify grey border
- [ ] Navigate to a multi-turn request detail, verify colored border
- [ ] Navigate between requests in same conversation, verify consistent border color
- [ ] Navigate between different conversations, verify different border colors

#### 3.3 Update ConversationView Component (if needed)

**File:** `/Users/viktornawrath/repos/cc-trace-viewer/src/components/ConversationView.tsx`

- [ ] Check if this component is used in RequestDetailPage (line references from research)
- [ ] If used, pass `conversationGroup` as prop
- [ ] Apply border styling to conversation container
- [ ] Maintain consistent styling with RequestCard

**Test:**
- [ ] Verify conversation view matches styling of request card
- [ ] Verify smooth visual transition when navigating from list to detail

#### 3.4 Add Visual Polish

**Files:** All updated components

- [ ] Ensure border styling is consistent across all views
- [ ] Add smooth transitions for border colors (CSS: `transition: border-color 0.2s ease`)
- [ ] Verify border doesn't cause layout shift (use consistent padding/margin)
- [ ] Test in both light and dark mode (if applicable)
- [ ] Ensure colors have sufficient contrast for accessibility

**Test:**
- [ ] Visual regression test across multiple sessions
- [ ] Test with edge cases:
  - Session with only single-turn requests
  - Session with only multi-turn requests
  - Session with 10+ different conversation groups (verify colors are distinct)
- [ ] Verify no layout shifts when borders are applied
- [ ] Test responsive behavior on different screen sizes

---

## Verification & Testing

### Phase 1 Verification
- [ ] Session navigation works on RequestListPage
- [ ] Request navigation works on RequestDetailPage
- [ ] Keyboard shortcuts function correctly
- [ ] Navigation respects filtered requests
- [ ] Edge cases handled (first/last session, first/last request)

### Phase 2 Verification
- [ ] Single-turn conversations identified correctly
- [ ] Multi-turn conversations grouped by thread
- [ ] Message normalization works as expected
- [ ] Colors generated deterministically
- [ ] Integration with requestAnalyzer complete

### Phase 3 Verification
- [ ] Single-turn requests have grey border + muted text
- [ ] Multi-turn requests have colored borders
- [ ] Same conversation = same color across all views
- [ ] Visual styling is consistent and polished
- [ ] Accessibility maintained

### Final Integration Test
- [ ] Load session with mixed single/multi-turn requests
- [ ] Navigate through sessions using prev/next buttons
- [ ] Navigate through requests using prev/next buttons
- [ ] Verify visual grouping matches conversation threads
- [ ] Test with real claude-trace data from multiple sources
- [ ] Performance check: no lag with 100+ requests in session

---

## Notes

- All keyboard shortcuts should be documented in UI (tooltips or help text)
- Color generation should be deterministic but visually distinct
- Grey color for single-turn: `rgb(156, 163, 175)` (Tailwind gray-400)
- Opacity for single-turn text: `0.6`
- Border width: `4px`
- Consider adding data-testid attributes for automated testing
