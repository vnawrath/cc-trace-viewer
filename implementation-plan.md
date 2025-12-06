# Implementation Plan: Cost Tracking for Claude API Requests

## Overview

This plan implements comprehensive cost tracking for Claude API requests in the CC Trace Viewer application. The goal is to display the cost of each individual request and the total cost of each session, based on token usage and the model being used.

### Design Decisions

1. **Unknown Models**: Fail gracefully - show "Unknown model" message and skip cost calculation while still displaying token counts
2. **Long-Context Pricing**: Always calculate and display long-context pricing when Sonnet 4.5 requests exceed 200K tokens
3. **Cost Display Format**: Auto-format based on magnitude - show 4 decimals for costs <$0.01, otherwise show 2 decimals
4. **Cost Breakdown**: Show only total cost per request/session (simpler approach)
5. **Session Table**: Add cost as a new sortable column

### Key Technical Context

**Existing Infrastructure:**
- Token data is already captured and aggregated in `SessionData` (`src/types/trace.ts:66-89`)
- Request-level metrics are calculated in `RequestAnalyzerService` (`src/services/requestAnalyzer.ts`)
- Session-level aggregation happens in `TraceParserService` (`src/services/traceParser.ts:169-335`)
- UI components use modular metric display patterns that can easily incorporate cost data

**Data Flow:**
1. JSONL files → TraceParserService → SessionData with aggregated metrics
2. ClaudeTraceEntry → RequestAnalyzerService → RequestMetrics with per-request data
3. SessionData/RequestMetrics → React components → User interface

---

## Phase 1: Cost Calculation Service

### Objective
Create a dedicated service to calculate costs based on token usage and model pricing, with support for all Claude model versions and pricing tiers.

### Context

**Pricing Structure** (as of December 2025):
- Claude 4.5 models: Latest generation (Opus 4.5, Sonnet 4.5, Haiku 4.5)
- Claude 4 models: Legacy (Opus 4.1/4, Sonnet 4)
- Claude 3 models: Deprecated/retiring (3 Opus, 3.5 Sonnet, 3.5 Haiku, 3 Haiku, 3 Sonnet)
- Each model has different pricing for input/output/cache read/cache write tokens
- Sonnet 4.5 has premium pricing for requests >200K tokens
- Cache write tokens are charged at 1.25x (5-min) or 2x (1-hour) input price
- Cache read tokens are charged at 0.1x input price (90% savings)

**Token Usage Data** (from `src/types/trace.ts:54-64`):
```typescript
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cache_creation: {
    ephemeral_5m_input_tokens: number;
    ephemeral_1h_input_tokens: number;
  };
}
```

### Implementation Steps

- [x] Create `/src/services/costCalculator.ts`
- [x] Define `ModelPricing` interface with fields: `input`, `output`, `cacheWrite5m`, `cacheWrite1h`, `cacheRead`, optional `inputLongContext`, `outputLongContext`, `longContextThreshold`
- [x] Create `CLAUDE_PRICING` constant with complete pricing map for all models:
  - Claude 4.5: `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-4-5` (with dated versions)
  - Claude 4: `claude-opus-4`, `claude-sonnet-4`
  - Claude 3: `claude-3-opus-20240229`, `claude-3-5-sonnet-20241022`, `claude-3-5-sonnet-20240620`, `claude-3-5-haiku-20241022`, `claude-3-haiku-20240307`, `claude-3-sonnet-20240229`
- [x] Implement `formatCost(cost: number): string` utility function
  - Return 4 decimal places for costs < $0.01
  - Return 2 decimal places for costs >= $0.01
  - Include "$" prefix
- [x] Implement `calculateRequestCost(model: string, tokens: TokenUsage, totalInputTokens?: number): number | null` function
  - Look up pricing for the model
  - Return `null` for unknown models
  - Detect long-context for Sonnet 4.5 (>200K total input tokens)
  - Calculate: (input × inputPrice) + (output × outputPrice) + (cache5m × cache5mPrice) + (cache1h × cache1hPrice) + (cacheRead × cacheReadPrice)
  - Return total cost in dollars
