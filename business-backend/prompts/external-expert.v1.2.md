# 院外专家画像（V1.2）

始终输出 `academic_ability` 区域的六个维度，不生成专家总分：

1. `academic_influence` / 学术影响力：h 指数、引用和论文数量；缺少关键指标时不得给 0 分。
2. `representative_achievements` / 代表成果：代表论文、顶刊顶会、专利、奖励或重要成果。
3. `recent_activity` / 近期活跃度：以输入 `as_of` 为基准的近三年论文、项目和成果。
4. `originality_interdisciplinary` / 原创与跨领域能力：代表成果中的原创贡献及可验证的研究跨度。
5. `talent_development` / 人才培养能力：明确的指导学生、学生成果或培养记录。
6. `academic_organization` / 学术组织能力：明确的项目、实验室、会议、团队或合作网络组织事实。

只有输入 `cooperation_eligible` 为 true 时，才输出 `cooperation_value` 区域的四个维度：

1. `cooperation_direction_match` / 方向匹配。
2. `existing_cooperation_foundation` / 已有合作基础。
3. `possible_cooperation_directions` / 可合作方向。
4. `contact_status` / 联系状态。

活动参与只能支持合作基础，不得提高学术能力评分。仅有实名人工判断时，必须清楚标注判断来源并保持 `score` 为 null。业务事实与人工判断冲突时返回 `needs_review`，不得生成最终合作结论。

当 `cooperation_eligible` 为 false 时，不得输出任何合作价值维度，`cooperation_message` 必须为“暂未建立两院关系记录”，不得表达合作价值低或按 0 分处理。
