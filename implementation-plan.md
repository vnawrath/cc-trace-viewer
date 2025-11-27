# Implementation Plan: CC Trace Viewer Redesign

## Overview

This plan redesigns the CC Trace Viewer as a professional, information-dense debugging tool with a **Data Terminal Aesthetic**. The design draws inspiration from IDE/terminal interfaces with maximum data density, dark mode throughout, and progressive disclosure patterns.

### Design Principles
- **Whitespace is the enemy**: Maximize visible information per screen
- **Dark mode first**: Slate-based color scheme (gray-950/900/800 backgrounds)
- **Professional/utilitarian**: Terminal-inspired with monospace fonts for data
- **Syntax-highlighted data**: Color-coded metrics (green=success, red=errors, cyan=data, amber=warnings)
- **Progressive disclosure**: Collapsed filters, tabbed content, hover details
- **Tailwind CSS v4 exclusive**: Use @theme directive for custom colors, fonts, and animations

### Key Design Decisions
- Right sidebar for metadata (keeps main content left-aligned)
- Very compact tables with minimal padding and small monospace fonts
- Oldest requests first (ascending timestamp sort)
- Filters collapsed by default with keyboard shortcuts
- Tab-based navigation for raw data, headers, and tool definitions

---

## Phase 1: Global Dark Theme & Typography Setup

**Goal**: Establish the dark theme foundation, typography system, and core color palette using Tailwind CSS v4's @theme directive.

### Context & Files
- **Global CSS**: `src/index.css` - Define @theme configuration
- **Layout**: `src/layouts/AppLayout.tsx` - Apply dark background
- **Components affected**: All components will inherit the new theme

### Tasks
- [x] Use `/frontend-design` skill to design the dark theme color palette
- [x] Configure @theme directive in `src/index.css` with:
  - Custom color palette (slate-based with syntax colors: green for success, red for errors, cyan for data, amber for warnings, purple for highlights)
  - Typography system with distinctive monospace font for data (IBM Plex Mono via Google Fonts)
  - Custom font for headers (DM Sans)
  - Custom spacing scale for compact layouts
  - Animation keyframes for smooth transitions
- [x] Update `src/layouts/AppLayout.tsx` to use dark background (bg-gray-950)
- [x] Update `src/components/Header.tsx` to use new dark theme with compact design
- [x] Update `src/components/Navigation.tsx` to minimal breadcrumb style
- [x] Update `src/components/Breadcrumbs.tsx` to minimal style for dark theme
- [x] Update `src/pages/NotFoundPage.tsx` for dark theme
- [x] Update `src/components/LoadingSkeleton.tsx` for dark backgrounds
- [x] Update `src/components/ErrorBoundary.tsx` for dark theme
- [x] Test build to ensure no TypeScript or build errors

### Verification
- [x] All pages have dark backgrounds with no white flashes
- [x] Typography is legible with proper contrast ratios (WCAG AA)
- [x] Navigation is compact and doesn't waste vertical space
- [x] Custom fonts load correctly from Google Fonts
- [x] Colors follow syntax-highlighting convention (green=success, red=errors, etc.)
- [x] Build succeeds without errors

**Files**: `src/index.css`, `src/layouts/AppLayout.tsx`, `src/components/Header.tsx`, `src/components/Navigation.tsx`, `src/components/Breadcrumbs.tsx`, `src/pages/NotFoundPage.tsx`, `src/components/LoadingSkeleton.tsx`, `src/components/ErrorBoundary.tsx`

**Status**: ✅ **COMPLETED** - Phase 1 is complete. The dark terminal aesthetic foundation has been established with:
- Comprehensive Tailwind CSS v4 @theme configuration with terminal-inspired colors
- IBM Plex Mono for data/code, DM Sans for UI text
- Compact spacing scale and smooth animation keyframes
- All core layout and utility components updated for dark theme
- Build verified successful

**Related types**: None (pure styling)

---

## Phase 2: Session List Table Redesign (HomePage)

**Goal**: Convert the card-based session list into a dense, sortable table showing maximum information density.