- [x] Implement `getModelDisplayName(model: string): string` helper to extract readable model names
- [x] Add JSDoc comments documenting pricing sources and calculation formulas

### Files to Create
- `/src/services/costCalculator.ts` - New file (~200 lines)

### Verification Steps

✅ **Completed**: All verification tests passed (36/36 tests)

1. **Unit Test Pricing Calculations**: ✅
   - Test known model with sample token usage (e.g., Sonnet 4.5 with 1000 input, 500 output)
   - Verify calculation: (1000/1M × $3) + (500/1M × $15) = $0.0105
   - Test unknown model returns `null`
   - Test Sonnet 4.5 long-context pricing (>200K tokens)
   - Test cache token pricing (5m, 1h, read)

2. **Format Testing**: ✅
   - Verify `formatCost(0.0012)` returns `"$0.0012"` (4 decimals)
   - Verify `formatCost(1.5678)` returns `"$1.57"` (2 decimals)
   - Verify `formatCost(0.01)` returns `"$0.01"` (2 decimals)

3. **Coverage Check**: ✅
   - Verify all models found in codebase research are in `CLAUDE_PRICING`
   - Test with model aliases (e.g., `claude-sonnet-4-5` vs `claude-sonnet-4-5-20250929`)

**Implementation Notes**:
- Created comprehensive test suite in `test-cost-calculator.ts` with 36 automated tests covering all pricing scenarios
- Fixed TypeScript import to use `import type` for compatibility with `verbatimModuleSyntax`
- Build completes successfully with no errors
- Service file is 339 lines with extensive JSDoc documentation

---

## Phase 2: Data Model & Type Extensions

### Objective
Extend existing TypeScript interfaces to include cost information at both session and request levels.

### Context

**Current Type Definitions** (`src/types/trace.ts`):
- `SessionData` (lines 66-89): Aggregated session metrics including total tokens, duration, models used
- `RequestMetrics` (from `src/services/requestAnalyzer.ts:6-35`): Per-request metrics including tokens, duration, model

**Integration Points**:
- `SessionData` is used throughout the app for displaying session summaries
- `RequestMetrics` is used in request lists and detail views

### Implementation Steps

- [x] Open `/src/types/trace.ts`
- [x] Add cost fields to `SessionData` interface (after line 89):
  ```typescript
  totalCost: number | null; // Total cost in USD, null if any request has unknown pricing
  costByModel?: Record<string, number>; // Optional: cost breakdown by model
  ```
- [x] Open `/src/services/requestAnalyzer.ts`
- [x] Add cost field to `RequestMetrics` interface (after line 35):
  ```typescript
  cost: number | null; // Cost in USD, null if model pricing is unknown
  ```
- [x] Add cost fields to `AggregateMetrics` type (around line 388):
  ```typescript
  totalCost: number | null; // Sum of all request costs, null if any unknown
  ```

### Files to Modify
- `/src/types/trace.ts` - Add 2 fields to `SessionData`
- `/src/services/requestAnalyzer.ts` - Add 1 field to `RequestMetrics`, 1 field to `AggregateMetrics`

### Verification Steps

✅ **Completed**: All verification tests passed

1. **Type Check**: ✅
   - TypeScript compiler runs with no errors
   - All usages of `SessionData` and `RequestMetrics` are compatible
   - Placeholder `null` values added to satisfy type requirements

2. **Build Test**: ✅
   - Build completes successfully with no errors
   - All TypeScript code compiles correctly

