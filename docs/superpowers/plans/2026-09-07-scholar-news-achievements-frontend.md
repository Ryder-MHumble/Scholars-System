# Scholar News and Achievements Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore scholar News rendering and editing, add batch import, present six independently persisted achievement tabs, and keep college activities distinct and reliable.

**Architecture:** Typed service modules own News and achievement resource contracts. The detail hook loads and mutates each collection independently; the center achievement card and right relation card consume those states. Pure XLSX parsing is unit-tested, while component workflows and responsive behavior are verified in a real browser.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, XLSX, Vitest, Playwright.

---

### Task 1: Preserve Relevant Working Context and Add a Test Harness

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`
- Import current-checkout diffs for task-overlapping scholar detail/types files

- [ ] **Step 1: Preserve task-overlapping user changes**

Bring current changes in `AchievementsDetailCard.tsx`, `scholarApi/types.ts`, `scholarApi/helpers.ts`, and other directly overlapping scholar detail files into the isolated worktree. Commit them once as `chore: preserve scholar detail working context`; use that commit as the final-diff baseline.

- [ ] **Step 2: Run GitNexus impact analysis before edits**

```bash
node .gitnexus/run.cjs impact "RightSidebar" --direction upstream
node .gitnexus/run.cjs impact "AchievementsDetailCard" --direction upstream
node .gitnexus/run.cjs impact "useScholarDetail" --direction upstream
node .gitnexus/run.cjs impact "fetchScholarActivities" --direction upstream
```

Warn before editing on HIGH or CRITICAL; confirm UNKNOWN with `rg`.

- [ ] **Step 3: Add Vitest with the smallest necessary dependencies**

Add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, and `@playwright/test` as dev dependencies. Add scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

Configure `environment: "jsdom"`, path alias parity, and automatic cleanup in `src/test/setup.ts`. Configure Playwright with the local Vite web server and desktop/mobile projects in `playwright.config.ts`.

- [ ] **Step 4: Verify the harness and commit**

```bash
npm test -- --passWithNoTests
npm run build
git add package.json package-lock.json vite.config.ts playwright.config.ts src/test/setup.ts
git commit -m "test: add frontend unit test harness"
```

### Task 2: Add Typed Resource Clients

**Files:**
- Modify: `src/services/scholarApi/types.ts`
- Create: `src/services/scholarResourcesApi.ts`
- Test: `src/services/scholarResourcesApi.test.ts`

- [ ] **Step 1: Write failing API client tests**

Mock `fetch` and assert URL/method/body for News list/create/batch/update/delete and the three new achievement collections. Assert a failed response includes the server detail rather than a generic empty result.

```typescript
expect(fetch).toHaveBeenCalledWith(
  `${API_BASE_URL}/api/scholars/scholar-1/news/news-1`,
  expect.objectContaining({ method: "PATCH" }),
);
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/services/scholarResourcesApi.test.ts
```

Expected: import failure because the client is absent.

- [ ] **Step 3: Define types and implement clients**

Add stable-ID interfaces `ScholarNews`, `ResearchProject`, `OpenSourceProject`, `AcademicPosition`, create/update payloads, and:

```typescript
export type BatchRowStatus =
  | "created"
  | "updated"
  | "skipped"
  | "pending_match"
  | "failed";