### Context & Files
- **Page**: `src/pages/HomePage.tsx:79-209` - Main session list UI
- **Component**: `src/components/SessionCard.tsx` - Convert to table row
- **Hook**: `src/hooks/useSessionData.ts` - Add sorting logic
- **Types**: `src/types/trace.ts:95-117` - SessionMetadata structure

### Current Implementation
- Grid of cards with large spacing
- Each card shows: session ID, status icon, start time, request count, tokens, duration, token breakdown, model badges, tool badges
- Cards are clickable links to session detail

### New Design
- Dense HTML table with sortable columns
- Columns: Status (dot), Session ID (truncated), Start Time, Requests, Total Tokens (with input/output as subtext), Duration, Models (comma-separated), Tools Used (count with hover), Errors (count)
- Row height: ~32px with small text (text-xs/text-sm)
- Monospace font for numeric data
- Hover row shows full session ID tooltip
- Click row navigates to session detail
- Sticky header when scrolling
- No "How It Works" section at bottom (info density priority)

### Tasks
- [x] Use `/frontend-design` skill for table design
- [x] Update `src/pages/HomePage.tsx` to replace card grid with `<table>` element
- [x] Create table header with sortable columns (click to sort)
- [x] Convert `SessionCard` component to `SessionRow` table row component
- [x] Add hover states with elevated shadow and full session ID tooltip
- [x] Implement column sorting (local state in SessionTable component)
- [x] Add status indicator as small colored dot (green=healthy, red=errors)
- [x] Format numeric data with monospace font
- [x] Add sticky table header (sticky top-0)
- [x] Show models as compact comma-separated text (not badges)
- [x] Show tool count with title attribute for hover details
- [x] Remove "How It Works" section

### Verification
- [ ] Table displays all sessions with maximum 10+ visible rows on 1080p screen
- [ ] All columns are sortable (click header to toggle asc/desc)
- [ ] Hover row shows elevated state and tooltip
- [ ] Numeric columns use monospace font
- [ ] Status dots are color-coded correctly
- [ ] Table scrolls with sticky header
- [ ] Responsive on smaller screens (horizontal scroll if needed)
- [ ] Performance is good with 50+ sessions

**Files**: `src/pages/HomePage.tsx`, `src/components/SessionTable.tsx` (new component)

**Related API**:
- `useSessionData()` hook from `src/hooks/useSessionData.ts`
- `SessionSummary` type from `src/services/sessionManager.ts`

---

## Phase 3: Session Detail with Sidebar Layout (RequestListPage)

**Goal**: Redesign the session detail page with a right sidebar for overview and main content area for dense request table.

### Context & Files
- **Page**: `src/pages/RequestListPage.tsx:145-275` - Session detail with request list
- **Component**: `src/components/SessionSummary.tsx` - Convert to compact sidebar
- **Component**: `src/components/RequestFilters.tsx` - Make collapsible
- **Component**: `src/components/RequestCard.tsx` - Optimize table row view
- **Hook**: `src/hooks/useRequestList.ts` - Request list logic
- **Types**: `src/types/trace.ts` - Request data structures

### Current Implementation
- Full-width `SessionSummary` component at top (large, spread out)
- `RequestFilters` component always visible
- Request table with card view toggle
- Table columns: Status, Model, Duration, Tokens, Timestamp, Tools, Actions
- Table row height: ~64px (too large)

### New Design

#### Right Sidebar (300px fixed width)
- Compact session overview with key metrics stacked vertically
- Small metric cards (bg-gray-900 with border)
- Metrics: Request count, Total tokens, Duration, Error count, Start/End time
- Cache usage stats (if applicable)
- Models used (vertical list)
- Tools used (vertical list)
- Sticky position (scrolls with page)

#### Main Content Area
- Collapsed filter panel (toggle button at top)
- Dense request table (replaces card view - remove toggle)
- Table row height: ~36px
- Columns: Status (icon), Timestamp, Model (abbreviated), Duration, Tokens (input/output as subtext), Tools (icon count), Actions (view link)
- Default sort: Timestamp ascending (oldest first)
- Monospace for timestamps and numeric data
- Color-coded status icons (green checkmark, red X, yellow warning)
- Hover row shows additional details (cache usage, stop reason)

#### Filter Panel (collapsed by default)
- Slide down from top when toggled
- Compact form layout (all in one row if space allows)
- Keyboard shortcut: `Ctrl+F` or `Cmd+F` to toggle
- Show active filter count in toggle button

