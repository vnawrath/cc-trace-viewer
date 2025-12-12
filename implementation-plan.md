# Implementation Plan: Prepare for Public Release and Deployment

## Overview

This plan outlines the steps to prepare the cc-trace-viewer project for public release and deployment to GitHub Pages. The work involves cleaning up the codebase by removing demo links, organizing test files, fixing lint issues, and setting up GitHub Actions for automated deployment.

**Current State:**
- React + TypeScript + Vite SPA application
- 205 lint errors (mostly in `docs/claude-trace/` directory)
- Build passes successfully
- No GitHub Actions workflow exists
- Demo navigation links hardcoded in Navigation component
- Test files scattered throughout `src/` directory
- Two root-level test scripts

**Target State:**
- Clean navigation without demo links
- Organized test structure in `src/__tests__/`
- Zero lint errors in main application code
- GitHub Actions workflow for automated deployment to GitHub Pages
- Live site accessible via GitHub Pages

---

## Phase 1: Remove Demo Navigation Links

**Objective:** Remove hardcoded demo links from the Navigation component to prepare for public release.

### Context
- **File:** `src/components/Navigation.tsx`
- **Lines:** 22-33
- **Current behavior:** Navigation shows "Demo Requests" and "Demo Detail" links pointing to hardcoded demo session routes
- **Routes:** `/sessions/demo-session/requests` and `/sessions/demo-session/requests/123`

### Tasks
- [x] Remove demo link elements from Navigation component
- [x] Keep only the "Home" link in navigation
- [x] Verify Navigation component renders correctly
- [ ] Test app in browser to ensure navigation works

### Files to Modify
- `src/components/Navigation.tsx:22-33` - Remove demo link JSX elements
- `src/pages/NotFoundPage.tsx:27-32` - Remove demo link JSX element

### Verification Steps
1. Run `npm run dev`
2. Open app in browser at `http://localhost:5173`
3. Verify navigation only shows "Home" link
4. Click "Home" link and verify it navigates to `/`
5. Check that no console errors appear
6. Run `npm run build` to ensure build still passes

---

## Phase 2: Reorganize Test Files

**Objective:** Move all test files to a centralized `src/__tests__/` directory and remove root-level test scripts.

### Context
**Current test files in `src/`:**
- `src/tools/phase8.test.tsx` → renamed to `reactRenderers.test.tsx`
- `src/tools/phase3.test.ts` → renamed to `additionalTools.test.ts`
- `src/tools/phase2.test.ts` → renamed to `coreFileTools.test.ts`
- `src/tests/toolDisplay.test.ts` → kept as `toolDisplay.test.ts`
- `src/tests/conversationDetection.test.ts` → kept as `conversationDetection.test.ts`
- `src/utils/phase4.test.ts` → renamed to `messageListDisplay.test.ts`
- `src/utils/phase5.test.ts` → renamed to `badgeDisplay.test.ts`
- `src/utils/toolRegistry.test.ts` → kept as `toolRegistry.test.ts`
- `src/utils/phase6.test.ts` → renamed to `customRenderers.test.ts`

**Root-level test scripts to delete:**
- `test-cost-calculator.ts`
- `test-toolregistry.js`

### Tasks
- [x] Create `src/__tests__/` directory
- [x] Move all test files from `src/tools/`, `src/tests/`, and `src/utils/` to `src/__tests__/`
- [x] Delete `test-cost-calculator.ts` from root
- [x] Delete `test-toolregistry.js` from root
- [x] Update any import paths in test files if needed (check for relative imports)
- [x] Delete empty `src/tests/` directory if it becomes empty

### Files Moved and Renamed
```
src/tools/phase8.test.tsx          → src/__tests__/reactRenderers.test.tsx
src/tools/phase3.test.ts           → src/__tests__/additionalTools.test.ts
src/tools/phase2.test.ts           → src/__tests__/coreFileTools.test.ts
src/tests/toolDisplay.test.ts      → src/__tests__/toolDisplay.test.ts
src/tests/conversationDetection.test.ts → src/__tests__/conversationDetection.test.ts
src/utils/phase4.test.ts           → src/__tests__/messageListDisplay.test.ts
src/utils/phase5.test.ts           → src/__tests__/badgeDisplay.test.ts
src/utils/toolRegistry.test.ts     → src/__tests__/toolRegistry.test.ts
src/utils/phase6.test.ts           → src/__tests__/customRenderers.test.ts
```