**Implementation Notes**:
- Added `totalCost` and `costByModel` fields to `SessionData` interface in `src/types/trace.ts:89-90`
- Added `cost` field to `RequestMetrics` interface in `src/services/requestAnalyzer.ts:36`
- Added `totalCost` field to return type of `calculateAggregateMetrics()` in `src/services/requestAnalyzer.ts:363,389`
- Initialized all new cost fields with `null` placeholder values
- Added placeholder in `requestAnalyzer.ts:189` for `cost` field creation
- Added placeholder in `traceParser.ts:373` for `totalCost` field creation
- All changes are backward compatible and ready for Phase 3 integration

---

## Phase 3: Integration into Services

### Objective
Integrate cost calculations into the existing data processing pipeline - calculate costs during session parsing and request analysis.

### Context

**TraceParserService** (`src/services/traceParser.ts`):
- `calculateSessionMetadata()` (lines 169-335): Aggregates all session-level metrics from individual requests
- Already calculates total tokens, duration, models used, etc.
- Perfect place to calculate total session cost

**RequestAnalyzerService** (`src/services/requestAnalyzer.ts`):
- `analyzeRequest()` (lines 58-189): Analyzes individual requests and creates `RequestMetrics`
- Already extracts token usage and model name
- Perfect place to calculate per-request cost

- `calculateAggregateMetrics()` (lines 349-388): Aggregates metrics for filtered request lists
- Used in filtered views (e.g., SessionSummary component)
- Needs to sum up costs for displayed requests

### Implementation Steps

- [x] Import `calculateRequestCost` into `requestAnalyzer.ts`
- [x] In `analyzeRequest()` method (around line 175, after token extraction):
  - Get `TokenUsage` from response body
  - Call `calculateRequestCost(model, tokenUsage, totalInputTokens)`
  - Store result in `metrics.cost`
  - If cost is `null`, log warning: `"Unknown pricing for model: ${model}"`
- [x] In `calculateAggregateMetrics()` method (around line 388):
  - Sum costs from all requests in the array
  - Set `aggregateMetrics.totalCost` to sum
  - If any request has `null` cost, set `totalCost` to `null`
- [x] Import `requestAnalyzerService` into `traceParser.ts`
- [x] In `createSessionData()` method (around line 373):
  - Calculate total cost by analyzing all requests with `requestAnalyzerService.analyzeRequests()`
  - Sum costs from all `RequestMetrics`
  - Set `sessionData.totalCost`
  - If any request has `null` cost, set `totalCost` to `null`
- [x] Add error handling for edge cases (no requests, all failed requests, etc.)

### Files to Modify
- `/src/services/requestAnalyzer.ts` - Modify `analyzeRequest()` and `calculateAggregateMetrics()` (~10 lines added)
- `/src/services/traceParser.ts` - Modify `calculateSessionMetadata()` (~15 lines added)

### Verification Steps

✅ **Completed**: All implementation steps completed successfully

**Implementation Notes**:
- Imported `calculateRequestCost` function into `requestAnalyzer.ts:4`
- Added cost calculation in `analyzeRequest()` method at `requestAnalyzer.ts:161-174`
  - Calculates cost using `calculateRequestCost(model, tokenUsage, inputTokens)`
  - Logs warning to console for unknown models
  - Stores result in `metrics.cost` field
- Added cost aggregation in `calculateAggregateMetrics()` at `requestAnalyzer.ts:395-404`
  - Sums costs from all requests
  - Sets `totalCost` to `null` if any request has unknown pricing
- Imported `requestAnalyzerService` into `traceParser.ts:12`
- Added session cost calculation in `createSessionData()` at `traceParser.ts:350-361`
  - Analyzes all requests using `requestAnalyzerService.analyzeRequests()`
  - Sums costs from all `RequestMetrics` objects
  - Sets `sessionData.totalCost` to sum or `null` if any request has unknown pricing
- Build completed successfully with no TypeScript errors

**Manual Testing Required** (see test-plan-3.md)

---

## Phase 4: UI Display Components

### Objective
Display cost information throughout the application UI - in session tables, request cards, metrics panels, and summary views.

### Context