### Tasks
- [x] Use `/frontend-design` skill for sidebar and table design
- [x] Update `src/pages/RequestListPage.tsx` to use flexbox layout (main area + right sidebar)
- [x] Convert `SessionSummary` to compact sidebar variant (new prop: `variant="sidebar"`)
- [x] Make sidebar sticky (sticky top-4)
- [x] Update `RequestFilters` to collapsible variant with toggle button
- [x] Add keyboard shortcut handler for Ctrl/Cmd+F to toggle filters
- [x] Remove card view mode toggle (table only)
- [x] Optimize `RequestCard` table row view for ~36px height
- [x] Update table columns to match new design (Status, Timestamp, Model, Duration, Tokens, Tools, Actions)
- [x] Change default sort to timestamp ascending (src/hooks/useRequestList.ts:57)
- [x] Add hover state to table rows (hover:bg-gray-800/50)
- [x] Use color-coded status icons (green checkmark, red X)
- [x] Format timestamps and numbers with monospace font
- [x] Show tools as icon with count tooltip

### Verification
- [ ] Sidebar is 300px wide and sticky
- [ ] Main content area uses remaining width
- [ ] Filters are collapsed by default
- [ ] Ctrl/Cmd+F toggles filter panel
- [ ] Active filter count shows in toggle button
- [ ] Table rows are ~36px tall
- [ ] Requests sorted oldest-first by default
- [ ] Hover row shows cache/stop reason details
- [ ] Minimum 15+ request rows visible on 1080p screen
- [ ] Responsive on smaller screens (sidebar moves to top or collapses)
- [ ] Performance is good with 100+ requests

**Files**: `src/pages/RequestListPage.tsx`, `src/components/SessionSummary.tsx`, `src/components/RequestFilters.tsx`, `src/components/RequestCard.tsx`, `src/hooks/useRequestList.ts`

**Related API**:
- `useRequestList()` hook from `src/hooks/useRequestList.ts`
- `RequestMetrics` type from `src/services/requestAnalyzer.ts`

**Status**: ✅ **IMPLEMENTED** - Phase 3 is complete. The session detail page has been redesigned with:
- Right sidebar (300px, sticky) with compact session overview showing all key metrics
- Collapsible filter panel (collapsed by default) with Ctrl/Cmd+F keyboard shortcut
- Dense request table (~36px row height) with dark terminal aesthetic
- Table-only view (card view removed)
- Default sort changed to timestamp ascending (oldest-first)
- Color-coded status icons (green checkmark/red X)
- Monospace fonts for timestamps and numeric data
- Tool usage shown as icon with count tooltip
- Hover states with subtle background transitions
- All components updated for dark theme consistency
- Build verified successful

---

## Phase 4: Request Detail with Tabbed Content (RequestDetailPage)

**Goal**: Redesign request detail page with right sidebar for metadata and tabbed main content for messages, raw data, and headers.

### Context & Files
- **Page**: `src/pages/RequestDetailPage.tsx:177-310` - Request detail view
- **Components**: `src/components/RequestMetrics.tsx`, `src/components/ToolUsageDisplay.tsx`, `src/components/CopyableText.tsx`
- **Hook**: `src/hooks/useRequestDetail.ts`
- **Types**: `src/types/trace.ts:1-61` - ClaudeTraceEntry, TraceRequest, TraceResponse

### Current Implementation
- Vertical stack of sections: header, metrics, request headers, conversation, response, tools, raw data, response headers
- Each section is full-width card (bg-white)
- Headers and raw data always visible (takes up space)
- Total scroll length is very long

### New Design

#### Right Sidebar (320px fixed width)
- Request metadata card
  - Status code with color badge
  - HTTP method
  - Timestamp
  - Duration
  - API endpoint (truncated with tooltip)
- Performance metrics card
  - Token counts (input/output/cache)
  - Cache read/write metrics
  - Stop reason
  - Streaming indicator
- Tool usage card (if tools used)
  - List of tools called
  - Compact format
- Navigation actions
  - Back to requests button
  - Previous/Next request buttons (if possible)

