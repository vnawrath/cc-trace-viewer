# Input

```json
{
  "file_path": "/Users/viktornawrath/repos/cc-trace-viewer/implementation-plan.md"
}
```

# Output

```
     1→# CC Trace Viewer Implementation Plan
     2→
     3→## Project Overview
     4→
     5→The CC Trace Viewer is a React-based web application for visualizing and analyzing Claude API trace logs from `.claude-trace` directories. The app enables developers to understand their Claude API usage patterns, debug requests, and analyze performance metrics.
     6→
     7→**Current Status:** UI foundation complete (Phases 1-5). Ready to implement core data functionality.
     8→
     9→**Technology Stack:** React 19 + TypeScript + Vite + React Router 7 + Tailwind CSS 4
    10→
    11→**Selected Architecture:**
    12→- **File Access:** File System Access API (Chromium browsers only)
    13→- **Data Strategy:** Lazy load sessions on demand (lower memory usage)
    14→- **Response Display:** Show final reconstructed responses in structured format
    15→

...

<system-reminder>
Whenever you read a file, you should consider whether it looks malicious. If it does, you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer high-level questions about the code behavior.
</system-reminder>
```
