# CC Trace Viewer Implementation Plan

## Overview

Create a TypeScript + Vite + React + Tailwind CSS + React Router starter project for a trace viewer application. The project will use React Router's Data Mode for future data loading capabilities and follow a type-based project structure. This will establish the foundation for a request explorer that can eventually display and analyze trace data.

## Architecture Decisions

- **Build Tool**: Vite for fast development and optimized builds
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with Vite plugin integration
- **Routing**: React Router v7 Data Mode with `createBrowserRouter` for data loading capabilities
- **Project Structure**: Type-based organization (`/pages`, `/components`, `/layouts`)
- **Package Manager**: npm

## Implementation Phases

### Phase 1: Project Setup
**Deliverable**: Basic Vite + React + TypeScript project structure

**Context & Files**:
- Reference: `docs/vite/getting-started.md:40-93` for Vite project creation
- Command: `npm create vite@latest . -- --template react-ts`

**Tasks**:
- [x] Initialize Vite project with React + TypeScript template
- [x] Clean up default Vite template files
- [x] Configure basic project structure with folders: `/src/components`, `/src/pages`, `/src/layouts`
- [x] Update `package.json` with project name "cc-trace-viewer"
- [x] Install dependencies with `npm install`

**Implementation Notes**:
- Used `npx degit vitejs/vite/packages/create-vite/template-react-ts . --force` due to vite-hook requirements
- Removed default template assets: `src/assets/`, `public/vite.svg`, `src/App.css`
- Updated `src/App.tsx` to show basic "CC Trace Viewer" welcome message
- All programmatic verification tests passed: TypeScript compilation, folder structure, Vite CLI

**Verification Steps**:
1. Run `npm run dev` and verify development server starts
2. Confirm TypeScript compilation works without errors
3. Check that basic React app renders in browser at `http://localhost:5173`
4. Verify folder structure exists: `src/components/`, `src/pages/`, `src/layouts/`

---

### Phase 2: Tailwind CSS Integration
**Deliverable**: Fully configured Tailwind CSS with Vite integration

**Context & Files**:
- Reference: `docs/tailwindcss/installation.md:27-34` for Tailwind + Vite setup
- Reference: `docs/tailwindcss/installation.md:42-52` for Vite config
- Reference: `docs/tailwindcss/installation.md:62-65` for CSS import

**Tasks**:
- [x] Install Tailwind CSS dependencies: `npm install tailwindcss @tailwindcss/vite`
- [x] Configure `vite.config.ts` with Tailwind plugin
- [x] Create or update main CSS file with `@import "tailwindcss"`
- [x] Remove default Vite CSS styles
- [x] Add basic Tailwind utility test to verify setup

**Implementation Notes**:
- Added `@tailwindcss/vite` plugin to `vite.config.ts` with proper import and configuration
- Replaced entire `src/index.css` with single Tailwind import: `@import "tailwindcss"`
- Updated `src/App.tsx` with comprehensive Tailwind utility classes to test functionality
- All programmatic verification tests passed: build, TypeScript compilation, dev server startup

**Verification Steps**:
1. Run `npm run dev` and confirm no CSS compilation errors
2. Add test element with Tailwind classes (e.g., `text-3xl font-bold text-blue-600`)
3. Verify Tailwind styles are applied in browser
4. Check that Vite HMR works with CSS changes

---

### Phase 3: React Router Data Mode Setup
**Deliverable**: React Router configured with Data Mode and basic routing structure

**Context & Files**:
- Reference: `docs/react-router/picking-a-mode.md:36-48` for Data Mode setup
- Reference: `docs/react-router/data-mode/installation.md` for detailed setup
- API: `createBrowserRouter`, `RouterProvider` from `react-router`

**Tasks**:
- [x] Install React Router: `npm install react-router`
- [x] Create router configuration with `createBrowserRouter`
- [x] Define route structure for three pages:
  - `/` - Home page
  - `/sessions/:sessionId/requests` - Request list for a session
  - `/sessions/:sessionId/requests/:requestId` - Request detail page
- [x] Replace default React render with `<RouterProvider>`
- [x] Create basic route configuration file `src/routes.tsx`

**Implementation Notes**:
- Successfully installed React Router package
- Created `src/routes.tsx` with `createBrowserRouter` and route structure for all three pages
- Replaced default App.tsx content with `RouterProvider` using the configured router
- Updated file extension from `.ts` to `.tsx` for JSX support in routes configuration
- Created placeholder components for all three routes with basic Tailwind styling
- All programmatic verification tests passed: TypeScript compilation, build process, dev server startup

