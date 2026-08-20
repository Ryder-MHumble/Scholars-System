# Task: 合作学者(Coauthors)功能开发

## 需求概述

在学者详情页右侧栏的「学者活动」区域，新增「合作学者」tab。两个 tab（合作学者/学者活动）可切换，默认显示合作学者。合作学者数据存储在 scholars 表的 coauthors JSONB 列中。

## 数据库

- **已完成**: `scholars.coauthors` JSONB 列已添加（DEFAULT NULL）
- **数据格式**: JSON 数组，每个元素结构如下：
```json
{
  "aminer_id": "53f49d51dabfaebfa277b616",
  "name": "Richang Hong",
  "name_zh": "洪日昌",
  "h_index": 78,
  "n_citation": 27509,
  "n_pubs": 564,
  "avatar": "https://static.aminer.cn/upload/avatar/...",
  "position": "Professor",
  "affiliation": "School of Computer Science...",
  "affiliation_zh": "合肥工业大学...",
  "weight": 203
}
```
- 汪萌(aminer_id=56cb1891c35f4f3c6565176f)已有49条测试数据

## 后端改造 (DeanAgent-Backend)

### 文件清单

1. **app/schemas/scholar.py** — 添加 coauthors 字段
   - `ScholarListItem` (约L823附近): 添加 `coauthors: list[dict] | None = None`
   - `ScholarDetailResponse` (约L769附近): 添加 `coauthors: list[dict] | None = None`
   - `ScholarRecord` (约L398附近): 添加 `coauthors: list[dict] | None = None`

2. **app/services/scholar/_fast_query.py** — 在 `_BASE_LIST_SELECT_FIELDS` 中添加 `"coauthors"`

3. **app/services/scholar/_transformers.py** — 在 `_to_list_item` 函数中添加 coauthors 映射：
   ```python
   "coauthors": item.get("coauthors") or [],
   ```

4. **app/services/scholar/__init__.py** — 在 `select` / `legacy_map` / `patch` 中添加 `"coauthors"` 映射（参考 aminer_url 的模式，约L178/L237/L966附近）

### 后端验证

```bash
# Restart backend
cd /home/ubuntu/workspace/DeanAgent-Backend
# Kill old workers
pkill -f "uvicorn.*8001" 2>/dev/null; sleep 2
# Start new
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4 &

# Test API returns coauthors
curl -s "http://localhost:8001/api/scholars/?page=1&page_size=1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
scholars = data.get('data', {}).get('scholars', data.get('data', []))
if isinstance(scholars, list) and scholars:
    s = scholars[0]
    print(f'Name: {s.get(\"name\")}, coauthors: {len(s.get(\"coauthors\") or [])} items')
"
```

## 前端改造 (Scholars-System)

### 文件清单

1. **src/services/scholarApi/types.ts** — 添加 Coauthor 类型和字段
   - 新增 `CoauthorInfo` 接口：
   ```typescript
   export interface CoauthorInfo {
     aminer_id: string;
     name: string;
     name_zh: string;
     h_index: number | null;
     n_citation: number | null;
     n_pubs: number | null;
     avatar: string;
     position: string;
     affiliation: string;
     affiliation_zh: string;
     weight: number;
   }
   ```
   - `ScholarListItem` 和 `ScholarDetail` 中添加 `coauthors?: CoauthorInfo[]`

2. **src/services/scholarApi/helpers.ts** — 添加 coauthors 解析逻辑（参考 aminer_url 的解析模式）

3. **src/components/scholar-detail/sections/RightSidebar.tsx** — 改造「学者活动」区域
   - 在「学者活动」卡片内添加 tab 切换：`合作学者` | `学者活动`
   - **默认显示「合作学者」tab**
   - 合作学者 tab 内容：
     - 列表展示每位合作者：头像 + 姓名 + 中文名 + 职位 + 机构 + h_index + 论文数 + 引用数 + 合作权重
     - 头像用 `<img>` 加载 AMiner avatar URL，加 `referrerPolicy="no-referrer"`
     - 点击合作者可跳转到其 AMiner 主页 (`https://www.aminer.cn/profile/{aminer_id}`)
     - 按合作权重(weight)降序排列
     - 展示合作者总数
   - 学者活动 tab 保持原有逻辑不变
   - tab 切换用简单的 state (`useState<"coauthors" | "activities">("coauthors")`)
   - 样式与现有卡片风格一致（参考 AchievementsDetailCard.tsx 的 tab 样式）

### 前端验证

```bash
cd /home/ubuntu/workspace/Scholars-System
# TypeScript check
npx tsc --noEmit 2>&1 | head -20
# Build
node node_modules/vite/bin/vite.js build 2>&1 | tail -5
# Deploy
pkill -f "vite preview.*5174" 2>/dev/null; sleep 1
npx vite preview --host 0.0.0.0 --port 5174 &
```

## SCOPE BOUNDARY (CRITICAL)
- ONLY modify these files: scholar.py, _fast_query.py, _transformers.py, __init__.py (backend) + types.ts, helpers.ts, RightSidebar.tsx (frontend)
- Do NOT create new component files — keep the coauthor list inline in RightSidebar.tsx
- Do NOT modify any institution, project, or event related files
- Do NOT add new npm dependencies
- Do NOT reformat existing code unrelated to this feature
- Do NOT create new utility files
