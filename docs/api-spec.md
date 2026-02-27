# 学者数据库系统 — API 数据结构设计说明书

> 本文档为前端与后端对接的数据结构规范。前端当前使用静态 Mock 数据，后续接入真实后端时按此文档约定的接口格式返回数据即可无缝切换。

---

## 目录

1. [通用约定](#1-通用约定)
2. [数据实体](#2-数据实体)
3. [API 接口列表](#3-api-接口列表)
4. [枚举值定义](#4-枚举值定义)
5. [分页与筛选](#5-分页与筛选)
6. [错误响应](#6-错误响应)

---

## 1. 通用约定

| 项目 | 约定 |
|------|------|
| 基础路径 | `/api/v1` |
| 数据格式 | JSON（`Content-Type: application/json`） |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601（`2025-12-01T10:30:00Z`） |
| ID 格式 | 字符串，推荐 UUID v4 或自增 ID 的字符串形式 |
| 分页 | `page`（从 1 开始）+ `pageSize`（默认 20，最大 100） |
| 排序 | `sort` 字段名 + `order`（`asc` / `desc`） |

### 通用响应包装

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 分页响应包装

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "total": 76,
    "page": 1,
    "pageSize": 20,
    "totalPages": 4
  }
}
```

---

## 2. 数据实体

### 2.1 University（高校）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 高校唯一标识 |
| `name` | `string` | ✅ | 高校全称，如 "清华大学" |
| `shortName` | `string` | ✅ | 简称，如 "清华" |
| `logo` | `string` | ❌ | Logo 图片 URL |
| `location` | `string` | ✅ | 所在城市，如 "北京" |
| `website` | `string` | ❌ | 官网地址 |
| `departments` | `Department[]` | ✅ | 下属院系列表 |

### 2.2 Department（院系）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 院系唯一标识 |
| `universityId` | `string` | ✅ | 所属高校 ID（外键） |
| `name` | `string` | ✅ | 院系名称，如 "计算机科学与技术系" |
| `scholarCount` | `number` | ✅ | 该院系下学者数量 |
| `description` | `string` | ❌ | 院系简介 |
| `website` | `string` | ❌ | 院系官网 |

### 2.3 Scholar（学者）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 学者唯一标识 |
| `name` | `string` | ✅ | 中文姓名 |
| `nameEn` | `string` | ❌ | 英文姓名 |
| `avatarUrl` | `string` | ❌ | 头像图片 URL |
| `title` | `AcademicTitle` | ✅ | 职称（见枚举） |
| `universityId` | `string` | ✅ | 所属高校 ID（外键） |
| `departmentId` | `string` | ✅ | 所属院系 ID（外键） |
| `email` | `string` | ❌ | 电子邮箱 |
| `phone` | `string` | ❌ | 联系电话 |
| `homepage` | `string` | ❌ | 个人主页 URL |
| `googleScholar` | `string` | ❌ | Google Scholar 主页 URL |
| `dblp` | `string` | ❌ | DBLP 主页 URL |
| `researchFields` | `string[]` | ✅ | 研究方向标签列表 |
| `honors` | `AcademicHonor[]` | ✅ | 学术荣誉列表（见枚举） |
| `bio` | `string` | ❌ | 个人简介 |
| `hIndex` | `number` | ❌ | h-index 指数 |
| `citationCount` | `number` | ❌ | 总被引用次数 |
| `paperCount` | `number` | ❌ | 论文总数 |
| `createdAt` | `string` | ✅ | 创建时间（ISO 8601） |
| `updatedAt` | `string` | ✅ | 最后更新时间（ISO 8601） |

#### 附加字段（列表接口额外返回）

| 字段 | 类型 | 说明 |
|------|------|------|
| `universityName` | `string` | 所属高校名称（冗余，便于展示） |
| `departmentName` | `string` | 所属院系名称（冗余，便于展示） |

### 2.4 Paper（论文）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 论文唯一标识 |
| `title` | `string` | ✅ | 论文标题（中文或英文） |
| `titleEn` | `string` | ❌ | 英文标题 |
| `authors` | `string[]` | ✅ | 作者列表（按署名顺序） |
| `venue` | `string` | ✅ | 发表期刊/会议，如 "CVPR 2024" |
| `year` | `number` | ✅ | 发表年份 |
| `doi` | `string` | ❌ | DOI 编号 |
| `url` | `string` | ❌ | 论文链接 |
| `abstract` | `string` | ❌ | 摘要 |
| `citationCount` | `number` | ❌ | 被引用次数 |
| `isHighlight` | `boolean` | ❌ | 是否为代表性论文 |
| `scholarId` | `string` | ✅ | 关联学者 ID（外键） |

### 2.5 ResearchProject（科研项目）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 项目唯一标识 |
| `name` | `string` | ✅ | 项目名称 |
| `role` | `ProjectRole` | ✅ | 学者在项目中的角色（见枚举） |
| `fundingSource` | `string` | ✅ | 资助来源，如 "国家自然科学基金" |
| `amount` | `string` | ❌ | 资助金额（含单位），如 "80万元" |
| `startYear` | `number` | ✅ | 起始年份 |
| `endYear` | `number` | ❌ | 结束年份（空表示进行中） |
| `status` | `ProjectStatus` | ✅ | 项目状态（见枚举） |
| `description` | `string` | ❌ | 项目简介 |
| `scholarId` | `string` | ✅ | 关联学者 ID（外键） |

### 2.6 Patent（专利）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 专利唯一标识 |
| `title` | `string` | ✅ | 专利名称 |
| `patentNumber` | `string` | ✅ | 专利号 |
| `inventors` | `string[]` | ✅ | 发明人列表 |
| `filingDate` | `string` | ✅ | 申请日期（ISO 8601） |
| `grantDate` | `string` | ❌ | 授权日期 |
| `status` | `PatentStatus` | ✅ | 专利状态（见枚举） |
| `scholarId` | `string` | ✅ | 关联学者 ID（外键） |

### 2.7 AcademicExchange（学术交流）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 唯一标识 |
| `type` | `ExchangeType` | ✅ | 交流类型（见枚举） |
| `title` | `string` | ✅ | 活动名称 |
| `venue` | `string` | ❌ | 举办机构/会议名 |
| `location` | `string` | ❌ | 地点 |
| `startDate` | `string` | ✅ | 开始日期（ISO 8601） |
| `endDate` | `string` | ❌ | 结束日期 |
| `description` | `string` | ❌ | 描述 |
| `scholarId` | `string` | ✅ | 关联学者 ID（外键） |

### 2.8 AdvisedStudent（指导学生）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 唯一标识 |
| `name` | `string` | ✅ | 学生姓名 |
| `degree` | `StudentDegree` | ✅ | 学位类型（见枚举） |
| `startYear` | `number` | ✅ | 入学年份 |
| `endYear` | `number` | ❌ | 毕业年份（空表示在读） |
| `thesis` | `string` | ❌ | 毕业论文题目 |
| `currentPosition` | `string` | ❌ | 当前去向，如 "腾讯AI Lab 研究员" |
| `scholarId` | `string` | ✅ | 导师学者 ID（外键） |

### 2.9 ScholarRelationship（学者关系）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 唯一标识 |
| `fromScholarId` | `string` | ✅ | 关系发起方学者 ID |
| `toScholarId` | `string` | ✅ | 关系对象方学者 ID |
| `type` | `RelationshipType` | ✅ | 关系类型（见枚举） |
| `description` | `string` | ❌ | 关系描述 |

### 2.10 ChangeLogEntry（变更记录）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 唯一标识 |
| `scholarId` | `string` | ✅ | 变更的学者 ID |
| `scholarName` | `string` | ✅ | 学者姓名（冗余，便于展示） |
| `action` | `ChangeAction` | ✅ | 变更类型（见枚举） |
| `field` | `string` | ❌ | 变更字段名（修改时必填） |
| `oldValue` | `string` | ❌ | 变更前的值（修改时必填） |
| `newValue` | `string` | ❌ | 变更后的值（修改时必填） |
| `description` | `string` | ✅ | 变更描述 |
| `operator` | `string` | ✅ | 操作人 |
| `timestamp` | `string` | ✅ | 操作时间（ISO 8601） |

---

## 3. API 接口列表

### 3.1 高校与院系

#### `GET /api/v1/universities`

获取高校列表（含院系）。

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": "tsinghua",
      "name": "清华大学",
      "shortName": "清华",
      "location": "北京",
      "departments": [
        {
          "id": "tsinghua-cs",
          "universityId": "tsinghua",
          "name": "计算机科学与技术系",
          "scholarCount": 12
        }
      ]
    }
  ]
}
```

#### `GET /api/v1/universities/:universityId`

获取单个高校详情（含院系列表）。

#### `GET /api/v1/universities/:universityId/departments/:departmentId`

获取单个院系详情及其下学者摘要列表。

---

### 3.2 学者

#### `GET /api/v1/scholars`

分页获取学者列表。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | `number` | ❌ | 页码，默认 1 |
| `pageSize` | `number` | ❌ | 每页条数，默认 20 |
| `q` | `string` | ❌ | 搜索关键词（匹配姓名、研究方向） |
| `universityId` | `string` | ❌ | 按高校筛选 |
| `departmentId` | `string` | ❌ | 按院系筛选 |
| `title` | `string` | ❌ | 按职称筛选 |
| `honor` | `string` | ❌ | 按荣誉筛选 |
| `sort` | `string` | ❌ | 排序字段：`name`, `hIndex`, `citationCount`, `updatedAt` |
| `order` | `string` | ❌ | 排序方向：`asc`, `desc` |

**响应**: 分页包装，`items` 为 `ScholarWithInstitution[]`

#### `GET /api/v1/scholars/:scholarId`

获取学者详细信息。

**响应**: 包含学者基本信息 + 关联的高校/院系名称。

#### `POST /api/v1/scholars`

新增学者。

**请求体**: `Scholar` 对象（不含 `id`, `createdAt`, `updatedAt`）

**响应**: 新建的 `Scholar` 对象

#### `PUT /api/v1/scholars/:scholarId`

更新学者信息。

**请求体**: 部分 `Scholar` 字段（Partial）

**响应**: 更新后的 `Scholar` 对象

#### `DELETE /api/v1/scholars/:scholarId`

删除学者。

**响应**: `{ "code": 200, "message": "删除成功" }`

---

### 3.3 论文

#### `GET /api/v1/scholars/:scholarId/papers`

获取某学者的论文列表。

**请求参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | `number` | 页码 |
| `pageSize` | `number` | 每页条数 |
| `year` | `number` | 按年份筛选 |
| `isHighlight` | `boolean` | 只返回代表性论文 |

**响应**: 分页包装，`items` 为 `Paper[]`

#### `POST /api/v1/scholars/:scholarId/papers`

为学者添加论文。

#### `PUT /api/v1/papers/:paperId`

更新论文信息。

#### `DELETE /api/v1/papers/:paperId`

删除论文。

---

### 3.4 科研项目

#### `GET /api/v1/scholars/:scholarId/projects`

获取某学者的科研项目列表。

**请求参数**: `page`, `pageSize`, `status`（按状态筛选）

**响应**: 分页包装，`items` 为 `ResearchProject[]`

#### `POST /api/v1/scholars/:scholarId/projects`

新增科研项目。

#### `PUT /api/v1/projects/:projectId`

更新项目。

#### `DELETE /api/v1/projects/:projectId`

删除项目。

---

### 3.5 专利

#### `GET /api/v1/scholars/:scholarId/patents`

获取某学者的专利列表。

#### `POST /api/v1/scholars/:scholarId/patents`

新增专利。

#### `PUT /api/v1/patents/:patentId`

更新专利。

#### `DELETE /api/v1/patents/:patentId`

删除专利。

---

### 3.6 学术交流

#### `GET /api/v1/scholars/:scholarId/exchanges`

获取某学者的学术交流记录。

#### `POST /api/v1/scholars/:scholarId/exchanges`

新增学术交流。

#### `PUT /api/v1/exchanges/:exchangeId`

更新学术交流。

#### `DELETE /api/v1/exchanges/:exchangeId`

删除学术交流。

---

### 3.7 指导学生

#### `GET /api/v1/scholars/:scholarId/students`

获取某学者指导的学生列表。

#### `POST /api/v1/scholars/:scholarId/students`

新增指导学生。

#### `PUT /api/v1/students/:studentId`

更新学生信息。

#### `DELETE /api/v1/students/:studentId`

删除学生记录。

---

### 3.8 学者关系

#### `GET /api/v1/scholars/:scholarId/relationships`

获取某学者的所有学术关系。

**响应**:

```json
{
  "code": 200,
  "data": [
    {
      "id": "rel-1",
      "fromScholarId": "s-001",
      "toScholarId": "s-005",
      "type": "导师",
      "description": "博士生导师",
      "relatedScholar": {
        "id": "s-005",
        "name": "李明",
        "title": "副教授",
        "universityName": "清华大学"
      }
    }
  ]
}
```

#### `POST /api/v1/scholars/:scholarId/relationships`

新增学者关系。

#### `DELETE /api/v1/relationships/:relationshipId`

删除学者关系。

---

### 3.9 变更记录

#### `GET /api/v1/changelog`

获取系统级变更记录。

**请求参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | `number` | 页码 |
| `pageSize` | `number` | 每页条数 |
| `action` | `string` | 按操作类型筛选：`新增`, `修改`, `删除` |
| `scholarId` | `string` | 按学者筛选 |
| `startDate` | `string` | 起始日期 |
| `endDate` | `string` | 结束日期 |

**响应**: 分页包装，`items` 为 `ChangeLogEntry[]`

#### `GET /api/v1/scholars/:scholarId/changelog`

获取某学者的变更历史。

---

### 3.10 全局搜索

#### `GET /api/v1/search`

全局搜索（学者 + 高校 + 论文）。

**请求参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `q` | `string` | 搜索关键词（必填） |
| `type` | `string` | 限定搜索类型：`scholar`, `university`, `paper` |
| `limit` | `number` | 每类最大返回条数，默认 10 |

**响应**:

```json
{
  "code": 200,
  "data": {
    "scholars": [
      { "id": "s-001", "name": "张三", "title": "教授", "universityName": "清华大学", "departmentName": "计算机科学与技术系" }
    ],
    "universities": [
      { "id": "tsinghua", "name": "清华大学", "shortName": "清华", "departmentCount": 8 }
    ],
    "papers": [
      { "id": "p-001", "title": "基于深度学习的...", "authors": ["张三", "李四"], "venue": "CVPR 2024" }
    ]
  }
}
```

---

### 3.11 统计数据（Dashboard 用）

#### `GET /api/v1/stats/overview`

获取总览统计数据。

**响应**:

```json
{
  "code": 200,
  "data": {
    "totalScholars": 76,
    "totalUniversities": 9,
    "totalDepartments": 50,
    "totalPapers": 200,
    "totalHonors": 25,
    "scholarsByUniversity": [
      { "universityId": "tsinghua", "universityName": "清华大学", "shortName": "清华", "count": 12 }
    ],
    "researchFieldDistribution": [
      { "field": "人工智能", "count": 18 },
      { "field": "计算机视觉", "count": 12 }
    ],
    "recentScholars": [ ... ],
    "recentChanges": [ ... ]
  }
}
```

---

### 3.12 数据导出

#### `GET /api/v1/export`

导出数据。

**请求参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `scope` | `string` | 数据范围：`scholars`, `institutions`, `papers`, `all` |
| `format` | `string` | 导出格式：`json`, `csv`, `xlsx` |

**响应**: 文件流下载（`Content-Disposition: attachment`）

---

## 4. 枚举值定义

### AcademicTitle（职称）

| 值 | 说明 |
|---|---|
| `教授` | 正教授 |
| `副教授` | 副教授 |
| `助理教授` | 助理教授 |
| `讲师` | 讲师 |
| `研究员` | 正研究员 |
| `副研究员` | 副研究员 |
| `助理研究员` | 助理研究员 |
| `博士后` | 博士后研究人员 |

### AcademicHonor（学术荣誉）

| 值 | 说明 |
|---|---|
| `中国科学院院士` | CAS 院士 |
| `中国工程院院士` | CAE 院士 |
| `国家杰出青年科学基金获得者` | 杰青 |
| `国家优秀青年科学基金获得者` | 优青 |
| `长江学者特聘教授` | 长江学者 |
| `长江学者青年学者` | 青年长江 |
| `万人计划领军人才` | 万人计划 |
| `IEEE Fellow` | IEEE 会士 |
| `ACM Fellow` | ACM 会士 |

### RelationshipType（关系类型）

| 值 | 说明 |
|---|---|
| `导师` | 导师关系（from 是 to 的导师） |
| `学生` | 学生关系（from 是 to 的学生） |
| `合作者` | 科研合作关系 |
| `同事` | 同单位同事 |

### ChangeAction（变更操作）

| 值 | 说明 |
|---|---|
| `新增` | 新增学者或记录 |
| `修改` | 修改已有信息 |
| `删除` | 删除记录 |

### ProjectRole（项目角色）

| 值 | 说明 |
|---|---|
| `负责人` | 项目负责人 |
| `参与者` | 普通参与者 |
| `骨干成员` | 核心骨干 |

### ProjectStatus（项目状态）

| 值 | 说明 |
|---|---|
| `进行中` | 项目进行中 |
| `已结题` | 项目已完成 |

### PatentStatus（专利状态）

| 值 | 说明 |
|---|---|
| `已授权` | 已获授权 |
| `审查中` | 审查阶段 |
| `已公开` | 已公开发布 |

### ExchangeType（学术交流类型）

| 值 | 说明 |
|---|---|
| `会议报告` | 学术会议上的报告 |
| `特邀报告` | 受邀报告 |
| `访学` | 出国或跨校访学 |
| `学术访问` | 短期学术访问 |
| `合作研究` | 联合科研合作 |

### StudentDegree（学位类型）

| 值 | 说明 |
|---|---|
| `博士` | 博士研究生 |
| `硕士` | 硕士研究生 |
| `博士后` | 博士后研究人员 |

---

## 5. 分页与筛选

### 分页请求

所有列表接口均支持分页：

```
GET /api/v1/scholars?page=2&pageSize=20
```

### 筛选示例

```
GET /api/v1/scholars?universityId=tsinghua&title=教授&q=人工智能
```

### 排序示例

```
GET /api/v1/scholars?sort=hIndex&order=desc
```

### 组合使用

```
GET /api/v1/scholars?universityId=tsinghua&title=教授&sort=hIndex&order=desc&page=1&pageSize=12
```

---

## 6. 错误响应

所有错误均返回统一格式：

```json
{
  "code": 400,
  "message": "参数错误：universityId 不存在",
  "errors": [
    { "field": "universityId", "message": "无效的高校 ID" }
  ]
}
```

### 错误码

| HTTP 状态码 | 含义 |
|------------|------|
| `200` | 成功 |
| `201` | 创建成功 |
| `400` | 请求参数错误 |
| `404` | 资源不存在 |
| `409` | 资源冲突（如重复创建） |
| `422` | 数据验证失败 |
| `500` | 服务器内部错误 |

---

## 附录：前端数据文件映射

当前前端使用静态 Mock 数据，位于 `src/data/` 目录下。后续接入后端时，将这些静态导入替换为 API 调用即可：

| 前端文件 | 对应 API |
|----------|----------|
| `src/data/universities.ts` | `GET /api/v1/universities` |
| `src/data/scholars.ts` | `GET /api/v1/scholars` |
| `src/data/papers.ts` | `GET /api/v1/scholars/:id/papers` |
| `src/data/projects.ts` | `GET /api/v1/scholars/:id/projects` |
| `src/data/relationships.ts` | `GET /api/v1/scholars/:id/relationships` |
| `src/data/changelog.ts` | `GET /api/v1/changelog` |

建议后端接入时使用 `src/data/api.ts` 作为中间层，将所有 API 调用集中管理。
