# Implementation Plan: Sessions Aggregation & Cost Visualization

## Overview

Add two features to the sessions list page (HomePage) to provide better visibility into aggregate session data:
1. **Cost Plot**: A bar chart above the sessions table showing daily costs bucketed by session startTime
2. **Aggregation Sidebar**: A right sidebar showing aggregate totals (cost, API duration, token counts) across all sessions

### Technical Context

- **Current State**: HomePage (`/src/pages/HomePage.tsx:1-186`) displays a single-column layout with SessionTable
- **Data Source**: Sessions loaded via `useSessionData` hook with `SessionSummary[]` containing `SessionMetadata`
- **Available Fields**:
  - `startTime`: Unix timestamp in seconds
  - `totalCost`: number | null (USD)
  - `duration`: number (milliseconds, API time)
  - Token counts: `totalTokens`, `totalInputTokens`, `totalOutputTokens`, cache tokens
- **Chart Library**: Recharts (to be installed)
- **Styling**: Tailwind CSS with existing sidebar pattern from RequestListPage/RequestDetailPage

---

## Phase 1: Install Recharts and Create CostPlot Component

**Goal**: Create a reusable bar chart component that visualizes session costs bucketed by day.

### Context & References

- **Recharts Documentation**: https://recharts.org/
- **Session Data Type**: `/src/services/sessionManager.ts:7-12` (SessionSummary interface)
- **Session Metadata**: `/src/types/trace.ts:109-131` (SessionMetadata interface)
- **Existing Format Utilities**:
  - `/src/services/costCalculator.ts` - `formatCost()` function for USD formatting
  - `/src/services/traceParser.ts` - `formatDuration()` function

### Implementation Steps

- [x] Install Recharts library
  ```bash
  npm install recharts
  ```

- [x] Create new component file: `/src/components/CostPlot.tsx`
  - [x] Accept `sessions: SessionSummary[]` as prop
  - [x] Implement date bucketing logic:
    - Convert `startTime` (unix seconds) to Date object
    - Group sessions by date (YYYY-MM-DD format)
    - Sum `totalCost` for each date bucket (skip sessions with null cost)
    - Sort buckets chronologically
  - [x] Render Recharts BarChart:
    - X-axis: Date buckets (formatted as "MMM DD" or "MM/DD")
    - Y-axis: Total cost in USD
    - Bar color: Match existing theme (blue/purple tones)
    - Tooltip: Show exact date and cost using `formatCost()`
  - [x] Handle edge cases:
    - Empty sessions array: Show "No data" message
    - All sessions with null cost: Show "No cost data available" message
    - Single data point: Still render as bar chart
  - [x] Make responsive: Use ResponsiveContainer from recharts
  - [x] Style container: Dark theme matching existing cards (`bg-gray-900 border border-gray-800`)

### Verification & Testing

✅ **Visual Tests**:
1. View component in isolation with sample data (create a simple test page/story)
2. Verify bars render correctly with multiple sessions across different dates
3. Check tooltip shows correct date and formatted cost
4. Test with empty array - should show appropriate message
5. Test with sessions that have null costs - should skip them gracefully

✅ **Functional Tests**:
1. Verify date bucketing: Multiple sessions on same day should aggregate costs
2. Verify sorting: Dates should appear chronologically on X-axis
3. Verify cost calculation: Sum matches manual calculation
4. Test responsive behavior: Resize window, chart should adapt

✅ **Acceptance Criteria**:
- [x] Component renders bar chart with daily cost buckets
- [x] Tooltip displays date and formatted cost
- [x] Handles empty/null data gracefully
- [x] Matches dark theme styling
- [x] Chart is responsive

### Implementation Notes

**Status**: ✅ **IMPLEMENTED** - Ready for manual testing

**Component Location**: `/src/components/CostPlot.tsx`

**Key Features Implemented**:
- Date bucketing using `useMemo` for performance
- Sessions grouped by day (YYYY-MM-DD format)
- Cost aggregation per day (skips null costs)
- Recharts BarChart with purple bars (`#8B5CF6`)
- Custom tooltip showing date and formatted cost
- Edge case handling for empty data and null costs
- Responsive container with 200px height
- Dark theme styling matching existing components

**Programmatic Tests Passed**:
- TypeScript compilation: ✅ No errors
- Build process: ✅ Successful
- Type safety: ✅ All types properly defined

---

## Phase 2: Create AggregationSidebar Component

**Goal**: Create a sidebar component that displays aggregate totals across all sessions.

### Context & References

