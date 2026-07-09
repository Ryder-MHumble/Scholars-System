# Scholars-System 服务优化方案

## 项目：Scholars-System
## 仓库路径：/home/ubuntu/workspace/Scholars-System
## 后端API：http://10.1.132.21:8001

---

## 一、当前架构问题分析

### 问题1：fetchScholarDetail 无缓存

**位置**：`src/services/scholarApi.ts` 第893-900行

```typescript
export async function fetchScholarDetail(urlHash: string): Promise<ScholarDetail> {
  const res = await fetch(`${BASE_URL}/api/scholars/${urlHash}`);
  // 无缓存、无超时、无去重
}
```

每次切换学者详情都直接打后端，如果用户频繁切换人，会产生大量并发请求。

**修复**：用已有的 `cachedFetch` 包裹，加 60s TTL 缓存 + 15s 超时。

### 问题2：fetchAllScholars 并发拉全量数据

**位置**：`src/services/scholarApi.ts` 第832-891行

导出 Excel 时调用 `fetchAllScholars()`，最多拉 500 页 x 100 条 = 5万条数据。虽然只在导出时触发，但如果用户在导出过程中继续操作页面，后端会被大量并发请求打满。

**修复**：
- 降低 SCHOLAR_LIST_MAX_PAGES 从 500 到 200（2万条够用了）
- 降低 SCHOLAR_LIST_FETCH_CONCURRENCY 从 2 到 1（串行拉取，不占后端连接）
- 加 AbortSignal 支持，导出取消时能中断
- 导出时禁用页面其他操作（全屏 loading overlay）

### 问题3：fetchScholarRelation / fetchScholarBasic 等子请求无超时

**位置**：`src/services/scholarApi.ts` 第902-963行

这些 PATCH/POST/DELETE 请求都用裸 `fetch()`，没有超时保护。如果后端响应慢，前端会一直等。

**修复**：统一用 `fetchWithTimeout` 包裹所有写操作。

### 问题4：学者详情页可能触发多个并发子请求

如果详情页组件同时调用了 fetchScholarDetail + fetchScholarRelation + fetchScholarBasic + fetchScholarUpdates 等，会产生 4-5 个并发请求。需要在前端做请求合并或串行化。

**修复**：在详情页 hook 中用 Promise.all 一次性发起所有子请求，或用 React Query / SWR 做批量请求管理。

---

## 二、本次 Codex 修改范围

只做低风险、高收益的改动：

1. **fetchScholarDetail 加缓存**（已确认 cachedFetch 工具函数可用）
2. **写操作加超时**（fetchScholarRelation 等用 fetchWithTimeout）
3. **fetchAllScholars 降低并发**（concurrency 2→1, max_pages 500→200）

不改动 useScholarList hook 的分页逻辑（已经是对的，PAGE_SIZE=20 服务端分页）。
不改动 institutionApi.ts（上次已经回退了 Codex 越界改动，保持现状）。

---

## 三、技术约束

1. 只改 `src/services/scholarApi.ts`
2. 不改 hooks、pages、components
3. 不加新依赖
4. 构建命令：`npm run build`（在 Scholars-System 目录）
5. 部署命令：`./deploy.sh restart`
6. 已有的 `cachedFetch` 和 `fetchWithTimeout` 在 `src/services/requestUtils.ts` 中
