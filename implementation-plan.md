# CC Trace Viewer Implementation Plan

## Project Overview

The CC Trace Viewer is a React-based web application for visualizing and analyzing Claude API trace logs from `.claude-trace` directories. The app enables developers to understand their Claude API usage patterns, debug requests, and analyze performance metrics.

**Current Status:** UI foundation complete (Phases 1-5). Ready to implement core data functionality.

**Technology Stack:** React 19 + TypeScript + Vite + React Router 7 + Tailwind CSS 4

**Selected Architecture:**
- **File Access:** File System Access API (Chromium browsers only)
- **Data Strategy:** Lazy load sessions on demand (lower memory usage)
- **Response Display:** Show final reconstructed responses in structured format

## Phase Implementation Plan

### Phase 6: File System Integration & Data Models ✅
**Goal:** Enable directory selection and establish core data structures for trace parsing.

**Context & Files:**
- Current HomePage (`/src/pages/HomePage.tsx`) has placeholder content
- Router structure already supports `/sessions/:sessionId/requests` pattern
- Need to integrate with File System Access API for `.claude-trace` directory selection

**Key Requirements:**
- [x] Create TypeScript interfaces based on analyzed JSONL structure
- [x] Implement File System Access API for directory selection
- [x] Build JSONL parsing utilities with streaming support
- [x] Add session discovery and metadata extraction from filenames
- [x] Create React hooks for directory management

**Files Created/Modified:**
- `/src/types/trace.ts` - Core data interfaces (ClaudeTraceEntry, SessionData, etc.) ✅
- `/src/services/fileSystem.ts` - Directory access and file reading logic ✅
- `/src/services/traceParser.ts` - JSONL parsing utilities ✅
- `/src/hooks/useFileSystem.ts` - React hooks for directory state management ✅
- `/src/pages/HomePage.tsx` - Add directory picker UI ✅

**Verification Steps:**
- [x] TypeScript compilation passes without errors
- [x] File System Access API works in Chrome/Edge
- [x] Successfully parses sample .jsonl files from `.claude-trace` directory
- [x] Directory picker UI functional and responsive
- [x] Session metadata extracted correctly from filenames

**Implementation Notes:**
- File System Access API requires Chromium-based browsers (Chrome, Edge)
- Browser support detection implemented with fallback UI for unsupported browsers
- Session metadata extracted from user_id patterns and JSONL content analysis
- Streaming support added for large trace files
- TypeScript interfaces follow the analyzed JSONL structure from data analysis

---

### Phase 7: Session Management & Navigation ⏳
**Goal:** Implement session listing with lazy loading and navigation to session details.

**Context & Files:**
- Router configured for `/sessions/:sessionId/requests` route
- RequestListPage (`/src/pages/RequestListPage.tsx`) currently shows mock data
- Need to display real session metadata and support navigation

**Key Requirements:**
- [ ] Update HomePage with session directory selection and session listing
- [ ] Implement session listing with metadata (token counts, duration, request count)
- [ ] Add lazy loading pattern for session data (load metadata first, details on demand)
- [ ] Update routing to handle real session IDs extracted from JSONL filenames
- [ ] Create session preview cards with key metrics

**Files to Create/Modify:**
- `/src/services/sessionManager.ts` - Session data management and caching
- `/src/components/SessionCard.tsx` - Individual session preview components
- `/src/components/DirectoryPicker.tsx` - Directory selection component
- `/src/pages/HomePage.tsx` - Integrate session listing after directory selection
- `/src/hooks/useSessionData.ts` - React hooks for session management

**Verification Steps:**
- [ ] Directory selection persists between page reloads
- [ ] Session list displays correctly with real metadata
- [ ] Navigation to session detail page works with real session IDs
- [ ] Session cards show accurate token counts and duration
- [ ] Loading states work correctly during session discovery

---

