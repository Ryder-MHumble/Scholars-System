# Scholar Detail Layout Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复学者详情页三栏边缘内容裁切，并将中栏调整为精简的共建关系、学术兼职和学术成果层级。

**Architecture:** 保持现有三栏与组件边界不变，只在页面容器上增加安全间距，在左侧链接组件内部用 React Portal 承载 Tooltip，并在现有中栏组件内移动标题。共建分类继续复用当前本地编辑状态和保存函数，仅精简只读层。

**Tech Stack:** React 19、TypeScript、Tailwind CSS、Vitest、Testing Library、React DOM Portal

---

### Task 1: Protect the independent scroll columns

**Files:**
- Modify: `src/pages/ScholarDetailPage.test.tsx`
- Modify: `src/pages/ScholarDetailPage.tsx`

- [ ] **Step 1: Write the failing test**

在现有响应式布局测试中增加断言：左列包含 `xl:pl-2`，右列包含 `xl:pr-2`，同时保留三个 `xl:overflow-y-auto` 和 `scrollbar-hide` 断言。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/pages/ScholarDetailPage.test.tsx`

Expected: FAIL，因为左右列尚未同时提供外边缘安全间距。

- [ ] **Step 3: Write minimal implementation**

为左栏滚动容器增加 `xl:pl-2`，为右栏滚动容器增加 `xl:pr-2`。不改变宽度、滚动职责或移动端布局。

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/pages/ScholarDetailPage.test.tsx`

Expected: PASS。

### Task 2: Render profile-link tooltips outside clipped ancestors

**Files:**
- Modify: `src/components/scholar-detail/sections/DetailLeftSidebar.test.tsx`
- Modify: `src/components/scholar-detail/sections/DetailLeftSidebar.tsx`

- [ ] **Step 1: Write the failing test**

补充带 `profile_url` 的学者数据，悬停“个人主页”链接后断言：页面出现 `role="tooltip"` 的“个人主页”，Tooltip 的父节点是 `document.body`，且左侧内容根容器不再带 `overflow-hidden`。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/scholar-detail/sections/DetailLeftSidebar.test.tsx`

Expected: FAIL，因为当前 Tooltip 嵌套在链接中且内容根容器会裁切浮层。

- [ ] **Step 3: Write minimal implementation**

从 `react-dom` 引入 `createPortal`。`ProfileLinkIcons` 保存当前 Tooltip 的标签与 fixed 坐标，在链接 `mouseenter`/`focus` 时读取 `getBoundingClientRect()`，将 Tooltip 放在按钮下方并对水平坐标做视口钳制；在 `mouseleave`/`blur` 时关闭。删除链接内部的绝对定位 Tooltip，并移除左侧内容根容器的 `overflow-hidden`。

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/scholar-detail/sections/DetailLeftSidebar.test.tsx`

Expected: PASS。

### Task 3: Simplify project categories and move the achievement heading

**Files:**
- Modify: `src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx`
- Modify: `src/components/scholar-detail/sections/AchievementsDetailCard.tsx`
- Create: `src/components/scholar-detail/sections/ProjectCategorySelector.test.tsx`
- Modify: `src/components/scholar-detail/sections/ProjectCategorySelector.tsx`

- [ ] **Step 1: Write the failing achievement hierarchy test**

在 `AchievementsDetailCard.test.tsx` 断言：页面不再出现“学者成就”；“学术成果”标题位于学术兼职之后、学术标识和成果标签页之前；只有一个名为“编辑学术成果”的按钮，点击仍调用 `onShowAchievementsModal`。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx`

Expected: FAIL，因为当前编辑入口仍位于顶部“学者成就”标题中。

- [ ] **Step 3: Write the failing project-category test**

创建 `ProjectCategorySelector.test.tsx`，使用一个项目标签渲染嵌入态，断言只读层包含标题、项目分类标签和一个图标编辑按钮，不包含“共建导师”“未建立关系”及解释文案；点击编辑图标后仍出现一级、二级分类编辑器。

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- --run src/components/scholar-detail/sections/ProjectCategorySelector.test.tsx`

Expected: FAIL，因为当前组件仍渲染关系状态、解释文案和文字型编辑按钮。

- [ ] **Step 5: Write minimal implementation**

删除 `AchievementsDetailCard` 顶部标题行，在学术兼职之后增加带 Trophy 图标的“学术成果”标题行和唯一图标编辑按钮。保留后续学术标识及标签页逻辑。

在 `ProjectCategorySelector` 删除 Sparkles/Link2/ChevronDown 及相关状态文案；标题行只保留标题和 `aria-label="编辑共建关系分类"` 的 Edit3 图标按钮；未展开时直接渲染已选项目分类 Tag，空列表不显示说明；展开时保留现有选择、清空、取消和保存交互。

- [ ] **Step 6: Run focused tests to verify they pass**

Run: `npm test -- --run src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx src/components/scholar-detail/sections/ProjectCategorySelector.test.tsx`

Expected: PASS。

### Task 4: Regression verification and service refresh

**Files:**
- Verify only: all changed source and test files

- [ ] **Step 1: Run the relevant regression suite**

Run: `npm test -- --run src/pages/ScholarDetailPage.test.tsx src/components/scholar-detail/sections/DetailLeftSidebar.test.tsx src/components/scholar-detail/sections/AchievementsDetailCard.test.tsx src/components/scholar-detail/sections/ProjectCategorySelector.test.tsx src/components/scholar-detail/sections/RightSidebar.test.tsx`

Expected: all tests PASS。

- [ ] **Step 2: Build production assets**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully。

- [ ] **Step 3: Analyze graph changes**

Run: `node .gitnexus/run.cjs detect-changes --scope all --repo .`

Expected: 输出本次前端组件变更的影响范围；任何 HIGH、CRITICAL、UNKNOWN 或截断结果均需明确报告并结合文本调用点复核。

- [ ] **Step 4: Restart and verify without a browser**

重启当前 `5174` 前端 preview 进程，使用 `curl` 验证页面返回 200，并确认响应引用本次新生成的资源文件。不得启动浏览器或 Playwright。