- **Existing Sidebar Examples**:
  - `/src/pages/RequestListPage.tsx:293-301` - Sidebar container structure
  - `/src/pages/RequestDetailPage.tsx:516-633` - Sticky sidebar with cards
  - `/src/components/SessionSummary.tsx:64-273` - Sidebar variant styling
- **Sidebar Styling Pattern**:
  - Container: `w-[300px] flex-shrink-0` or `w-[320px] flex-shrink-0`
  - Sticky wrapper: `sticky top-4 space-y-4`
  - Cards: `bg-gray-900 border border-gray-700 rounded-lg p-4`
- **Format Functions**:
  - `/src/services/costCalculator.ts` - `formatCost()`
  - `/src/services/traceParser.ts` - `formatDuration()`

### Implementation Steps

- [ ] Create new component file: `/src/components/AggregationSidebar.tsx`

- [ ] Accept `sessions: SessionSummary[]` as prop

- [ ] Implement aggregation logic:
  - [ ] **Total Cost**: Sum all `session.metadata.totalCost` (skip null values)
    - Track count of sessions with valid cost data
    - Calculate percentage: sessions with cost / total sessions
  - [ ] **Total API Duration**: Sum all `session.metadata.duration` (milliseconds)
    - Use `formatDuration()` for display
  - [ ] **Total Tokens**: Sum all token fields:
    - `totalTokens` (overall total)
    - `totalInputTokens`
    - `totalOutputTokens`
    - `totalCacheCreationTokens`
    - `totalCacheReadTokens`
    - Individual cache token types if needed

- [ ] Create card-based layout:
  - [ ] **Overview Card**:
    - Title: "All Sessions Aggregate"
    - Display: Total session count
  - [ ] **Cost Card**:
    - Title: "Total Cost"
    - Display: Formatted total cost (or "N/A" if no cost data)
    - Subtitle: "Across X sessions with cost data" (if not all sessions have cost)
  - [ ] **Duration Card**:
    - Title: "Total API Duration"
    - Display: Formatted duration
    - Subtitle: "Sum of all API call durations"
  - [ ] **Tokens Card**:
    - Title: "Total Tokens"
    - Display: Total tokens formatted with commas
    - Breakdown: Input, Output, Cache tokens in smaller text

- [ ] Style component:
  - Sticky positioning: `sticky top-4`
  - Use existing card styling: `bg-gray-900 border border-gray-700 rounded-lg p-4`
  - Space between cards: `space-y-4`
  - Text hierarchy: Title (text-sm font-medium), values (text-2xl font-semibold), subtitles (text-xs text-gray-400)

- [ ] Handle edge cases:
  - Empty sessions array: Show "No sessions" state
  - Loading state consideration (will be handled by parent)

### Verification & Testing

✅ **Visual Tests**:
1. View component in isolation with sample session data
2. Verify all cards render with correct styling
3. Check text hierarchy and readability
4. Verify sticky behavior when scrolling (test in parent context)

✅ **Functional Tests**:
1. **Cost Calculation**:
   - Sessions with costs: [10, 20, null, 30] → Display: $60.00, subtitle "3 sessions"
   - All null costs → Display: "N/A" or appropriate message
2. **Duration Calculation**:
   - Sessions with durations: [1000, 2000, 3000] ms → Display formatted "6.0s"
3. **Token Aggregation**:
   - Verify input + output + cache = total
   - Check number formatting (e.g., 1,234,567)
4. Test with empty array → Shows appropriate state

✅ **Acceptance Criteria**:
- [ ] Displays total cost with proper formatting
- [ ] Displays total API duration formatted correctly
- [ ] Displays token totals and breakdown
- [ ] Matches existing sidebar styling pattern
- [ ] Handles null/missing data gracefully
- [ ] Sticky positioning works correctly

---

## Phase 3: Integrate Components into HomePage

**Goal**: Update HomePage layout to include both the cost plot and aggregation sidebar.

### Context & References

- **Current HomePage**: `/src/pages/HomePage.tsx:1-186`
  - Current layout: Single column with header, directory picker, SessionTable
  - Uses `useSessionData()` hook which returns `sessions: SessionSummary[]`
  - Has loading states: `isInitializing`, `isDiscovering`
- **Layout Pattern Reference**: `/src/pages/RequestListPage.tsx:87-301`
  - Main container: `flex gap-6`
  - Left content: `flex-1 min-w-0`
  - Right sidebar: `w-[300px] flex-shrink-0`

### Implementation Steps

- [ ] Import new components into HomePage:
  ```typescript
  import { CostPlot } from '../components/CostPlot';
  import { AggregationSidebar } from '../components/AggregationSidebar';
  ```