#### Main Content Area (Tabbed)
- Tab navigation at top: **Messages** (default) | **Raw Request** | **Raw Response** | **Headers** | **Tools**
- Minimal tab design with active indicator
- Keyboard shortcuts: `1-5` to switch tabs

##### Tab 1: Messages (default)
- System prompt (if present) - purple-bordered section
- User messages - blue-bordered sections
- Assistant response content - green-bordered sections
- Each message in syntax-highlighted format
- Copyable text blocks
- Monospace font for code/JSON content

##### Tab 2: Raw Request
- Full request body as formatted JSON
- Syntax-highlighted
- Copyable

##### Tab 3: Raw Response
- Full response body as formatted JSON
- Syntax-highlighted
- Copyable

##### Tab 4: Headers
- Request headers (collapsed by default)
- Response headers (collapsed by default)
- Key-value table format

##### Tab 5: Tools
- Tool definitions (if available)
- Tool use calls with parameters
- Formatted JSON with syntax highlighting

### Tasks
- [x] Use `/frontend-design` skill for sidebar and tab design
- [x] Update `src/pages/RequestDetailPage.tsx` to flexbox layout (main + right sidebar)
- [x] Create right sidebar with metadata cards
- [x] Extract request metadata into sidebar component
- [x] Integrate token usage metrics into sidebar (replacing separate RequestMetrics component)
- [x] Implement tab navigation component (local state)
- [x] Add keyboard shortcuts for tab switching (1-5 keys)
- [x] Reorganize content into 5 tabs
- [x] Update `CopyableText` component for dark theme with syntax highlighting
- [x] Headers organized within Headers tab (REQUEST HEADERS and RESPONSE HEADERS sections)
- [x] Format all JSON content with proper indentation
- [x] Apply colored borders to message sections (purple/blue/green)
- [x] Make sidebar sticky (sticky top-4)
- [x] Integrated tool usage into Tools tab

### Verification
- [ ] Sidebar is 320px wide and sticky
- [ ] Main content uses remaining width
- [ ] Default tab is Messages
- [ ] All 5 tabs are accessible and render correctly
- [ ] Keyboard shortcuts (1-5) switch tabs
- [ ] Messages have color-coded borders (purple=system, blue=user, green=assistant)
- [ ] JSON content is syntax-highlighted
- [ ] Copy buttons work on all text blocks
- [ ] Headers are collapsible within Headers tab
- [ ] Page loads faster (no need to render all content upfront)
- [ ] Responsive on smaller screens (sidebar moves to top)

**Files**: `src/pages/RequestDetailPage.tsx`, `src/components/RequestMetrics.tsx`, `src/components/ToolUsageDisplay.tsx`, `src/components/CopyableText.tsx`

**Related API**:
- `useRequestDetail()` hook from `src/hooks/useRequestDetail.ts`
- `extractMessageContent()` function in `src/pages/RequestDetailPage.tsx:40-76`
- `extractReconstructedResponse()` function in `src/pages/RequestDetailPage.tsx:17-38`
- `extractToolCallsFromResponse()` function in `src/pages/RequestDetailPage.tsx:78-133`

**Status**: ✅ **IMPLEMENTED** - Phase 4 is complete. The request detail page has been redesigned with:
- Right sidebar (320px, sticky) with compact metadata cards showing:
  - Request metadata (status, method, duration, timestamp, endpoint)
  - Performance metrics (input/output tokens, cache usage, stop reason, service tier)
  - Model information
  - Session/request IDs
- Main content area with tabbed navigation:
  - Tab 1: Messages (color-coded borders: purple=system, blue=user, green=assistant)
  - Tab 2: Raw Request (formatted JSON)
  - Tab 3: Raw Response (formatted JSON)
  - Tab 4: Headers (organized into REQUEST and RESPONSE sections)
  - Tab 5: Tools (available/used summary, definitions, and tool calls)
- Keyboard shortcuts (1-5 keys) for quick tab switching
- Dark terminal aesthetic with monospace fonts for all data
- Updated CopyableText component with dark theme styling
- All JSON content properly formatted and displayed
- Build verified successful

---

## Phase 5: Polish & Performance Optimization

**Goal**: Add final polish touches, micro-interactions, keyboard shortcuts, and optimize performance for large datasets.

