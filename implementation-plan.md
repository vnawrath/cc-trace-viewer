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

### Phase 6.1: Streaming Response Token Extraction ✅
**Goal:** Extract token usage from streaming responses stored in `body_raw` field to get complete token counts.

**Context & Problem:**
- Current token counting only works for non-streaming responses with `response.body.usage`
- Streaming responses store raw SSE data in `response.body_raw` field
- The majority of Claude API calls use streaming, so most token usage is currently missing
- Need to parse SSE events and extract token usage from final message events

**Key Requirements:**
- [x] Analyze example `body_raw` content from existing `.claude-trace` files to understand SSE format
- [x] Extract sample raw streaming responses for testing
- [x] Enhance `reconstructResponseFromStream()` to extract token usage data
- [x] Update token calculation logic to use reconstructed usage for streaming responses
- [x] Ensure non-streaming responses continue to work as before
- [x] Add debug logging to verify streaming token extraction works

**Files Created/Modified:**
- `/src/services/traceParser.ts` - Updated `calculateSessionMetadata()` to handle streaming responses ✅
- `/src/services/traceParser.ts` - Enhanced `reconstructResponseFromStream()` to extract usage data ✅
- Sample streaming response analysis completed ✅

**Verification Steps:**
- [x] Sample `body_raw` content analyzed and SSE format understood
- [x] Token usage correctly extracted from streaming responses
- [x] Session token totals include both streaming and non-streaming requests
- [x] Debug logs show proper token extraction from both response types
- [x] TypeScript compilation passes without errors

**Implementation Notes:**
- SSE format analysis revealed token usage data is available in `message_start` and `message_delta` events
- Token usage structure in streaming responses matches existing `TokenUsage` interface
- Enhanced `reconstructResponseFromStream()` to extract usage from `message_delta` event with final counts
- Updated `calculateSessionMetadata()` to check both `response.body.usage` and reconstructed usage from streaming
- Added debug logging to track token extraction success/failure for monitoring
- All existing non-streaming responses continue to work unchanged

**Expected Impact:**
This dramatically increases the accuracy of token counts since streaming responses are the majority of Claude API calls.

---

### Phase 7: Session Management & Navigation ✅
**Goal:** Implement session listing with lazy loading and navigation to session details.

**Context & Files:**
- Router configured for `/sessions/:sessionId/requests` route
- RequestListPage (`/src/pages/RequestListPage.tsx`) currently shows mock data
- Need to display real session metadata and support navigation

**Key Requirements:**
- [x] Update HomePage with session directory selection and session listing
- [x] Implement session listing with metadata (token counts, duration, request count)
- [x] Add lazy loading pattern for session data (load metadata first, details on demand)
- [x] Update routing to handle real session IDs extracted from JSONL filenames
- [x] Create session preview cards with key metrics

**Files Created/Modified:**
- `/src/services/sessionManager.ts` - Session data management and caching ✅
- `/src/components/SessionCard.tsx` - Individual session preview components ✅
- `/src/components/DirectoryPicker.tsx` - Directory selection component ✅
- `/src/pages/HomePage.tsx` - Integrate session listing after directory selection ✅
- `/src/hooks/useSessionData.ts` - React hooks for session management ✅

**Verification Steps:**
- [x] Directory selection works with File System Access API validation
- [x] Session list displays correctly with real metadata
- [x] Navigation to session detail page works with real session IDs
- [x] Session cards show accurate token counts and duration
- [x] Loading states work correctly during session discovery
- [x] TypeScript compilation passes without errors
- [x] Build process succeeds
- [x] Development server starts successfully

**Implementation Notes:**
- Created SessionManagerService with caching and lazy loading for performance
- DirectoryPicker component validates .claude-trace directories and provides user feedback
- SessionCard component displays comprehensive session metrics with proper formatting
- useSessionData hook manages state for directory selection and session discovery
- HomePage fully updated to use new components with loading states and error handling
- Browser support detection with fallback UI for unsupported browsers
- Session IDs extracted from log filename timestamps for consistent routing
- Implemented skeleton loading states for better user experience during discovery

**Expected Impact:**
Phase 7 provides a complete session management interface with lazy loading, allowing users to browse their Claude API sessions efficiently with rich metadata display.

---

### Phase 8: Request List Implementation ✅
**Goal:** Parse and display individual requests within sessions with filtering and metrics.