```

Use a shared response parser that preserves server error details. Export explicit functions rather than a generic untyped resource client.

- [ ] **Step 4: Verify GREEN and commit**

```bash
npm test -- src/services/scholarResourcesApi.test.ts
git add src/services/scholarApi/types.ts src/services/scholarResourcesApi.ts src/services/scholarResourcesApi.test.ts
git commit -m "feat: add scholar resource API clients"
```

### Task 3: Parse and Preview News Batch Imports

**Files:**
- Create: `src/utils/scholarNewsImport.ts`
- Create: `src/components/scholar-detail/modals/NewsBatchImportModal.tsx`
- Test: `src/utils/scholarNewsImport.test.ts`

- [ ] **Step 1: Write failing parser tests**

Use in-memory workbooks to cover UTF-8/Excel values, Chinese and English headers, blank rows, Excel dates, duplicate rows, explicit scholar ID, name-plus-institution pending matches, and row-numbered validation errors.

```typescript
expect(parseNewsRows(workbook).rows[0]).toMatchObject({
  title: "获批重点项目",
  published_at: "2026-09-07",
});
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/utils/scholarNewsImport.test.ts
```

- [ ] **Step 3: Implement parser and template**

Reuse the installed `xlsx` package. Supported columns are `学者ID/姓名/机构/标题/类型/摘要/正文/发布日期/来源URL`. Return parsed rows and row-level errors; do not issue network calls from the parser. Generate a downloadable `.xlsx` template from the same column definition.

- [ ] **Step 4: Implement the batch modal**

Provide file selection, preview, status/error column, import summary, and retry for failed rows. Submit one structured request through `batchScholarNews`, not one request per row.

- [ ] **Step 5: Verify GREEN and commit**

```bash
npm test -- src/utils/scholarNewsImport.test.ts
npx eslint src/utils/scholarNewsImport.ts src/components/scholar-detail/modals/NewsBatchImportModal.tsx
git add src/utils/scholarNewsImport.ts src/utils/scholarNewsImport.test.ts src/components/scholar-detail/modals/NewsBatchImportModal.tsx
git commit -m "feat: add scholar news batch import"
```

### Task 4: Restore News CRUD in the Right Sidebar

**Files:**
- Modify: `src/components/scholar-detail/sections/RightSidebar.tsx`
- Create: `src/components/scholar-detail/modals/EditNewsModal.tsx`
- Modify: `src/pages/ScholarDetailPage.tsx`
- Test: `src/components/scholar-detail/sections/RightSidebar.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

Render the sidebar with mocked services and verify three tabs `合作学者 | 学者 News | 学院活动`, approved News ordering, real empty state, explicit load error with retry, and callbacks after create/update/delete/batch.

```typescript
await user.click(screen.getByRole("button", { name: "学者 News" }));
expect(await screen.findByText("获批重点项目")).toBeVisible();
expect(screen.getByRole("button", { name: "批量导入" })).toBeEnabled();
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/components/scholar-detail/sections/RightSidebar.test.tsx
```

- [ ] **Step 3: Implement three independent tab states**

Load News and events separately. Keep `items`, `loading`, and `error` per collection. Do not convert request failures into empty arrays. Add icon buttons with tooltips for create/import/edit/delete; preserve the existing activity-detail links.

- [ ] **Step 4: Implement News modal wiring**

The form edits title, type, summary, content, publication date, source URL, and optional event. Preserve input on error. On success, refresh only News and update its count.

- [ ] **Step 5: Verify GREEN and commit**

```bash
npm test -- src/components/scholar-detail/sections/RightSidebar.test.tsx
npx eslint src/components/scholar-detail/sections/RightSidebar.tsx src/components/scholar-detail/modals/EditNewsModal.tsx src/pages/ScholarDetailPage.tsx
git add src/components/scholar-detail/sections/RightSidebar.tsx src/components/scholar-detail/sections/RightSidebar.test.tsx src/components/scholar-detail/modals/EditNewsModal.tsx src/pages/ScholarDetailPage.tsx
git commit -m "feat: restore scholar news management"
```

### Task 5: Add Six Independent Achievement Tabs

**Files:**
- Modify: `src/components/scholar-detail/sections/AchievementsDetailCard.tsx`
- Modify: `src/components/scholar-detail/modals/EditAchievementsModal.tsx`
- Modify: `src/hooks/useScholarDetail.ts`
- Modify: `src/pages/ScholarDetailPage.tsx`
- Test: `src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx`

- [ ] **Step 1: Write failing tab and save tests**