### Phase 8: Request List Implementation ⏳
**Goal:** Parse and display individual requests within sessions with filtering and metrics.

**Context & Files:**
- RequestListPage (`/src/pages/RequestListPage.tsx`) needs real data integration
- Current implementation shows mock table data
- Need to parse JSONL entries and extract request metrics

**Key Requirements:**
- [ ] Parse individual JSONL entries to extract request data
- [ ] Display requests with key metrics (tokens, duration, model, tools used)
- [ ] Add filtering capabilities (by model, tool usage, date range)
- [ ] Implement sorting (by timestamp, duration, token usage)
- [ ] Show conversation flow reconstruction within sessions
- [ ] Add request status indicators (success, error, streaming)

**Files to Create/Modify:**
- `/src/pages/RequestListPage.tsx` - Replace mock data with real parsed data
- `/src/components/RequestCard.tsx` - Individual request preview components
- `/src/components/SessionSummary.tsx` - Session-level metrics display
- `/src/components/RequestFilters.tsx` - Filtering and sorting controls
- `/src/services/requestAnalyzer.ts` - Request metrics calculation utilities
- `/src/hooks/useRequestList.ts` - React hooks for request data management

**Verification Steps:**
- [ ] All requests within session display correctly
- [ ] Request metrics calculate accurately (duration, token counts)
- [ ] Filtering and sorting functions work properly
- [ ] Navigation to individual request details functional
- [ ] Session summary shows aggregated metrics correctly

---

### Phase 9: Request Detail View ⏳
**Goal:** Implement detailed request/response viewing with structured data display and copy functionality.

**Context & Files:**
- RequestDetailPage (`/src/pages/RequestDetailPage.tsx`) currently shows mock structured data
- Need to parse streaming responses from `body_raw` field
- Must handle both regular and streaming response formats

**Key Requirements:**
- [ ] Parse streaming responses from SSE format in `body_raw`
- [ ] Display structured request data (headers, body, tools, messages)
- [ ] Show reconstructed final response in readable format
- [ ] Add copyable text blocks for system prompts, user messages, and responses
- [ ] Display performance metrics (request duration, token usage breakdown)
- [ ] Show rate limiting information and API metadata
- [ ] Handle tool usage display and tool call/response pairs

**Files to Create/Modify:**
- `/src/pages/RequestDetailPage.tsx` - Complete implementation with real data
- `/src/components/CopyableText.tsx` - Copyable text blocks with copy-to-clipboard
- `/src/components/StreamingResponse.tsx` - SSE parsing and response reconstruction
- `/src/components/RequestMetrics.tsx` - Performance and usage metrics display
- `/src/components/ToolUsageDisplay.tsx` - Tool call visualization
- `/src/services/responseParser.ts` - SSE parsing utilities and response reconstruction
- `/src/utils/formatters.ts` - Data formatting utilities for display

**Verification Steps:**
- [ ] Streaming responses parse and display correctly
- [ ] All request/response data visible in structured format
- [ ] Copy functionality works for long text blocks
- [ ] Performance metrics display accurately
- [ ] Tool usage visualization shows tool calls and responses
- [ ] Navigation breadcrumbs work correctly

---

### Phase 10: Polish & Performance ⏳
**Goal:** Add advanced features, performance optimizations, and production-ready polish.

**Context & Files:**
- All core functionality implemented in previous phases
- Focus on user experience improvements and performance optimization
- Add advanced features like search and export

**Key Requirements:**
- [ ] Add comprehensive loading states and error handling throughout app
- [ ] Implement global search across all sessions and requests
- [ ] Add export functionality for individual requests (JSON, text formats)
- [ ] Performance optimizations for large trace files (virtualization, pagination)
- [ ] Add keyboard shortcuts for common actions
- [ ] Implement dark/light theme support
- [ ] Add session comparison features
- [ ] Create help/documentation overlay

