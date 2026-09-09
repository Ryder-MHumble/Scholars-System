# 学者 News、学者成就与情报引擎联动设计

## 目标

修复学者详情页无法展示和手工维护 News 的完整链路，将“学术成就”更名为“学者成就”，新增“开源项目”和“学术兼职”分类，并使六个成就分类各自拥有独立的数据表。同步修复学院活动编辑时可能丢失学者关联的问题，并把微信情报引擎的结构化结果以可审核、可追溯、幂等的方式发布到学者 News。

## 已确认的信息架构

学者详情页中部保留“学者成就”卡片，包含六个自适应换行的 tab：

1. 代表论文
2. 专利
3. 获奖
4. 科研项目
5. 开源项目
6. 学术兼职

右侧关联卡片包含三个互相独立的 tab：

1. 合作学者
2. 学者 News
3. 学院活动

`学者 News` 表示与个人相关的新闻、任职变化、人才称号、重要成果等动态。`学院活动` 表示讲座、会议、论坛等结构化活动，可以关联多位学者。二者可以通过可选 `event_id` 建立引用，但不共享表、API 或生命周期。

## 数据模型

### 成就分类

已有表继续作为事实来源：

- `scholar_publications`
- `scholar_patents`
- `scholar_awards`

新增以下表：

- `scholar_research_projects`
- `scholar_open_source_projects`
- `scholar_academic_positions`

所有表使用稳定记录 ID，`scholar_id` 外键指向 `scholars.id` 并启用 `ON DELETE CASCADE`。新增表统一包含 `source_url`、`source_type`、`source_record_id`、`evidence JSONB`、`added_by`、`created_at` 和 `updated_at`，以支持人工录入与情报引擎数据共存。

科研项目字段为 `name`、`role`、`organization`、`project_type`、`start_date`、`end_date`、`status`、`description`。现有 `joint_research_projects` 仍保留为“两院关系”专用数据；迁移时把适合展示的历史记录复制到新表，并用来源标记保证可追溯和可重复执行。

开源项目字段为 `name`、`repository_url`、`homepage_url`、`platform`、`role`、`language`、`stars`、`forks`、`status`、`released_at` 和 `description`。`(scholar_id, repository_url)` 在仓库地址非空时唯一。

学术兼职字段为 `organization`、`department`、`title`、`position_type`、`start_date`、`end_date`、`is_current` 和 `description`。业务去重键为 `(scholar_id, organization, title, start_date)`。

### 学者 News

新增 `scholar_news` 表，包含：

- 内容：`id`、`scholar_id`、`title`、`summary`、`content`、`news_type`、`published_at`、`source_url`、可选 `event_id`
- 溯源：`source_type`、`source_id`、`source_record_id`、`extraction_id`、`raw_payload JSONB`、`evidence JSONB`
- 匹配：`match_status`、`match_method`、`match_confidence`、`matched_by`、`matched_at`
- 审核：`review_status`、`reviewed_by`、`reviewed_at`、`review_note`
- 审计：`content_fingerprint`、`added_by`、`created_at`、`updated_at`

人工新增记录默认 `approved`；批量导入中通过明确 `scholar_id` 匹配的记录默认 `approved`，通过姓名和机构推断的记录根据匹配结果进入 `approved` 或 `pending`。情报引擎生成的记录默认 `pending`，只有唯一高置信匹配可按配置自动批准。

同一来源记录以 `(source_type, source_record_id, scholar_id)` 保证幂等。没有外部 ID 时，用规范化后的学者 ID、标题、发布日期和来源 URL 生成 `content_fingerprint`。

旧 `recent_updates` 在过渡期仅作为详情响应中的只读兼容别名映射到已批准 News，不再写入旧 JSON 字段。旧 `scholar_activities` 的 63 条导入记录迁移到 `scholar_news` 后保留来源和原始字段，原表不再作为新写入目标。

## API 设计

News 使用以下资源接口：

- `GET /api/scholars/{scholar_ref}/news`
- `POST /api/scholars/{scholar_ref}/news`
- `POST /api/scholars/{scholar_ref}/news/batch`
- `PATCH /api/scholars/{scholar_ref}/news/{news_id}`
- `DELETE /api/scholars/{scholar_ref}/news/{news_id}`

三个新增成就分类分别使用相同的 collection 模式：

- `/api/scholars/{scholar_ref}/research-projects`
- `/api/scholars/{scholar_ref}/open-source-projects`
- `/api/scholars/{scholar_ref}/academic-positions`

每个 collection 提供列表、新增、批量新增或更新、单条修改和删除。已有论文、专利、获奖继续从独立表聚合；旧 `PATCH /achievements` 保留兼容，前端新编辑流程优先调用分类资源接口，避免一次全量替换覆盖其他来源的数据。

所有 `scholar_ref` 必须先解析为 canonical `scholars.id`。不存在的学者返回 404；歧义姓名匹配不自动选第一条。

批量接口接收结构化 rows，逐行返回：

- `created`
- `updated`
- `skipped`
- `pending_match`
- `failed`，包含行号和可展示错误

