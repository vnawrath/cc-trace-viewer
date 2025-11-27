# Implementation Plan: CC Trace Viewer Redesign

## Overview

This plan transforms the CC Trace Viewer from a light-mode, card-based interface into a professional, information-dense, dark-mode terminal-style application for power users. The core design principle is **"Whitespace is the enemy"** - maximizing information density while maintaining clarity and usability.

**Design Direction**: "Terminal Modernism" - inspired by Bloomberg Terminal, advanced dev tools, and professional monitoring platforms.

### Key Design Decisions

- **Color Scheme**: Slate dark (`#0f172a` base) with high-contrast amber/cyan accents
- **Typography**: JetBrains Mono for data, Inter Tight for headers, Inter for body
- **Layout**: Right sidebars for metadata, main content left-anchored
- **Filters**: Compact inline toolbar with filter chips (not collapsible panels)
- **Tables**: Ultra-dense rows, sharp borders, terminal-style aesthetics
- **Tabs**: Horizontal tabs for secondary data views

### Technical Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 (exclusively)
- **Router**: React Router 7
- **Current Structure**: src/pages/, src/components/, src/services/

---

## Phase 1: Dark Mode Foundation & Design System

**Goal**: Establish the dark mode color system, typography, and base component styles that will be used throughout the application.

### Context & Files

- **Main CSS**: `src/index.css` or Tailwind config
- **Color References**:
  - Base: `#0f172a` (slate-900)
  - Surface: `#1e293b` (slate-800)
  - Borders: `#334155` (slate-700)
  - Text primary: `#f1f5f9` (slate-100)
  - Text secondary: `#94a3b8` (slate-400)
  - Accent amber: `#fbbf24` (amber-400)
  - Accent cyan: `#22d3ee` (cyan-400)
  - Error red: `#f87171` (red-400)
  - Link blue: `#60a5fa` (blue-400)

### Implementation Steps

- [ ] **IMPORTANT**: Use `/frontend-design` skill before starting implementation
- [ ] Update root layout/body background to slate-900 (`#0f172a`)
- [ ] Configure Tailwind theme with custom colors (if needed beyond default slate)
- [ ] Add JetBrains Mono font (via CDN or local)
- [ ] Add Inter Tight font (via CDN or local)
- [ ] Create base typography classes:
  - `.font-mono` for JetBrains Mono (IDs, timestamps, metrics)
  - `.font-tight` for Inter Tight (headers)
  - `.font-sans` for Inter (body text)
- [ ] Update global styles:
  - Remove rounded corners (sharp terminal aesthetic)
  - Set default text colors (slate-100 primary, slate-400 secondary)
  - Configure scrollbar styling for dark theme
- [ ] Create reusable utility classes for:
  - Status indicators (small colored squares)
  - Terminal-style borders
  - Compact spacing scales

### Testing & Verification

- [ ] Application background is dark slate (`#0f172a`)
- [ ] All text is readable with proper contrast ratios
- [ ] Fonts load correctly (JetBrains Mono, Inter Tight, Inter)
- [ ] No light-mode artifacts remain
- [ ] Scrollbars match dark theme
- [ ] Typography hierarchy is clear and distinct

**Files Modified**: `src/index.css`, `tailwind.config.js` (if exists), `index.html` (for font links)

---

## Phase 2: HomePage - Session List Table Redesign

**Goal**: Convert the session list from cards to a dense, terminal-style table showing session names and key metrics in compact rows.

### Context & Files

- **Main Component**: `src/pages/HomePage.tsx` (lines 79-209)
- **Session Card Component**: `src/components/SessionCard.tsx` (entire file)
- **Data Structure**: `SessionSummary` type from `src/services/sessionManager.ts`
  - Fields: sessionId, metadata (requestCount, totalTokens, duration, etc.)
- **Current Implementation**: Grid of SessionCard components with badges and metrics

### Implementation Steps

- [ ] **IMPORTANT**: Use `/frontend-design` skill before starting implementation
- [ ] Create new SessionTable component or modify HomePage to render table
- [ ] Table structure:
  - Column headers: Status, Session ID, Requests, Tokens (Input/Output), Duration, Models, Tools, File
  - Status: Small colored square (green=healthy, red=errors)
  - Session ID: Monospace, truncated with hover tooltip
  - Tokens: Show input/output in compact format (e.g., "12.5K / 3.2K")
  - Duration: Formatted time in monospace
  - Models: Compact badges (amber-100/amber-700)
  - Tools: Show count with tooltip on hover
- [ ] Ultra-compact row styling:
  - `py-2` padding (not py-4 or py-6)
  - Zebra striping: alternate slate-800/slate-900
  - Hover state: amber left border indicator (`border-l-2 border-amber-400`)
  - Sharp borders (no rounded corners)
- [ ] Fixed header with backdrop blur
- [ ] Each row is clickable link to session detail
- [ ] Remove all card-based styling
- [ ] Update loading skeleton to table format
- [ ] Remove "How It Works" section or make it ultra-compact