**Files to Create/Modify:**
- `/src/components/GlobalSearch.tsx` - Search across sessions and requests
- `/src/components/ExportDialog.tsx` - Export functionality
- `/src/components/LoadingStates.tsx` - Comprehensive loading components
- `/src/components/ErrorBoundary.tsx` - Enhanced error handling (already exists, enhance)
- `/src/services/searchEngine.ts` - Search indexing and query utilities
- `/src/services/exportService.ts` - Data export utilities
- `/src/hooks/useVirtualization.ts` - Performance optimizations for large lists
- `/src/contexts/ThemeContext.tsx` - Theme management
- `/src/components/HelpOverlay.tsx` - User guidance and documentation

**Verification Steps:**
- [ ] App handles large trace files (>100MB) without performance issues
- [ ] Global search returns accurate results quickly
- [ ] Export functionality works for various formats
- [ ] All error states handled gracefully with user-friendly messages
- [ ] Loading states provide clear feedback during operations
- [ ] App works consistently across different Chromium browsers
- [ ] Keyboard shortcuts functional and documented
- [ ] Theme switching works throughout entire app

---

## Data Model Reference

### Core TypeScript Interfaces

```typescript
// Core trace entry from JSONL files
export interface ClaudeTraceEntry {
  request: TraceRequest;
  response: TraceResponse;
  logged_at: string;
}

export interface TraceRequest {
  timestamp: number;
  method: "POST";
  url: string;
  headers: Record<string, string>;
  body: {
    model: string;
    max_tokens: number;
    messages: Array<{
      role: "user" | "assistant";
      content: string | Array<{type: string; [key: string]: any}>;
    }>;
    system?: Array<{
      type: "text";
      text: string;
      cache_control?: {type: "ephemeral"};
    }>;
    temperature?: number;
    metadata: {user_id: string};
    stream?: boolean;
    tools?: Array<{
      name: string;
      description: string;
      input_schema: any;
    }>;
  };
}

export interface TraceResponse {
  timestamp: number;
  status_code: number;
  headers: Record<string, string>;
  body?: {
    model: string;
    id: string;
    type: "message";
    role: "assistant";
    content: Array<{type: string; text?: string; [key: string]: any}>;
    stop_reason: string | null;
    usage: TokenUsage;
  };
  body_raw?: string; // SSE format for streaming responses
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cache_creation: {
    ephemeral_5m_input_tokens: number;
    ephemeral_1h_input_tokens: number;
  };
  service_tier: string;
}

// Processed session data
export interface SessionData {
  sessionId: string;
  userId: string;
  filename: string;
  requests: ClaudeTraceEntry[];
  totalTokensUsed: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  duration: number; // milliseconds
  startTime: number;
  endTime: number;
  modelsUsed: string[];
  toolsUsed: string[];
  hasErrors: boolean;
}
```

### Key Implementation Notes

1. **Session ID Extraction:** Extract from user_id metadata field: `user_[hash]_account_[uuid]_session_[uuid]`

2. **File Naming Pattern:** `.claude-trace/log-YYYY-MM-DD-HH-mm-ss.jsonl`

3. **Streaming Response Parsing:** Parse `body_raw` field containing SSE events to reconstruct final response

4. **Token Cost Calculation:** Based on model pricing and token usage from response.body.usage

5. **Performance Considerations:** Use lazy loading, virtualization for large files, and efficient JSON parsing

6. **Error Handling:** Handle malformed JSONL, file access errors, and API response errors gracefully

## Success Criteria

- [ ] Successfully loads and displays `.claude-trace` directories
- [ ] Shows session list with accurate metadata and metrics
- [ ] Displays individual requests with full context and formatting
- [ ] Provides copy functionality for all text content
- [ ] Handles large trace files (>50MB) with good performance
- [ ] Works reliably in Chrome, Edge, and other Chromium browsers
- [ ] Provides intuitive navigation and search capabilities
- [ ] Includes comprehensive error handling and loading states