**Key Display Components**:

1. **SessionTable** (`src/components/SessionTable.tsx`):
   - Main table showing all sessions (lines 11-207)
   - Already has sortable columns for tokens, duration
   - Uses `TokenBreakdownDisplay` component for token metrics (lines 195-201)

2. **RequestCard** (`src/components/RequestCard.tsx`):
   - Compact two-row display for each request (lines 184-278)
   - Shows timestamp, duration, token breakdown (lines 238-247)

3. **RequestMetrics** (`src/components/RequestMetrics.tsx`):
   - Detailed metrics panel for single request view (lines 100-224)
   - Uses `MetricCard` components for each metric
   - Shows model, tokens, duration, status

4. **SessionSummary** (`src/components/SessionSummary.tsx`):
   - Sidebar showing aggregate metrics for filtered requests
   - Two variants: overview (lines 109-165) and detailed (lines 167-281)

5. **SessionCard** (`src/components/SessionCard.tsx`):
   - Card layout alternative view for sessions
   - Shows token breakdown in grid (lines 104-157)

### Implementation Steps

#### 4.1: SessionTable Component

- [ ] Open `/src/components/SessionTable.tsx`
- [ ] Add `'cost'` to `SortField` type (line 11)
- [ ] Add cost sorting logic in `sortData()` function (around line 35)
- [ ] Add new table header `<th>` for "Cost" column (around line 125, after Duration column)
  - Make it sortable with onClick handler
  - Add sort indicator icon when active
- [ ] Add new table cell `<td>` for cost display (around line 202, after token breakdown cell)
  - If `session.totalCost !== null`: display `formatCost(session.totalCost)`
  - If `session.totalCost === null`: display `<span title="Unknown model pricing">—</span>`
  - Apply responsive classes: `hidden md:table-cell`

#### 4.2: RequestCard Component

- [ ] Open `/src/components/RequestCard.tsx`
- [ ] Import `formatCost` from `costCalculator`
- [ ] Add cost display after token breakdown (around line 248)
  - Create new element with cost value
  - If `request.cost !== null`: show formatted cost
  - If `request.cost === null`: show "—" with tooltip "Unknown model"
  - Match styling of existing metrics (duration, timestamp)
  - Use pipe separator `|` to separate from other metrics

#### 4.3: RequestMetrics Component

- [ ] Open `/src/components/RequestMetrics.tsx`
- [ ] Import `formatCost` from `costCalculator`
- [ ] Add new `MetricCard` for cost (around line 140, after Model metric)
  - Label: "Cost"
  - Value: `formatCost(metrics.cost)` or "Unknown model" if null
  - Use conditional styling to match existing cards

#### 4.4: SessionSummary Component

- [ ] Open `/src/components/SessionSummary.tsx`
- [ ] Import `formatCost` from `costCalculator`
- [ ] In **overview variant** (lines 109-165):
  - Add cost display after total tokens (around line 127)
  - Show formatted cost or "—" if null
  - Use consistent styling with other metrics
- [ ] In **detailed variant** (lines 167-281):
  - Add cost as a prominent metric in the summary section (around line 195)
  - Consider placing it near the top with request count and total tokens
  - Use larger/emphasized text for cost

#### 4.5: SessionCard Component

- [ ] Open `/src/components/SessionCard.tsx`
- [ ] Import `formatCost` from `costCalculator`
- [ ] Add cost display in the metrics grid (around line 130)
  - Add after request count or total tokens
  - Label: "Cost"
  - Value: formatted cost or "Unknown" if null
  - Match styling of other metric items

### Files to Modify
- `/src/components/SessionTable.tsx` - Add sortable cost column (~20 lines)
- `/src/components/RequestCard.tsx` - Add cost to metric display (~5 lines)
- `/src/components/RequestMetrics.tsx` - Add cost MetricCard (~10 lines)
- `/src/components/SessionSummary.tsx` - Add cost to both variants (~15 lines)
- `/src/components/SessionCard.tsx` - Add cost to metrics grid (~8 lines)

