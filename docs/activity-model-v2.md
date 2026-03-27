# 活动模型 V2（多学者活动）

## 目标
活动按“项目型实体”建模：
- 活动类型用于筛选（分类按钮 = `event_type` 过滤）
- 活动关联多个学者（N:N）
- 去掉主讲人、宣发方式、邮件邀请、录入人等字段

## 推荐数据结构

### events 表
- `id` (PK)
- `category` 一级分类（如 `research`）
- `event_type` 活动类型（如 `学科前沿讲座`）
- `series` 活动系列（可空）
- `series_number` 系列编号（可空）
- `title` 活动标题
- `abstract` 摘要（可空）
- `event_date` 活动时间
- `duration` 时长（可空）
- `location` 地点
- `photo_url` 活动照片 URL（可空）
- `created_at`
- `updated_at`

### event_scholars 关联表
- `event_id` (FK -> events.id)
- `scholar_id` (FK -> scholars.url_hash)
- 复合唯一索引：`(event_id, scholar_id)`

## API 请求体（前端已按此发送）

### POST /api/v1/events/
```json
{
  "category": "research",
  "event_type": "学科前沿讲座",
  "series": "XAI智汇讲坛",
  "series_number": "42",
  "title": "人工智能前沿技术探讨",
  "abstract": "...",
  "event_date": "2024-03-15T14:00",
  "duration": 2,
  "location": "清华大学主楼",
  "photo_url": "https://example.com/activity.jpg",
  "scholar_ids": ["scholar_001", "scholar_002"]
}
```

### PATCH /api/v1/events/{id}
同上字段，按需部分更新。