前端 CSV 导入器负责解析文件并提交 rows，不逐条发起网络请求。导入器支持 UTF-8 BOM、中文表头、带引号逗号、空行和重复行；单行失败不回滚其他有效行。

## 前端交互

右侧卡片默认打开“合作学者”。切换到“学者 News”后显示按发布时间倒序排列的已批准 News；人工维护者可以新增、编辑、删除和打开批量导入弹窗。加载失败必须显示错误与重试按钮，不能再静默转换成“0 条”。

News 表单包含标题、类型、摘要、正文、发布日期、来源 URL 和可选关联活动。批量导入弹窗提供模板下载、文件选择、解析预览、匹配状态、逐行错误和导入结果汇总。

“学院活动”继续链接现有活动详情页，但其加载错误同样需要显式显示。活动创建、修改、删除后必须失效相关学者的前端缓存。

“学者成就”卡片采用已确认的自适应换行 tab。每个 tab 显示自己的记录数、空态和列表；编辑弹窗使用相同六分类，并对新增三类提供单条表单与批量文本或 CSV 导入。保存时每个分类独立提交并显示分类级错误，避免一个请求成功、另一个失败却被当成整体成功。

## 情报引擎数据流

目标数据流为：

`social_posts -> LLM extraction -> scholar match candidate -> scholar_news pending -> review or auto-approval -> scholar detail`

匹配顺序为明确 scholar ID、主页或邮箱等强标识、姓名加机构唯一匹配、人工审核。姓名相同或机构不一致时必须进入 `pending_match`，不得继续自动创建重复学者。现有 `wechat-activity://姓名@机构` 只作为来源标识，不再直接决定 canonical scholar ID。

提取阶段扩展 News、开源项目和学术兼职结构，并保存原文证据。写入使用逐条 upsert，不调用会“删除全部再重建”的旧成就更新方法；`added_by` 为人工的记录不会被 crawler 覆盖。

对已完成的微信文章先查询 extraction 幂等键，未变化时跳过 LLM 调用，避免每日重复消耗。没有微信信源配置时不注册或不执行对应定时任务。高成本的领取、回写和触发接口纳入现有认证边界。

## 学院活动修复

`PATCH /api/events/{event_id}` 必须只更新请求中实际出现的字段。缺失的 `title`、`scholar_ids` 和 `is_past` 保持原值；显式传入空 `scholar_ids` 才清空关联。

学者过滤接受 canonical ID 与详情路由 ref，并统一解析后查询。迁移或修复脚本报告现有孤儿学者引用，不在无审核的情况下猜测重绑。

现有活动 CSV 导入前端改用后端 `/api/events/batch`，与 News batch 一样展示逐行结果。

## 错误处理与一致性

- 所有修改接口返回写入后的规范化记录。
- 批量导入按行建立保存点，部分失败可追踪且可重试。
- 删除接口校验记录属于 URL 中的学者，防止跨学者误删。
- 手工数据优先级高于 crawler；自动同步只能补充或更新同一来源生成的记录。
- 详情聚合读取失败时记录日志并让 API 返回可诊断错误，不把数据库异常伪装成空列表。
- 前端在 mutation 成功后刷新对应 collection；失败时保留用户输入并显示服务端错误。

## 迁移与发布

迁移脚本必须可重复执行，并注册到 schema migration manifest。发布顺序为：

1. 修复 events PATCH 并部署回归测试。
2. 创建四张新表并注册迁移。
3. 上线资源 API 和详情聚合兼容。
4. 迁移 `scholar_activities` 与可识别的历史 `recent_updates`，输出 created/skipped/failed 报告。
5. 上线前端三 tab 与六类成就 UI、News 批量导入。
6. 打开情报引擎 pending 写入和审核流程。
7. 在真实样本验证后再启用高置信自动批准。

不直接修改现有 55 组重复学者；本次输出重复候选审计清单，后续按现有数据维护流程合并。

## 验证标准

- 数据库存在六类成就各自对应的表，以及独立 `scholar_news` 表；迁移可重复执行。
- 学者 News 可新增、读取、编辑、删除，并能在刷新详情后保持一致。
- News CSV 重复导入不会产生重复记录，歧义匹配进入待审核，逐行错误可见。
- “吴郦军”详情页能区分真实空数据、加载失败、学者 News 和学院活动。
- events 仅修改摘要时不会清空标题、学者关联或 `is_past`。
- 微信情报生成 pending News，重复运行不重复调用 LLM 或插入记录，人工数据不被覆盖。
- 桌面与移动视口中六个成就 tab 不重叠或溢出，弹窗可完整滚动和提交。
- 后端专项测试、前端 build/lint、API 实际读写回环和 Playwright 页面验证全部通过。

## 非目标

- 本次不自动合并已有重复学者。
- 本次不把开源仓库拆成全局 canonical 项目加多学者关系；当前按学者维度建表，未来出现明显多学者复用需求再拆分。
- 本次不删除旧 `recent_updates` 或 `scholar_activities` 存储，先完成兼容迁移和稳定运行。