### Files to Delete
- `/test-cost-calculator.ts`
- `/test-toolregistry.js`

### Verification Steps
1. ✅ Check that `src/__tests__/` directory exists and contains all 9 test files
2. ✅ Verify `src/tests/` directory is deleted (if it was only containing test files)
3. ✅ Verify root-level test scripts are deleted
4. ✅ Run `ls -la src/` to confirm no test files remain in subdirectories
5. ✅ Run `npm run build` to ensure no broken imports

**Phase 2 Completed:**
- All 9 test files successfully moved to `src/__tests__/`
- Renamed 6 test files to semantic names:
  - `phase2.test.ts` → `coreFileTools.test.ts`
  - `phase3.test.ts` → `additionalTools.test.ts`
  - `phase4.test.ts` → `messageListDisplay.test.ts`
  - `phase5.test.ts` → `badgeDisplay.test.ts`
  - `phase6.test.ts` → `customRenderers.test.ts`
  - `phase8.test.tsx` → `reactRenderers.test.tsx`
- Fixed import paths in 6 test files
- Deleted root-level test scripts: `test-cost-calculator.ts` and `test-toolregistry.js`
- Deleted empty `src/tests/` directory
- Build passes successfully with no broken imports

---

## Phase 3: Fix Lint Configuration and Errors

**Objective:** Update ESLint configuration to ignore the `docs/` directory and fix all remaining lint errors in the main application code (`src/`).

### Context
- **Current state:** 205 lint errors total
- **Breakdown:** Majority in `docs/claude-trace/` directory, some in `src/`
- **File:** `eslint.config.js`
- **Strategy:** Ignore `docs/` directory entirely, fix only `src/` errors

### Tasks
- [ ] Update `eslint.config.js` to add global ignore for `docs/` directory
- [ ] Run `npm run lint` to see remaining errors in `src/`
- [ ] Fix lint errors in `src/` directory systematically
- [ ] Verify lint passes with zero errors

### Files to Modify
- `eslint.config.js` - Add `docs/**` to ignored patterns

### Expected Lint Errors in `src/` (to fix)
Based on previous lint output, main categories:
- `@typescript-eslint/no-explicit-any` - Replace `any` types with proper types
- `@typescript-eslint/no-unused-vars` - Remove or prefix unused variables with `_`
- `no-useless-escape` - Fix regex escape characters
- `prefer-const` - Change `let` to `const` where variables aren't reassigned

### Verification Steps
1. Run `npm run lint` before changes to document baseline
2. Update eslint config
3. Run `npm run lint` again to see filtered errors
4. Fix each error category systematically
5. Run `npm run lint` and verify output shows "0 problems"
6. Run `npm run build` to ensure TypeScript compilation still works

---

## Phase 4: Set Up GitHub Pages Deployment

**Objective:** Configure Vite for GitHub Pages deployment and create a GitHub Actions workflow for automated deployment.

### Context
**Deployment approach:**
- GitHub Pages serves static files from a repository
- Two deployment options:
  1. Build locally and push to `gh-pages` branch (manual)
  2. Use GitHub Actions to build and deploy automatically (recommended)
- GitHub Pages can serve from root domain (username.github.io) or subpath (username.github.io/repo-name)
- For subpath deployment, Vite needs `base` configuration
- Vite builds to `dist/` directory by default
- GitHub Actions has built-in GitHub Pages deployment actions

**Assumptions:**
- Repository name: `cc-trace-viewer`
- Will be deployed to: `https://<username>.github.io/cc-trace-viewer/`
- Need to configure `base: '/cc-trace-viewer/'` in vite.config.ts

### Tasks
- [ ] Update `vite.config.ts` to add `base` configuration for GitHub Pages subpath
- [ ] Create `.github/workflows/deploy.yml` for GitHub Actions deployment workflow
- [ ] Verify build works locally with new base path
- [ ] Document deployment setup in comments or README

### Files to Modify