Verify the title is `学者成就`, six tab labels and counts render, tabs wrap instead of horizontal clipping, each empty state is distinct, and research/open-source/position saves call only their own collection API.

```typescript
for (const label of ["代表论文", "专利", "获奖", "科研项目", "开源项目", "学术兼职"]) {
  expect(screen.getByRole("button", { name: new RegExp(label) })).toBeVisible();
}
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx
```

- [ ] **Step 3: Implement display tabs**

Use the approved adaptive wrapping layout. Render real repository links, project status/date/role, and position organization/period/current status. Keep compact typography consistent with the existing operational UI.

- [ ] **Step 4: Implement independent editing**

Extend the modal to six categories. Research projects no longer save through `joint_research_projects`. Each new collection submits independently and exposes its own saving/error state so partial success cannot be misreported as total success.

- [ ] **Step 5: Verify GREEN and commit**

```bash
npm test -- src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx
npx eslint src/components/scholar-detail/sections/AchievementsDetailCard.tsx src/components/scholar-detail/modals/EditAchievementsModal.tsx src/hooks/useScholarDetail.ts
git add src/components/scholar-detail/sections/AchievementsDetailCard.tsx src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx src/components/scholar-detail/modals/EditAchievementsModal.tsx src/hooks/useScholarDetail.ts src/pages/ScholarDetailPage.tsx
git commit -m "feat: add scholar achievement resource tabs"
```

### Task 6: Use the Real Event Batch API and Invalidate Activity Cache

**Files:**
- Modify: `src/services/activityApi.ts`
- Modify: `src/components/activity/ActivityBatchImportModal.tsx`
- Test: `src/services/activityApi.test.ts`

- [ ] **Step 1: Write failing service tests**

Assert event batch import makes one POST to `/api/events/batch`, returns row-level results, and create/update/delete invalidates caches for every affected scholar ID.

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/services/activityApi.test.ts
```

- [ ] **Step 3: Implement batch and invalidation**

Add `createActivitiesBatch(rows)` and `invalidateScholarActivityCache(ids)`. The modal submits one batch request and displays per-row outcomes. Mutations invalidate known old and new scholar memberships.

- [ ] **Step 4: Verify GREEN and commit**

```bash
npm test -- src/services/activityApi.test.ts
npx eslint src/services/activityApi.ts src/components/activity/ActivityBatchImportModal.tsx
git add src/services/activityApi.ts src/services/activityApi.test.ts src/components/activity/ActivityBatchImportModal.tsx
git commit -m "fix: use event batch API and refresh scholar activities"
```

### Task 7: Frontend Integration and Browser Verification

**Files:**
- Inspect: all frontend task changes
- Create: `tests/e2e/scholar-news-achievements.spec.ts`

- [ ] **Step 1: Run unit, scoped lint, and production build**

```bash
npm test
npx eslint src/services/scholarResourcesApi.ts src/utils/scholarNewsImport.ts src/components/scholar-detail src/hooks/useScholarDetail.ts src/services/activityApi.ts
npm run build
```

Expected: all pass. Record the four unrelated baseline full-lint failures separately.

- [ ] **Step 2: Write the Playwright workflow**

Cover News create/edit/delete/batch, News and activity error states, each achievement tab, repository link, current academic position, and modal scrolling. Use seeded backend data, not DOM-only mocks.

- [ ] **Step 3: Verify desktop and mobile rendering**

Run at 1600x1000 and 390x844. Capture screenshots and assert no overlap, clipped labels, horizontal page overflow, or inaccessible actions.

- [ ] **Step 4: Analyze graph changes**

```bash
node .gitnexus/run.cjs detect-changes --scope compare --base-ref main
```

Require a complete, non-truncated report; inspect HIGH, CRITICAL, and UNKNOWN paths.

- [ ] **Step 5: Commit verification**

```bash
git add tests/e2e/scholar-news-achievements.spec.ts
git commit -m "test: verify scholar news and achievement workflows"
```