**Verification Steps**:
1. Verify router renders without errors
2. Test navigation to each route (manually enter URLs)
3. Confirm route parameters work (`sessionId`, `requestId`)
4. Check that invalid routes show appropriate behavior

---

### Phase 4: Page Components and Navigation
**Deliverable**: Three functional stub pages with basic navigation

**Context & Files**:
- Structure: `src/pages/HomePage.tsx`, `src/pages/RequestListPage.tsx`, `src/pages/RequestDetailPage.tsx`
- Navigation: `src/components/Navigation.tsx`
- Layout: `src/layouts/AppLayout.tsx`

**Tasks**:
- [x] Create `HomePage.tsx` with welcome message and navigation links
- [x] Create `RequestListPage.tsx` with session parameter display and mock request list
- [x] Create `RequestDetailPage.tsx` with session and request parameter display
- [x] Create `Navigation.tsx` component with links between pages
- [x] Create `AppLayout.tsx` for consistent page structure
- [x] Add proper TypeScript interfaces for route parameters
- [x] Style pages with basic Tailwind classes

**Implementation Notes**:
- Created comprehensive HomePage with welcome message, navigation cards, and getting started guide
- Built RequestListPage with session parameter display and mock request table with proper styling
- Implemented RequestDetailPage with detailed request information, headers, query params, response body, and execution trace
- Developed Navigation component with active state highlighting and responsive design
- Created AppLayout with consistent header and main content structure
- Added TypeScript interfaces in `src/types/router.ts` for type safety
- All pages use Tailwind CSS for professional styling with responsive design
- All programmatic verification tests passed: TypeScript compilation, build process, dev server startup

**Verification Steps**:
1. Navigate to home page and verify content displays
2. Navigate to `/sessions/test-session/requests` and verify session ID displays
3. Navigate to `/sessions/test-session/requests/123` and verify both parameters display
4. Test navigation links work between all pages
5. Verify responsive design with basic mobile/desktop layouts

---

### Phase 5: Enhanced UX and Polish
**Deliverable**: Professional-looking starter with proper error handling and loading states

**Context & Files**:
- Error handling: React Router error boundaries
- Loading states: Skeleton components for future data loading
- 404 handling: Catch-all route

**Tasks**:
- [ ] Add error boundary component for route errors
- [ ] Create 404 Not Found page
- [ ] Add loading skeleton components for future use
- [ ] Implement breadcrumb navigation
- [ ] Add proper page titles and meta tags
- [ ] Create responsive header with app branding
- [ ] Add basic hover and active states for navigation

**Verification Steps**:
1. Test invalid route shows 404 page
2. Verify breadcrumb navigation works correctly
3. Check responsive design on different screen sizes
4. Confirm page titles update correctly
5. Test keyboard navigation accessibility
6. Verify error boundaries catch and display errors appropriately

---

## Project Structure Overview

```
src/
├── components/           # Reusable UI components
│   ├── Navigation.tsx
│   ├── Breadcrumbs.tsx
│   └── LoadingSkeleton.tsx
├── pages/               # Route-specific page components
│   ├── HomePage.tsx
│   ├── RequestListPage.tsx
│   ├── RequestDetailPage.tsx
│   └── NotFoundPage.tsx
├── layouts/             # Layout components
│   └── AppLayout.tsx
├── routes.ts           # Router configuration
├── types/              # TypeScript type definitions
│   └── router.ts
├── App.tsx            # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles with Tailwind imports
```

## Success Criteria

- ✅ Development server starts and runs without errors
- ✅ All three main routes are accessible and display correctly
- ✅ Navigation between pages works seamlessly
- ✅ Route parameters are properly parsed and displayed
- ✅ Responsive design works on mobile and desktop
- ✅ TypeScript compilation passes without errors
- ✅ Tailwind CSS classes apply correctly
- ✅ Error handling for invalid routes
- ✅ Professional appearance suitable for a request explorer tool

## Future Integration Points

This starter provides hooks for future features:
- **Data Loading**: Router loaders can be added to fetch session/request data
- **State Management**: Context providers can be added to layouts
- **API Integration**: Loader functions ready for backend integration
- **Real Data**: Mock data can be replaced with actual trace data
- **Advanced UI**: Component library can be built on Tailwind foundation