#### `vite.config.ts`
Add `base` property to the config:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/cc-trace-viewer/', // Required for GitHub Pages subpath deployment
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/.claude-trace/**']
    }
  }
})
```

**Key configuration:**
- `base: '/cc-trace-viewer/'` - Tells Vite to prefix all asset paths with the repo name
- This ensures CSS, JS, and other assets load correctly when deployed to a subpath
- If deploying to a custom domain or root path later, this can be removed

### Files to Create

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # Deploy on push to main branch
  workflow_dispatch:  # Allow manual deployment from Actions tab

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Key workflow features:**
- Triggers on push to `main` branch and manual workflow dispatch
- Two jobs: `build` (creates production build) and `deploy` (publishes to Pages)
- Uses official GitHub Actions for Pages deployment
- Caches npm dependencies for faster builds
- Requires GitHub Pages to be enabled in repository settings

### Related Files
- `package.json:8` - Build script already exists: `"build": "tsc -b && vite build"`
- `.gitignore` - Should already ignore `dist/` (verify)

### Verification Steps
1. Update `vite.config.ts` with `base` configuration
2. Run `npm run build` locally to ensure build works with new base path
3. Check that `dist/` directory is created with expected files
4. Verify `dist/index.html` contains correct asset paths (e.g., `/cc-trace-viewer/assets/...`)
5. Create `.github/workflows/deploy.yml`
6. Commit and push changes to trigger first deployment

### GitHub Repository Configuration
After pushing the workflow file, configure in GitHub:
1. Go to repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy on the next push to `main`
4. Site will be available at: `https://<username>.github.io/cc-trace-viewer/`

### Post-Deployment Testing
Once deployed, verify:
- Homepage loads correctly
- All assets (CSS, JS, images) load without 404 errors
- React Router navigation works (no 404 on page refresh)
- GitHub Pages automatically handles SPA routing (serves index.html for all paths)

---

## Phase 5: Final Verification

**Objective:** Run comprehensive checks to ensure the codebase is ready for public release and deployment.

### Tasks
- [ ] Run full lint check: `npm run lint`
- [ ] Run full build: `npm run build`
- [ ] Verify demo links are completely removed
- [ ] Verify test files are organized in `src/__tests__/`
- [ ] Verify root test scripts are deleted
- [ ] Verify GitHub Actions workflow exists at `.github/workflows/deploy.yml`
- [ ] Verify `vite.config.ts` has correct `base` configuration
- [ ] Review git status to ensure only intended changes
- [ ] Update README.md if needed (optional)
- [ ] Commit all changes with clear commit message

### Verification Checklist
```bash
# Lint passes
npm run lint
# Expected: No errors

# Build passes
npm run build
# Expected: Build succeeds, creates dist/

# No demo links
grep -r "demo-session" src/
# Expected: No matches in src/

# Test files organized
ls src/__tests__/
# Expected: 9 test files present

# Root tests deleted
ls test-*.{ts,js} 2>/dev/null
# Expected: No such files

# GitHub Actions workflow exists
ls .github/workflows/deploy.yml
# Expected: File exists

# Vite config has base path
grep "base:" vite.config.ts
# Expected: base: '/cc-trace-viewer/'

# Check git status
git status
# Review all modified/created/deleted files
```

### Pre-Deployment Checklist
- [ ] All phases completed and verified
- [ ] Code committed to git
- [ ] Repository ready to be made public
- [ ] GitHub Actions workflow configured
- [ ] No sensitive data in codebase (API keys, credentials, etc.)

### Deployment Steps (Post-Implementation)
1. Push changes to git repository (triggers GitHub Actions deployment)
2. Make repository public on GitHub
3. In GitHub repository settings:
   - Go to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
4. Monitor GitHub Actions tab to see deployment progress
5. Test deployed application at `https://<username>.github.io/cc-trace-viewer/`:
   - Homepage loads
   - All assets load without 404 errors
   - Navigation works
   - Direct URL navigation works (SPA routing)
   - No 404 errors on routes

---

## Summary

This implementation plan consists of 5 phases:

1. **Remove Demo Navigation Links** - Clean up hardcoded demo routes
2. **Reorganize Test Files** - Centralize tests in `src/__tests__/`
3. **Fix Lint Configuration and Errors** - Achieve zero lint errors in `src/`
4. **Set Up GitHub Pages Deployment** - Configure Vite and create GitHub Actions workflow
5. **Final Verification** - Comprehensive pre-deployment checks

Each phase is designed to be:
- **Deliverable on its own** - Can be completed and verified independently
- **Testable** - Clear verification steps provided
- **Roughly equal in scope** - Balanced workload across phases

**Estimated Time:**
- Phase 1: ~15 minutes
- Phase 2: ~20 minutes
- Phase 3: ~30-45 minutes (depending on lint error count in `src/`)
- Phase 4: ~30 minutes
- Phase 5: ~15 minutes

**Total:** ~2-2.5 hours

Once completed, the project will be ready for public release and deployment to GitHub Pages.
