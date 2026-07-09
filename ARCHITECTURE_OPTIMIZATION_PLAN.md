# 情报引擎 + Scholars-System 服务体系架构优化方案

## 一、问题诊断

### 1.1 情报引擎被打挂的根因链

```
用户点 Excel 导出
  → fetchAllScholars() 启动
    → 第一页拿到 total_pages（可能 50-500 页）
    → 2 个 worker 并发，每页 100 条，逐页拉取
    → 每个请求打到后端 /api/scholars?page=N&page_size=100
    → 后端 asyncpg pool max_size=10/worker × 4 workers = 40 连接上限
    → DB 查询本身带 JOIN + 过滤 + 排序，单次 0.1-0.5s
    → 50 页 × 2 并发 = 100 个请求排队
    → 连接池饱和 → 新请求等待 → 30s 超时 → 503
    → 同时 APICallLogMiddleware 对每个请求做 fire-and-forget DB INSERT
    → 日志写入进一步竞争连接池
    → 雪崩
```

### 1.2 后端瓶颈点

| 组件 | 当前配置 | 问题 |
|------|---------|------|
| asyncpg pool | min=2, max=10 per worker | 4 workers × 10 = 40 连接，导出时不够用 |
| uvicorn workers | 4 | 正常够用，但导出时全部被占 |
| 请求超时 | 30s default, 120s export | 导出 50000 条时 120s 可能不够 |
| Rate limiting | **无** | 前端可无限并发请求 |
| API call log | 每请求 1 次 DB INSERT | 高并发时竞争连接池 |
| 慢查询日志 | >5s 告警 | 有但只是记录，无熔断 |

### 1.3 前端瓶颈点

| 组件 | 当前状态 | 问题 |
|------|---------|------|
| 列表分页 | ✅ PAGE_SIZE=20, 300ms debounce, AbortController | 正常，无问题 |
| 列表缓存 | ✅ 60s TTL + in-flight 去重 | 正常 |
| fetchScholarDetail | ❌ 无缓存、无超时、无 AbortSignal | 每次点学者详情都裸 fetch，后端慢就挂 |
| fetchAllScholars (导出) | ⚠️ 2 并发 × 500 页上限 | 主要杀手，但已有超时和并发限制 |
| 写操作 (PATCH/POST/DELETE) | ❌ 无超时、无重试 | 后端慢时前端无限等待 |
| University 缓存 | ✅ 30s TTL + in-flight 去重 | 好模式 |

---

## 二、优化方案（按优先级分层）

### P0 — 立即执行（前端，不依赖后端改动）

#### 2.1 fetchScholarDetail 加缓存 + 超时

```typescript
// 当前：裸 fetch，无缓存无超时
export async function fetchScholarDetail(urlHash: string): Promise<ScholarDetail> {
  const res = await fetch(`${BASE_URL}/api/scholars/${urlHash}`);
  ...
}

// 改为：cachedFetch + 超时 + AbortSignal
const SCHOLAR_DETAIL_CACHE_TTL_MS = 120_000; // 2 分钟

export async function fetchScholarDetail(
  urlHash: string,
  signal?: AbortSignal,
): Promise<ScholarDetail> {
  const url = `${BASE_URL}/api/scholars/${urlHash}`;
  const data = await cachedFetch<ScholarDetail>(url, {
    signal,
    ttl: SCHOLAR_DETAIL_CACHE_TTL_MS,
    timeoutMs: SCHOLAR_REQUEST_TIMEOUT_MS,
  });
  return normalizeScholarProjectFields(data);
}
```

**收益**：同一学者详情页 2 分钟内重复访问不再打后端。

#### 2.2 写操作加超时

所有 PATCH/POST/DELETE 操作从裸 `fetch()` 改为 `fetchWithTimeout()`：

```typescript
const SCHOLAR_WRITE_TIMEOUT_MS = 20_000;

export async function patchScholarRelation(urlHash: string, data: RelationPatch) {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/relation`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  ...
}
```

需要改的函数：patchScholarRelation, patchScholarDetail, postScholarUpdate, deleteScholarUpdate, patchScholarAchievements, createScholar, batchCreateScholars, createStudent, patchStudent, deleteStudent, deleteScholar。

#### 2.3 导出加 throttle + 进度反馈

```typescript
const SCHOLAR_EXPORT_CONCURRENCY = 1;  // 从 2 降到 1
const SCHOLAR_EXPORT_PAGE_SIZE = 50;   // 从 100 降到 50，减少单次 DB 压力
const SCHOLAR_EXPORT_DELAY_MS = 200;    // 每页之间加 200ms 间隔

// 在 fetchNextPage 的 while 循环里加 await sleep(SCHOLAR_EXPORT_DELAY_MS)
```

### P1 — 后端加固（需重启后端）

#### 2.4 连接池扩容

```python
# app/db/pool.py
"min_size": 2,   # → 5
"max_size": 10,  # → 20
```

4 workers × 20 = 80 连接上限。PostgreSQL 默认 max_connections=100，够用。

#### 2.5 API call log 降级

高并发时日志写入竞争连接池。改为：
- 用一个单独的小连接池（max_size=2）专门写日志
- 或者用内存队列 + 批量 flush

#### 2.6 加 rate limiting（可选）

用 slowapi 或自写中间件，对 `/api/scholars` 每秒最多 10 个请求。

### P2 — 架构层面（中长期）

#### 2.7 导出专用端点

后端加一个 `/api/scholars/export` 端点，直接生成 Excel 文件流返回，前端不需要拉全量数据。

#### 2.8 Redis 缓存层

热点查询（scholar list, scholar detail）加 Redis 缓存，减少 DB 压力。

#### 2.9 前端虚拟列表

如果列表渲染慢（不只是请求慢），引入 @tanstack/react-virtual 做虚拟滚动。

---

## 三、Codex 执行清单（P0 部分）

只改 `src/services/scholarApi.ts` 和 `src/services/requestUtils.ts`：

1. `fetchScholarDetail`: 改用 `cachedFetch`，加 `signal` 参数，TTL=120s
2. 所有写操作（11 个函数）：从 `fetch()` 改为 `fetchWithTimeout()`，超时 20s
3. `fetchAllScholars`: 并发从 2 降到 1，page_size 从 100 降到 50，每页间加 200ms delay
4. 导出函数加 `onProgress` 回调（可选）
5. **不改其他文件**，不改 UI 组件，不改 hooks

验证：`npm run build` 通过。