- [ ] Update HomePage layout structure:
  - [ ] Wrap main content area and sidebar in flex container:
    ```typescript
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {/* Main content */}
      </div>
      <div className="w-[300px] flex-shrink-0">
        {/* Sidebar */}
      </div>
    </div>
    ```

- [ ] Add CostPlot component above SessionTable:
  - [ ] Place inside main content area (`flex-1 min-w-0` div)
  - [ ] Position before SessionTable
  - [ ] Pass `sessions` prop from `useSessionData()`
  - [ ] Add margin/spacing between plot and table
  - [ ] Only show when sessions are loaded (not during initial loading)

- [ ] Add AggregationSidebar component:
  - [ ] Place inside sidebar container (`w-[300px]` div)
  - [ ] Pass `sessions` prop from `useSessionData()`
  - [ ] Only show when sessions are loaded

- [ ] Handle loading states:
  - [ ] During `isInitializing` or `isDiscovering`:
    - Show skeleton/loading state for plot area
    - Show skeleton/loading state for sidebar
    - Or hide both components until data loads
  - [ ] After loading: Show both components with actual data

- [ ] Handle empty states:
  - [ ] No sessions found: Both components should handle gracefully
  - [ ] CostPlot should show "No data" message
  - [ ] AggregationSidebar should show zeros or "No sessions" state

- [ ] Test responsive behavior:
  - [ ] Ensure layout works on different screen sizes
  - [ ] Consider mobile behavior (may need to stack vertically)

### Verification & Testing

✅ **Visual Tests**:
1. Load HomePage with sessions data
2. Verify layout: Main content (left) with plot + table, sidebar (right)
3. Check spacing between components
4. Verify both components are visible simultaneously
5. Test scrolling: Sidebar should stick, table should scroll
6. Verify dark theme consistency across all components

✅ **Functional Tests**:
1. **With Sessions Data**:
   - CostPlot shows bars for session dates
   - AggregationSidebar shows correct totals
   - SessionTable shows all sessions
   - All three components use the same data source
2. **Loading States**:
   - Initial load: Shows appropriate loading UI
   - After discovery: Components populate with data
3. **Empty States**:
   - No sessions: All components show appropriate empty states
4. **Data Consistency**:
   - Manually verify: Sum of costs in plot = total cost in sidebar
   - Session count in table = count used for aggregations
5. **Interactions**:
   - Click session in table → Navigate to RequestListPage (existing behavior preserved)
   - Sort table → Doesn't affect plot or sidebar (they show all sessions regardless of sort)

✅ **Integration Tests**:
1. Start fresh: Select directory → Sessions load → All components populate
2. Switch directory → All components update with new data
3. Error handling → If session loading fails, components handle gracefully

✅ **Cross-browser Testing**:
1. Test in Chrome, Firefox, Safari
2. Verify Recharts renders correctly in all browsers
3. Check sticky sidebar behavior across browsers

✅ **Acceptance Criteria**:
- [ ] HomePage shows cost plot above sessions table
- [ ] HomePage shows aggregation sidebar on the right
- [ ] Layout matches existing page patterns (RequestListPage style)
- [ ] Loading states handled appropriately
- [ ] Empty states handled gracefully
- [ ] Data consistency between all three components
- [ ] Existing SessionTable functionality preserved
- [ ] Responsive layout works on different screen sizes

---

## Final Verification Checklist

After completing all phases:

- [ ] Run application and navigate to HomePage
- [ ] Verify both features are visible and functional
- [ ] Check data accuracy: Manually calculate totals and compare
- [ ] Test with various data scenarios:
  - [ ] Many sessions (50+)
  - [ ] Few sessions (1-5)
  - [ ] Empty directory
  - [ ] Sessions with missing cost data
  - [ ] Sessions spanning multiple days/weeks
- [ ] Verify performance: Page loads quickly with many sessions
- [ ] Check TypeScript: No type errors
- [ ] Test user workflow: Select directory → View aggregate data → Click session → Navigate (existing flow)
- [ ] Verify styling consistency with rest of application
- [ ] Test on different screen sizes/viewports

---

## Notes

- **Data Flow**: All components receive `sessions` from `useSessionData()` hook - single source of truth
- **Cost Handling**: Some sessions may have `totalCost: null` (unknown pricing) - handle gracefully throughout
- **Time Zones**: `startTime` is Unix timestamp; bucket by UTC or local time (decide during implementation)
- **Performance**: With many sessions, consider memoizing aggregation calculations
- **Future Enhancement**: Could add date range selector to filter plot and aggregations
