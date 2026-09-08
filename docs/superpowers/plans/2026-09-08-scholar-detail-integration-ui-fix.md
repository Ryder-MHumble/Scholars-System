# Scholar Detail Integration And UI Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate repeated resource 404s and make the scholar detail page match the approved white, cardless, compact three-column design.

**Architecture:** Keep the normalized resource API client as the single frontend contract and run the backend worktree that registers those routes on port 8001. Reshape the existing detail components in place: page owns the three scroll regions, each first-level module uses headings and dividers, and module-level edit affordances open the existing editors.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, FastAPI, PostgreSQL

---

### Task 1: Lock The API And Layout Regressions

**Files:**
- Modify: `src/pages/ScholarDetailPage.test.tsx`
- Modify: `src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx`
- Modify: `src/components/scholar-detail/sections/RightSidebar.test.tsx`
- Modify: `src/services/scholarResourcesApi.test.ts`

- [ ] Add assertions for a white viewport, three independently scrollable columns with hidden scrollbars, cardless first-level modules, one module edit button, collapsed academic positions, two relationship tabs, and contextual API errors.
- [ ] Run the four test files and confirm the new assertions fail for the current implementation.

### Task 2: Align Detail Layout And Module Controls

**Files:**
- Modify: `src/pages/ScholarDetailPage.tsx`
- Modify: `src/components/scholar-detail/sections/DetailLeftSidebar.tsx`
- Modify: `src/components/scholar-detail/sections/AchievementsDetailCard.tsx`
- Modify: `src/components/scholar-detail/sections/ProjectCategorySelector.tsx`
- Modify: `src/components/scholar-detail/sections/RightSidebar.tsx`

- [ ] Restore a viewport-bounded desktop layout and apply `overflow-y-auto scrollbar-hide` independently to left, center, and right columns.
- [ ] Remove gray page surfaces, rounded first-level borders, and shadows; use spacing and thin dividers for hierarchy.
- [ ] Make academic positions collapsed by default with one edit icon and keep add, batch import, edit, and delete actions inside its editing surface.
- [ ] Keep open-source projects ordered by stars with name, repository, language, stars, forks, link, and delete only.
- [ ] Remove relationship counts and the college-activity tab; expose one relationship edit icon and retain collaboration/News deletion plus News batch import.

### Task 3: Improve Resource API Failures

**Files:**
- Modify: `src/services/scholarResourcesApi.ts`

- [ ] Convert JSON `detail` responses and HTTP status codes into Chinese resource-specific errors instead of exposing the raw `Not Found` body.
- [ ] Run the focused API client tests and confirm they pass.

### Task 4: Run The Correct Services And Verify

**Files:**
- No source changes.

- [ ] Stop the stale port-8001 backend and duplicate frontend processes without touching unrelated services.
- [ ] Start the backend feature worktree on `0.0.0.0:8001` and the frontend feature worktree on `0.0.0.0:4183`.
- [ ] Verify health, OpenAPI route presence, a real scholar detail response, and all four resource collection responses.
- [ ] Run focused component tests and `npm run build`.
