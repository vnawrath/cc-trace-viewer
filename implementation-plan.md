# Implementation Plan: Prepare for Public Release and Deployment

## Overview

This plan outlines the steps to prepare the cc-trace-viewer project for public release and deployment to Coolify. The work involves cleaning up the codebase by removing demo links, organizing test files, fixing lint issues, and creating Docker deployment configuration with proper SPA routing support.

**Current State:**
- React + TypeScript + Vite SPA application
- 205 lint errors (mostly in `docs/claude-trace/` directory)
- Build passes successfully
- No Dockerfile exists
- Demo navigation links hardcoded in Navigation component
- Test files scattered throughout `src/` directory
- Two root-level test scripts

**Target State:**
- Clean navigation without demo links
- Organized test structure in `src/__tests__/`
- Zero lint errors in main application code
- Production-ready Dockerfile with nginx configuration
- Ready for Coolify deployment

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
- `src/tools/phase8.test.tsx`
- `src/tools/phase3.test.ts`
- `src/tools/phase2.test.ts`
- `src/tests/toolDisplay.test.ts`
- `src/tests/conversationDetection.test.ts`
- `src/utils/phase4.test.ts`
- `src/utils/phase5.test.ts`
- `src/utils/toolRegistry.test.ts`
- `src/utils/phase6.test.ts`

**Root-level test scripts to delete:**
- `test-cost-calculator.ts`
- `test-toolregistry.js`

### Tasks
- [ ] Create `src/__tests__/` directory
- [ ] Move all test files from `src/tools/`, `src/tests/`, and `src/utils/` to `src/__tests__/`
- [ ] Delete `test-cost-calculator.ts` from root
- [ ] Delete `test-toolregistry.js` from root
- [ ] Update any import paths in test files if needed (check for relative imports)
- [ ] Delete empty `src/tests/` directory if it becomes empty

### Files to Move
```
src/tools/phase8.test.tsx          → src/__tests__/phase8.test.tsx
src/tools/phase3.test.ts           → src/__tests__/phase3.test.ts
src/tools/phase2.test.ts           → src/__tests__/phase2.test.ts
src/tests/toolDisplay.test.ts      → src/__tests__/toolDisplay.test.ts
src/tests/conversationDetection.test.ts → src/__tests__/conversationDetection.test.ts
src/utils/phase4.test.ts           → src/__tests__/phase4.test.ts
src/utils/phase5.test.ts           → src/__tests__/phase5.test.ts
src/utils/toolRegistry.test.ts     → src/__tests__/toolRegistry.test.ts
src/utils/phase6.test.ts           → src/__tests__/phase6.test.ts
```

### Files to Delete
- `/test-cost-calculator.ts`
- `/test-toolregistry.js`

### Verification Steps
1. Check that `src/__tests__/` directory exists and contains all 9 test files
2. Verify `src/tests/` directory is deleted (if it was only containing test files)
3. Verify root-level test scripts are deleted
4. Run `ls -la src/` to confirm no test files remain in subdirectories
5. Run `npm run build` to ensure no broken imports

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

## Phase 4: Create Docker Deployment Configuration

**Objective:** Create production-ready Dockerfile and nginx configuration for deploying the Vite SPA to Coolify with proper client-side routing support.

### Context
**Research findings:**
- Coolify supports both Nixpacks (auto-detection) and custom Dockerfile
- Custom Dockerfile recommended for SPA routing control
- Multi-stage build pattern: Node builder → nginx production
- Critical requirement: nginx must route all paths to `index.html` for React Router
- Vite builds to `dist/` directory by default

**Deployment approach:**
- Use multi-stage Dockerfile (smaller final image, better security)
- nginx alpine image for production serving
- Custom nginx.conf with `try_files` directive for SPA routing
- Expose port 80 for Coolify/Traefik integration

### Tasks
- [ ] Create `Dockerfile` at repository root
- [ ] Create `nginx.conf` at repository root
- [ ] Verify build process works locally
- [ ] Test Docker build locally (optional but recommended)
- [ ] Update `.gitignore` if needed (ensure `dist/` is already ignored)

### Files to Create

#### `Dockerfile`
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Key design decisions:**
- `node:20-alpine` - Matches modern Node.js, minimal image
- `npm ci` - Faster, more reliable than `npm install` for production
- Multi-stage build - Keeps final image small (only dist + nginx)
- `nginx:stable-alpine` - Production-grade nginx, minimal size
- Port 80 - Standard HTTP, Coolify/Traefik handles SSL

#### `nginx.conf`
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;

    # Critical: Handle SPA routing
    # Try to serve file directly, fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Prevent access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

**Key nginx directives:**
- `try_files $uri $uri/ /index.html` - Core SPA routing support
- Security headers - Basic protection against common attacks
- Gzip compression - Reduce bandwidth, improve load times
- Asset caching - Vite uses content hashes, safe to cache aggressively
- Hidden file protection - Security best practice

### Related Files
- `package.json:8` - Build script already exists: `"build": "tsc -b && vite build"`
- `vite.config.ts` - Default Vite config should work without changes
- `.gitignore` - Should already ignore `dist/` (verify)

### Verification Steps
1. Create both files at repository root
2. Run `npm run build` to ensure build process works
3. Check that `dist/` directory is created with expected files
4. Verify `dist/index.html` exists
5. (Optional) Test Docker build locally:
   ```bash
   docker build -t cc-trace-viewer:test .
   docker run -p 8080:80 cc-trace-viewer:test
   # Visit http://localhost:8080 and test routing
   ```
6. If Docker test not performed, mark as ready for Coolify deployment testing

### Coolify Configuration Notes
Once files are committed and pushed, configure in Coolify UI:
- **Build Pack:** Dockerfile
- **Dockerfile Location:** `/Dockerfile`
- **Port:** 80
- **Health Check:** Optional, HTTP GET to `/`
- **Environment Variables:** Any `VITE_*` prefixed vars needed

---

## Phase 5: Final Verification

**Objective:** Run comprehensive checks to ensure the codebase is ready for public release and deployment.

### Tasks
- [ ] Run full lint check: `npm run lint`
- [ ] Run full build: `npm run build`
- [ ] Verify demo links are completely removed
- [ ] Verify test files are organized in `src/__tests__/`
- [ ] Verify root test scripts are deleted
- [ ] Verify Dockerfile and nginx.conf exist at root
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

# Docker files exist
ls Dockerfile nginx.conf
# Expected: Both files exist

# Check git status
git status
# Review all modified/created/deleted files
```

### Pre-Deployment Checklist
- [ ] All phases completed and verified
- [ ] Code committed to git
- [ ] Repository ready to be made public
- [ ] Dockerfile tested (locally or prepared for Coolify test)
- [ ] No sensitive data in codebase (API keys, credentials, etc.)

### Deployment Steps (Post-Implementation)
1. Push changes to git repository
2. Make repository public on GitHub/GitLab
3. In Coolify:
   - Create new resource
   - Connect to repository
   - Select "Dockerfile" build pack
   - Set port to 80
   - Deploy
4. Test deployed application:
   - Homepage loads
   - Navigation works
   - Direct URL navigation works (SPA routing)
   - No 404 errors on routes

---

## Summary

This implementation plan consists of 5 phases:

1. **Remove Demo Navigation Links** - Clean up hardcoded demo routes
2. **Reorganize Test Files** - Centralize tests in `src/__tests__/`
3. **Fix Lint Configuration and Errors** - Achieve zero lint errors in `src/`
4. **Create Docker Deployment Configuration** - Production-ready containerization
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

Once completed, the project will be ready for public release and deployment to Coolify.