### Testing & Verification

- [ ] Sessions display in dense table format
- [ ] All metrics visible without horizontal scroll on desktop (1920px)
- [ ] Status indicators are small colored squares
- [ ] Hover states show amber left border
- [ ] Zebra striping is subtle and clear
- [ ] Click on any row navigates to session detail
- [ ] Table header is fixed on scroll
- [ ] Loading state shows table skeleton
- [ ] Monospace fonts used for IDs, numbers, timestamps
- [ ] No unnecessary whitespace between elements

**Files Modified**: `src/pages/HomePage.tsx`, `src/components/SessionCard.tsx` (may be deleted or repurposed)

---

## Phase 3: RequestListPage - Layout Restructure with Sidebar & Inline Filters

**Goal**: Restructure the request list page with a right sidebar for session overview, main table of requests, and compact inline filter toolbar. Sort requests oldest-first by default.

### Context & Files

- **Main Component**: `src/pages/RequestListPage.tsx` (lines 145-275)
- **Session Summary**: `src/components/SessionSummary.tsx` (lines 50-198)
- **Request Filters**: `src/components/RequestFilters.tsx` (entire file)
- **Request Card**: `src/components/RequestCard.tsx` (lines 149-214 for table view)
- **Hook**: `src/hooks/useRequestList.ts`
- **Data**: `filteredRequests` array of `RequestMetrics` type

### Implementation Steps

- [ ] **IMPORTANT**: Use `/frontend-design` skill before starting implementation
- [ ] Create two-column layout:
  - Main content: `flex-1` (left side)
  - Right sidebar: `w-80` (320px fixed width)
- [ ] **Right Sidebar**:
  - Move SessionSummary component here
  - Make it sticky (`sticky top-0`)
  - Compact styling with slate-800 background
  - Reduce padding and spacing
  - Keep all metrics but make them denser
- [ ] **Main Content Area**:
  - Remove view mode toggle (table only)
  - Create compact inline filter toolbar (60px height):
    - Dropdowns for: Model, Status, Type (streaming/non-streaming)
    - Range inputs for: Duration, Tokens
    - Tools checkboxes in dropdown menu
    - Sort selector as dropdown
  - Show active filters as dismissible chips below toolbar
  - "Clear all filters" button when filters active
- [ ] **Request Table**:
  - Remove card view completely
  - Use existing table structure from RequestCard component
  - Columns: Status, Model, Duration, Tokens (In/Out/Total), Timestamp, Tools, Actions
  - Ultra-compact rows: `py-2` padding
  - Zebra striping: slate-800/slate-900
  - Hover: amber left border
  - Monospace for all numeric data
  - Status as small colored square
- [ ] **Default Sort**: Change to timestamp ascending (oldest first)
- [ ] Update RequestFilters component:
  - Convert from large panel to compact toolbar
  - Dropdowns instead of expanded checkbox lists
  - Keep functionality but reduce visual footprint
  - Remove "Advanced Filters" toggle - show all in compact format

### Testing & Verification

- [ ] Page has clear two-column layout
- [ ] Right sidebar is 320px wide and sticky
- [ ] SessionSummary fits in sidebar with all metrics visible
- [ ] Filter toolbar is ~60px tall and always visible
- [ ] All filter controls accessible without scrolling filter bar
- [ ] Active filters show as chips with X to dismiss
- [ ] Requests display in table format only
- [ ] Default sort is timestamp ascending (oldest on top)
- [ ] Table is ultra-dense with minimal padding
- [ ] Hover states work with amber left border
- [ ] No horizontal scroll required on 1920px display
- [ ] Clicking request row navigates to detail page

**Files Modified**: `src/pages/RequestListPage.tsx`, `src/components/SessionSummary.tsx`, `src/components/RequestFilters.tsx`, `src/components/RequestCard.tsx`, possibly `src/hooks/useRequestList.ts`

---

## Phase 4: RequestDetailPage - Sidebar Layout with Tabs

**Goal**: Restructure request detail page with right sidebar for metadata and horizontal tabs for secondary data (raw request/response, tools, headers).

### Context & Files

- **Main Component**: `src/pages/RequestDetailPage.tsx` (lines 177-309)
- **Sub-components**:
  - `src/components/RequestMetrics.tsx`
  - `src/components/ToolUsageDisplay.tsx`
  - `src/components/CopyableText.tsx`
- **Data**: `request` object of type `ClaudeTraceEntry` (from `src/types/trace.ts`)
  - Fields: request (url, headers, body, timestamp), response (status_code, headers, body)

### Implementation Steps

- [ ] **IMPORTANT**: Use `/frontend-design` skill before starting implementation
- [ ] Create two-column layout:
  - Main content: `flex-1` (left side, ~70%)
  - Right sidebar: `w-96` (384px fixed width, ~30%)
- [ ] **Right Sidebar (Sticky)**:
  - Request Overview section:
    - Method badge (POST)
    - Status code badge with color
    - Duration
    - Timestamp (monospace)
    - API endpoint URL
  - Request Metrics (from RequestMetrics component)
  - Compact layout with slate-800 background
  - Sticky positioning