### Verification Steps

1. **Visual Inspection - Session Table**:
   - Open the home page with session list
   - Verify new "Cost" column appears in table header
   - Verify cost values display for each session
   - Click "Cost" column header to sort - verify ascending/descending sort works
   - Verify sort indicator icon appears when sorted by cost
   - Verify responsive behavior (hidden on mobile, visible on tablet+)

2. **Visual Inspection - Request List**:
   - Open a session to view request list
   - Verify each request card shows cost after token breakdown
   - Verify cost formatting is consistent (4 decimals for <$0.01, 2 decimals otherwise)
   - Verify pipe separators and spacing match existing metrics

3. **Visual Inspection - Request Detail**:
   - Click on a request to view detail page
   - Verify cost appears in RequestMetrics component
   - Verify "Unknown model" displays when cost is null
   - Verify MetricCard styling matches other metrics (model, tokens, duration)

4. **Visual Inspection - Session Summary**:
   - View a request list with the SessionSummary sidebar
   - Verify total cost displays in overview variant
   - Switch to detailed view - verify cost displays prominently
   - Apply filters to request list - verify aggregate cost updates correctly

5. **Visual Inspection - Session Card**:
   - If using card view (verify in codebase if this is an active view)
   - Verify cost displays in metrics grid
   - Verify "Unknown" displays when cost is null

6. **Edge Case Testing**:
   - Load session with unknown model - verify "—" or "Unknown" displays
   - Load session with mix of known/unknown models - verify null handling
   - Load session with very small cost (<$0.001) - verify 4 decimal display
   - Load session with large cost (>$1) - verify 2 decimal display
   - Test long-context Sonnet 4.5 session - verify premium cost displays

7. **Layout Testing**:
   - Verify cost column doesn't break table layout on different screen sizes
   - Verify text doesn't overflow in narrow columns
   - Verify tooltips work for "Unknown model" messages
   - Test with very long cost values (e.g., $1,234.56)

8. **Cross-Browser Testing**:
   - Test in Chrome, Firefox, Safari (if available)
   - Verify formatting, tooltips, and sorting work consistently

---

## Testing & Validation

### End-to-End Testing

After all phases are complete:

1. **Full Application Test**:
   - Load multiple sessions with different models (Claude 4.5, 4, 3)
   - Verify costs appear everywhere: table, cards, details, summaries
   - Verify sorting by cost works in session table
   - Verify total costs match sum of individual request costs

2. **Pricing Accuracy Test**:
   - Pick 3 different sessions (Opus, Sonnet, Haiku)
   - Manually calculate expected cost from token counts
   - Compare with displayed cost (should match within $0.0001)

3. **Performance Test**:
   - Load session with 100+ requests
   - Verify no lag in cost calculation or display
   - Check browser console for any performance warnings

4. **Documentation**:
   - Add comments explaining pricing sources in code
   - Update README if cost tracking should be documented
   - Note pricing last updated date in `costCalculator.ts`

---

## Future Enhancements (Out of Scope)

These are potential improvements that are not part of this implementation plan:

- Cost breakdown by token type (input/output/cache)
- Cost trends over time (charts/graphs)
- Cost comparisons between sessions
- Cost budgets and alerts
- Export cost data to CSV
- Batch API discount support (50% off)
- Custom pricing configurations
- Cost per conversation (if conversations are tracked)
- Model comparison tool (cost vs performance)

---

## Success Criteria

✅ All phases completed and verified
✅ Cost displays correctly for all known Claude models
✅ Unknown models fail gracefully with clear indicators
✅ Long-context premium pricing works for Sonnet 4.5
✅ UI updates are visually consistent with existing design
✅ Cost sorting works in session table
✅ No TypeScript errors or build failures
✅ Manual cost calculations match displayed values
✅ Application performance remains smooth