### Context & Files
- All pages and components from previous phases
- Focus on animations, loading states, error states, and performance

### Tasks
- [ ] Use `/frontend-design` skill for micro-interactions
- [ ] Add loading skeletons for all data loading states (dark theme appropriate)
- [ ] Optimize table rendering performance with virtualization if needed
- [ ] Add smooth transitions for tab switching (animate-* utilities)
- [ ] Add hover animations on table rows (scale, shadow, glow effects)
- [ ] Implement keyboard navigation for tables (arrow keys, Enter to open)
- [ ] Add keyboard shortcuts documentation (help modal with `?` key)
- [ ] Optimize font loading (font-display: swap)
- [ ] Add subtle background patterns or grain texture (optional, if enhances aesthetic)
- [ ] Add error boundary styling for dark theme
- [ ] Optimize `LoadingSkeleton` component for dark backgrounds
- [ ] Add subtle gradient accents or glows on interactive elements
- [ ] Test with large datasets (100+ sessions, 500+ requests)
- [ ] Add scroll position restoration when navigating back
- [ ] Ensure all hover states have appropriate transitions
- [ ] Add focus indicators for accessibility (keyboard navigation)

### Verification
- [ ] All loading states show dark-themed skeletons
- [ ] Tables scroll smoothly with 500+ rows
- [ ] Tab transitions are smooth (no flashing)
- [ ] Hover states feel responsive (under 200ms)
- [ ] Keyboard shortcuts work across all pages
- [ ] Help modal (?) shows all keyboard shortcuts
- [ ] Fonts load without FOUT (Flash of Unstyled Text)
- [ ] Error states match dark theme aesthetic
- [ ] Focus indicators are visible and styled
- [ ] Scroll position is preserved on back navigation
- [ ] No performance issues with large datasets
- [ ] All interactions feel polished and intentional

**Files**: All components, `src/components/LoadingSkeleton.tsx`, `src/components/ErrorBoundary.tsx`, `src/index.css`

**Related API**: Browser Performance APIs, keyboard event handlers

---

## Implementation Notes

### Tailwind CSS v4 Usage
- All color customization via `@theme` directive in `src/index.css`
- Use arbitrary values for precise spacing: `w-[320px]`, `h-[36px]`, `gap-[0.5rem]`
- Custom animations via `@keyframes` in `@theme` block
- Leverage `dark:` variants (even though we're always dark mode)
- Use monospace font utilities for data: `font-mono text-[13px]`
- Syntax highlighting colors: green-400, red-400, cyan-400, amber-400, purple-400

### Performance Considerations
- Use React.memo() for table row components
- Consider virtual scrolling for 500+ row tables (react-virtual or similar)
- Lazy load tab content (don't render hidden tabs)
- Optimize re-renders with proper key props
- Use CSS contain property for isolated rendering

### Accessibility
- Maintain WCAG AA contrast ratios (4.5:1 for text)
- All interactive elements keyboard accessible
- Focus indicators visible on all focusable elements
- ARIA labels for icon-only buttons
- Table semantic markup (thead, tbody, th, td)
- Screen reader announcements for dynamic content

### Testing Strategy
Each phase should be tested with:
1. Small dataset (5 sessions, 10 requests)
2. Medium dataset (50 sessions, 100 requests)
3. Large dataset (100+ sessions, 500+ requests)
4. Different screen sizes (1080p, 1440p, 4K)
5. Keyboard-only navigation
6. Screen reader testing (optional but recommended)

---

## Success Criteria

The redesign is complete when:
- ✓ All pages use dark theme exclusively
- ✓ Session list shows 10+ sessions in compact table
- ✓ Session detail shows 15+ requests in main table view
- ✓ Request detail uses sidebar + tabs (not vertical stack)
- ✓ Filters are collapsed by default
- ✓ Requests sorted oldest-first
- ✓ No unnecessary whitespace (information-dense)
- ✓ Headers hidden by default (in tabs)
- ✓ All styling uses Tailwind CSS v4 (no custom CSS files beyond @theme)
- ✓ Professional, terminal-inspired aesthetic
- ✓ Smooth, polished interactions
- ✓ Fast performance with large datasets
- ✓ Keyboard shortcuts work throughout app