- [ ] **Main Content Area**:
  - Header: Page title and back button
  - Conversation Messages section:
    - System prompt (purple accent)
    - User messages (blue accent)
    - Assistant messages (green accent)
    - Use CopyableText component
    - Compact styling, minimal padding
  - Assistant Response section:
    - Reconstructed response
    - Use CopyableText with JSON formatting
- [ ] **Horizontal Tabs** (below main conversation area):
  - Tab buttons: Raw Request, Raw Response, Request Headers, Response Headers, Tool Definitions
  - Terminal-style tabs (sharp corners, amber active state)
  - Tab content area shows selected data:
    - Raw Request: Full request body JSON
    - Raw Response: Full response body JSON
    - Request Headers: Key-value list (currently in main view)
    - Response Headers: Key-value list (currently in main view)
    - Tool Definitions: ToolUsageDisplay component content
  - Compact tab styling with slate-700 borders
- [ ] Remove from main view:
  - Request Headers section (move to tab)
  - Response Headers section (move to tab)
  - Raw Request Data section (move to tab)
  - Current separate sections for tools (consolidate to tab)
- [ ] Keep CopyableText functionality for all data sections

### Testing & Verification

- [ ] Page has clear two-column layout (70/30 split)
- [ ] Right sidebar is 384px wide and sticky
- [ ] All request metadata visible in sidebar without scroll
- [ ] RequestMetrics displays compactly in sidebar
- [ ] Main area shows conversation messages prominently
- [ ] Conversation messages have clear role distinction (colors)
- [ ] Horizontal tabs display below conversation
- [ ] Clicking tab switches content area below
- [ ] All tabs work: Raw Request, Raw Response, Headers (both), Tools
- [ ] Headers no longer clutter main view
- [ ] Active tab has amber accent styling
- [ ] CopyableText works in all tab sections
- [ ] No content is lost from original page
- [ ] Layout doesn't break on smaller screens (minimum 1440px)

**Files Modified**: `src/pages/RequestDetailPage.tsx`, possibly `src/components/RequestMetrics.tsx` for compact styling

---

## General Guidelines for All Phases

### Before Starting Each Phase

1. **ALWAYS** run `/frontend-design` skill with the specific phase context
2. Review the design recommendations and ensure alignment
3. Create any needed shared components first

### Tailwind Best Practices

- Use utility classes exclusively (no custom CSS unless absolutely necessary)
- Leverage Tailwind's slate color palette (slate-900, slate-800, etc.)
- Use spacing scale consistently (p-2, p-3, p-4 for padding; m-2, m-3, m-4 for margin)
- Utilize responsive breakpoints: `md:`, `lg:`, `xl:`
- Use `font-mono` for monospace, `font-tight` for condensed headers
- Apply `hover:` states for interactivity
- Use `sticky` for fixed sidebars and headers
- Leverage `border-l-2` for left border indicators
- Apply `backdrop-blur-sm` for layered elements

### Testing Checklist for All Phases

- [ ] Dark mode colors applied correctly
- [ ] Typography (JetBrains Mono, Inter Tight, Inter) renders properly
- [ ] No light-mode styling remains
- [ ] Information density is high (minimal padding/margins)
- [ ] Sharp corners (no unnecessary border-radius)
- [ ] Hover states work with amber/cyan accents
- [ ] Monospace fonts used for IDs, timestamps, metrics
- [ ] No horizontal scroll on 1920px display
- [ ] All functionality from original component preserved
- [ ] Loading states maintain dark theme
- [ ] Error states match terminal aesthetic
- [ ] Accessibility: proper contrast ratios, keyboard navigation

---

## Success Criteria

The redesign is complete when:

1. ✅ Entire application uses dark slate theme consistently
2. ✅ All pages are information-dense with minimal whitespace
3. ✅ Typography uses JetBrains Mono, Inter Tight, Inter appropriately
4. ✅ HomePage shows sessions in compact table format
5. ✅ RequestListPage has right sidebar and inline filters
6. ✅ RequestDetailPage has right sidebar and horizontal tabs
7. ✅ All interactions use terminal-style aesthetics (sharp borders, amber/cyan accents)
8. ✅ No generic "AI slop" styling remains
9. ✅ Application feels purpose-built for professional trace analysis
10. ✅ All existing functionality is preserved

---

## Phase Dependencies

- **Phase 1** must be completed first (foundation for all other phases)
- **Phases 2, 3, 4** can be done in order or the order can be adjusted based on priority
- Each phase is independently testable and deliverable

---

## Estimated Effort per Phase

- **Phase 1**: 1-2 hours (setup and configuration)
- **Phase 2**: 2-3 hours (table conversion and styling)
- **Phase 3**: 3-4 hours (complex layout restructure with sidebar and filters)
- **Phase 4**: 2-3 hours (sidebar and tabs implementation)

**Total Estimated Time**: 8-12 hours
