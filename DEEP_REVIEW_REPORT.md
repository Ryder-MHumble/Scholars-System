# Scholars-System 深度评审报告

## 结论摘要

本次评审重点覆盖了 `src/services/scholarApi/`、`src/hooks/`、学者列表与详情数据流、导出逻辑、图片加载、路由拆分与错误处理。整体来看，系统已经具备较好的模块化基础，尤其是 `scholarApi` 已完成读写拆分、`requestUtils` 已提供超时/缓存/请求去重能力、TypeScript 已开启 `strict`。

但仍存在几类生产风险：

1. **导出接口缺少结果集上限保护**：`fetchAllScholars` 会遍历所有分页，当前在宽筛选条件下可能造成长时间等待、浏览器内存压力，甚至影响用户体验。
2. **详情页存在请求竞态风险**：在路由快速切换时，旧请求返回可能覆盖新状态，且卸载后仍可能触发状态更新。
3. **列表头像未做懒加载/失败降级**：大量列表下图片请求密集，失败图片会持续显示破损图标。
4. **路由级代码分割不足**：核心详情页均为同步引入，首屏与主包体积存在优化空间。
5. **服务层能力使用不一致**：`scholarApi` 内部大部分核心读请求已接入缓存/超时，但仓库仍存在大量模块外散落 `fetch`，后续应逐步收口到统一请求层。

## 优先级行动计划

### P0 - 已实施

1. **为学者 Excel 导出增加上限保护**
   - 在 `fetchAllScholars` 增加 `maxRecords` 选项，超限时直接给出明确错误。
   - 在 `useScholarList` 导出入口设置 2000 条上限，避免无筛选全量导出拖垮前端。
   - 原则：不改变现有 API 协议，只在前端增加安全阈值。

2. **修复学者详情页请求竞态与卸载更新问题**
   - `useScholarDetail` 改为使用 `AbortController` 驱动详情请求。
   - 路由切换或组件卸载时主动 abort，避免旧响应覆盖当前学者。

3. **优化头像加载体验**
   - `ScholarCard` 与 `ScholarTable` 中的头像改为 `loading="lazy"` + `decoding="async"`。
   - 图片加载失败时回退到姓名首字母头像，避免破损图占位。

4. **补齐路由级懒加载**
   - 在 `src/App.tsx` 使用 `lazyWithRetry` + `Suspense` 懒加载主要页面。
   - 保留原有 chunk 失败自动刷新机制，降低发版后空白页风险。

### P1 - 建议尽快跟进

1. **收紧 `scholarApi/index.ts` 的 barrel 导出边界**
   - 当前 `index.ts` 同时暴露常量、helper、读写 API、学生 API、全部类型。
   - 风险不是“立刻破坏”，而是未来容易让业务层依赖内部 helper 细节。
   - 建议后续把 helper 分为 `public helpers` 与 `internal helpers`，并逐步减少外部对 helper 的直接依赖。

2. **统一仓库请求层**
   - `src/services/projectApi.ts`、`src/services/activityApi.ts`、`src/services/institutionApi.ts`、`src/services/studentApi.ts` 等仍大量直接 `fetch`。
   - 当前只有 `scholarApi` 相对系统化使用了超时、缓存、去重。
   - 建议抽出通用 `jsonFetch / cachedJsonFetch / pagedFetch`，逐步替换散落请求。

3. **为“全量扫描型”接口建立显式上限与用途标记**
   - 目前 `fetchAllScholars`、`fetchAllInstitutions`、活动/学生部分 `page_size=500` 扫描逻辑都属于“后台型前端任务”。
   - 建议后续为这些 API 增加 `unsafe/full-scan` 命名或 options 标记，便于评审时快速识别。

### P2 - 中期优化

1. **拆分超大 Hook / 页面**
   - `src/hooks/useScholarList.ts` 约 763 行，已承担 URL 状态、筛选、分页、删除、导出、请求协调等多重职责。
   - 建议拆分为：`useScholarFilters`、`useScholarQueryState`、`useScholarExport`、`useScholarDeletion`。

2. **控制大列表渲染成本**
   - 当前学者列表分页为 20 条，暂不构成必须虚拟滚动的瓶颈。
   - 但机构、学生、活动等页面存在更大体量数据与复杂卡片，应按热点页面评估引入窗口化渲染。

3. **减少 render 路径中的即时计算**
   - `ScholarTable` 中存在 IIFE + 每行即时计算标签/导师类别。
   - 当前 20 条分页影响可接受，但在更复杂列表中建议上移到 memoized selector。

## 分项评审明细

### 1. Data Service Architecture