**Context & Files:**
- RequestListPage (`/src/pages/RequestListPage.tsx`) needs real data integration
- Current implementation shows mock table data
- Need to parse JSONL entries and extract request metrics

**Key Requirements:**
- [x] Parse individual JSONL entries to extract request data
- [x] Display requests with key metrics (tokens, duration, model, tools used)
- [x] Add filtering capabilities (by model, tool usage, date range)
- [x] Implement sorting (by timestamp, duration, token usage)
- [x] Show conversation flow reconstruction within sessions
- [x] Add request status indicators (success, error, streaming)

**Files Created/Modified:**
- `/src/pages/RequestListPage.tsx` - Replaced mock data with real parsed data integration ✅
- `/src/components/RequestCard.tsx` - Individual request preview components with dual view modes ✅
- `/src/components/SessionSummary.tsx` - Session-level metrics display with comprehensive stats ✅
- `/src/components/RequestFilters.tsx` - Filtering and sorting controls with advanced options ✅
- `/src/services/requestAnalyzer.ts` - Request metrics calculation utilities with full analytics ✅
- `/src/hooks/useRequestList.ts` - React hooks for request data management with caching ✅

**Verification Steps:**
- [x] All requests within session display correctly
- [x] Request metrics calculate accurately (duration, token counts)
- [x] Filtering and sorting functions work properly
- [x] Navigation to individual request details functional
- [x] Session summary shows aggregated metrics correctly
- [x] TypeScript compilation passes without errors
- [x] Build process succeeds
- [x] Both table and card view modes implemented
- [x] Advanced filtering with token ranges and duration filters
- [x] Comprehensive session overview with cache usage statistics

**Implementation Notes:**
- Created comprehensive RequestAnalyzerService for extracting and analyzing request metrics
- Implemented dual view modes (table and card) for better user experience
- Added advanced filtering capabilities including model, tool, status, and range filters
- Built sophisticated sorting system supporting multiple fields and directions
- Created SessionSummary component showing detailed session analytics including cache usage
- RequestCard component supports both compact table rows and detailed card views
- useRequestList hook provides complete state management with lazy loading and caching
- Integrated seamlessly with existing session management system from Phase 7
- Added comprehensive error handling and loading states throughout the interface
- Supports all existing token types including cache creation and read tokens from Phase 6.1

**Expected Impact:**
Phase 8 completes the core functionality for viewing and analyzing individual requests within Claude API sessions. Users can now browse through their requests with rich filtering and sorting capabilities, view comprehensive metrics, and navigate to detailed request views. The implementation provides both overview and detailed views of API usage patterns.

---

### Phase 8.1: Tools Available vs Tools Used Distinction ✅
**Goal:** Correct the understanding of tool usage to distinguish between "Tools Available" (sent with requests) and "Tools Used" (actually invoked by the agent).

**Context & Problem:**
- During Phase 8 testing, discovered that the current "Tools Used" understanding is incorrect
- Each request includes all available tools in the request payload (`request.body.tools`)
- These represent "Tools Available" to the agent, not tools actually used
- Actual "Tools Used" can only be determined from the response content where tool calls are made
- This affects filtering accuracy and usage analytics throughout the application

**Key Requirements:**
- [x] Update data models to distinguish between `toolsAvailable` and `toolsUsed`
- [x] Parse response content to extract actual tool invocations from assistant messages
- [x] Update RequestAnalyzerService to calculate tools actually used vs tools available
- [x] Modify filtering logic to support both "tools available" and "tools used" filters
- [x] Update SessionSummary to show accurate tool usage statistics
- [x] Revise RequestCard and RequestFilters components to reflect correct tool usage
- [x] Update session metadata calculation to track both available and used tools

**Files Modified:**
- `/src/types/trace.ts` - Added `toolsAvailable` field to interfaces and distinguished from `toolsUsed` ✅
- `/src/services/requestAnalyzer.ts` - Added tool usage extraction from response content ✅
- `/src/services/traceParser.ts` - Updated session metadata to track both tool types ✅
- `/src/components/RequestFilters.tsx` - Added filter options for both tool availability and usage ✅
- `/src/components/SessionSummary.tsx` - Updated tool statistics to show accurate usage ✅
- `/src/components/RequestCard.tsx` - Display both available and used tools appropriately ✅
- `/src/hooks/useRequestList.ts` - Updated filtering logic to handle both tool types ✅
- `/src/pages/RequestListPage.tsx` - Updated to pass new props for tool filtering ✅
- `/src/services/sessionManager.ts` - Fixed TypeScript interfaces for fallback metadata ✅