- **模块拆分状态良好**：`scholarRead.ts` / `scholarWrite.ts` / `studentApi.ts` / `helpers.ts` / `types.ts` 职责基本清晰。
- **barrel 暴露面偏大**：`src/services/scholarApi/index.ts` 当前会重新导出 helper 与常量，未来容易泄漏内部实现边界。
- **类型质量总体较好**：本次检查未发现 `scholarApi` 核心层显式 `any`；项目已开启 `strict`，这是明显加分项。
- **统一请求能力未完全覆盖**：
  - 已覆盖：`fetchScholarList`、`fetchScholarDetail`、`fetchScholarStats` 等。
  - 未统一：`fetchScholarUniversities` 仍直接 `fetch`；仓库其他服务文件也大量直接 `fetch`。
- **可配置性**：`src/services/apiBase.ts` 已支持 `VITE_API_BASE_URL`，满足环境化需求；但生产 fallback 仍是硬编码内网地址，建议后续在部署流程中强制提供 env，减少环境漂移风险。

### 2. Frontend Data Fetching & Rendering

- **分页逻辑总体正确**：`useScholarList` 使用服务端分页，`page` 来源于 URL 参数，具备较稳定的可分享性。
- **Excel 导出原先存在无界风险**：`fetchAllScholars` 会按页拉全量数据，现已加上前端保护上限。
- **详情页旧响应覆盖新状态风险已修复**：通过 abort 避免快速切页产生错位数据。
- **未发现明显“每次 render 都 fetch”问题**：从重点路径看，主要问题不是缺失依赖数组，而是少数异步请求未做 abort/统一封装。

### 3. Performance & User Experience

- **列表虚拟化**：当前学者页单页 20 条，暂不必为此引入复杂虚拟滚动。
- **图片加载**：已补充懒加载和失败回退，能减少网络噪声与视觉破损。
- **代码分割**：已对主要详情页接入 `lazyWithRetry`；这是本次最直接的首屏收益点之一。
- **构建分包策略**：`vite.config.ts` 已做 vendor chunk 手工拆分，方向正确；后续建议结合构建产物持续观察 `xlsx`、`recharts` 与详情页 chunk 体积。

### 4. API Integration & Error Handling

- **错误展示**：学者列表已有基础错误提示，但导出失败仍使用 `alert`，属于可接受但体验一般的临时方案。
- **竞态控制**：详情请求已修复；列表请求是否存在旧请求覆盖问题，取决于 `useScholarList` 内多个 effect 的协作，建议后续继续补 abort 策略。
- **重试逻辑**：页面懒加载层面已有一次性 reload retry；API 请求层尚未建立 endpoint 级重试矩阵，当前更偏保守。

### 5. Maintainability

- **超大文件较多**：
  - `src/pages/StudentDetailPage.tsx:1` 超 1600 行
  - `src/pages/InstitutionDetailPage.tsx:1` 超 1600 行
  - `src/hooks/useScholarList.ts:1` 超 700 行
- **共享模式提取空间大**：列表页筛选、分页、批量导入、错误处理模式已经重复出现，后续适合抽取复用 hook 或容器组件。
- **CSS 一致性**：当前以 Tailwind utility 为主，风格较一致，未见明显“死 CSS 文件”扩张问题。

## 本次已实施改动

1. `src/services/scholarApi/types.ts`
   - 新增 `FetchAllScholarsOptions` 类型。
   - 目的：为“全量抓取”能力补充显式控制参数，减少隐式扩展。

2. `src/services/scholarApi/scholarRead.ts`
   - `fetchAllScholars` 改为接收 options。
   - 新增 `maxRecords` 限制，超限时给出业务可理解错误。

3. `src/hooks/useScholarList.ts`
   - 导出入口增加 `EXPORT_MAX_RECORDS = 2000`。
   - 目的：防止全量导出在生产环境下成为长阻塞操作。

4. `src/hooks/useScholarDetail.ts`
   - 为详情请求接入 `AbortController`。
   - 目的：避免旧请求覆盖新页面状态，减少卸载后更新 state 的风险。

5. `src/components/common/ScholarCard.tsx`
   - 头像图片增加懒加载、异步解码、失败降级。

6. `src/components/common/ScholarTable.tsx`
   - 表格头像图片增加懒加载、异步解码、失败降级。

7. `src/App.tsx`
   - 主要页面改为 `lazyWithRetry` 懒加载。
   - 外围补充 `Suspense` fallback。

## 验证要求

- 按要求执行 `npm run build`。
- 预期：构建成功，退出码为 0。

## 后续建议（不在本次补丁内）

1. 为 `useScholarList` 增加 abortable list request，彻底收敛列表竞态。
2. 将 `fetchScholarUniversities` 迁移到 `fetchWithTimeout`/`cachedFetch` 统一栈。
3. 抽象通用请求客户端，逐步替换其他 service 文件中的散落 `fetch`。
4. 拆分超大页面与超大 hook，优先从 `StudentDetailPage`、`InstitutionDetailPage`、`useScholarList` 开始。