**Verification Steps:**
- [x] Session metadata correctly differentiates between tools available vs used
- [x] Filtering by "tools used" only shows requests where tools were actually invoked
- [x] Filtering by "tools available" shows requests where tools were offered to agent
- [x] Session summary statistics reflect actual tool usage patterns
- [x] Request cards display appropriate tool information based on context
- [x] TypeScript compilation passes without errors
- [x] Tool usage analytics provide meaningful insights into actual vs potential tool usage

**Implementation Notes:**
- Tool invocations appear in response content as tool_use blocks within assistant messages
- Created `extractToolsUsedFromResponse()` and `extractToolsAvailableFromRequest()` utility functions
- Updated both non-streaming and streaming response parsers to handle tool usage extraction
- Enhanced SessionSummary to show both "Tools Available" (gray) and "Tools Actually Used" (amber) with clear visual distinction
- RequestCard detailed view shows tools available vs used with highlighting for tools that were both available and used
- RequestFilters now provides separate filtering options for "Tools Available" and "Tools Actually Used"
- Enhanced request analytics to track both tool availability patterns and actual usage patterns
- Added comprehensive TypeScript typing support for both tool types throughout the application

**Expected Impact:**
Phase 8.1 provides accurate tool usage analytics, enabling users to understand which tools are actually being leveraged by their Claude agents versus which tools are simply available. This distinction is crucial for optimizing tool configurations and understanding real automation patterns. Users can now filter and analyze their Claude API usage based on actual tool invocations rather than just tool availability.

---

### Phase 9: Request Detail View ✅
**Goal:** Implement detailed request/response viewing with structured data display and copy functionality.

**Context & Files:**
- RequestDetailPage (`/src/pages/RequestDetailPage.tsx`) updated with complete real data integration
- Leveraged existing SSE parsing from `traceParserService.reconstructResponseFromStream()`
- Supports both regular and streaming response formats with comprehensive data display

**Key Requirements:**
- [x] Parse streaming responses from SSE format in `body_raw`
- [x] Display structured request data (headers, body, tools, messages)
- [x] Show reconstructed final response in readable format
- [x] Add copyable text blocks for system prompts, user messages, and responses
- [x] Display performance metrics (request duration, token usage breakdown)
- [x] Show rate limiting information and API metadata
- [x] Handle tool usage display and tool call/response pairs

**Files Created/Modified:**
- `/src/pages/RequestDetailPage.tsx` - Complete implementation with real data integration ✅
- `/src/components/CopyableText.tsx` - Copyable text blocks with copy-to-clipboard functionality ✅
- `/src/components/RequestMetrics.tsx` - Performance and usage metrics display with comprehensive token breakdown ✅
- `/src/components/ToolUsageDisplay.tsx` - Tool call visualization with definitions and usage ✅
- `/src/hooks/useRequestDetail.ts` - React hook for individual request data management ✅

**Verification Steps:**
- [x] Streaming responses parse and display correctly using existing SSE parser
- [x] All request/response data visible in structured format with copyable text blocks
- [x] Copy functionality works for all text blocks (system prompts, user messages, responses)
- [x] Performance metrics display accurately with token breakdown and cache usage
- [x] Tool usage visualization shows available tools, used tools, definitions, and calls
- [x] Navigation breadcrumbs work correctly with error handling for missing requests
- [x] TypeScript compilation passes without errors
- [x] Build process succeeds
- [x] Development server starts successfully

**Implementation Notes:**
- Reused existing SSE parsing logic from Phase 6.1 for consistent streaming response handling
- Created comprehensive CopyableText component with JSON formatting and copy-to-clipboard
- RequestMetrics component provides detailed token usage breakdown including cache tokens
- ToolUsageDisplay distinguishes between tools available vs actually used with visual indicators
- Implemented proper error handling and loading states for request detail view
- Added support for both streaming and non-streaming response formats
- Created conversation view showing system prompts, user messages with proper formatting
- Enhanced user experience with color-coded message types and collapsible sections

**Expected Impact:**
Phase 9 completes the core trace viewer functionality by providing detailed request inspection with full context viewing, performance analysis, and tool usage insights. Users can now examine individual Claude API requests in depth with copyable content and comprehensive metrics display.

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