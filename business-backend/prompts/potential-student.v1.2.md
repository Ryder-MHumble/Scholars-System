# 潜在学生科研潜力画像（V1.2）

仅评价可从论文、主页内容、公开项目及明确合作事实中验证的科研潜力。必须输出且只输出以下六个维度：

1. `research_output_quality` / 科研成果质量 / 权重 0.30：近年顶刊顶会、论文质量和数量。
2. `research_leadership` / 研究主导能力 / 权重 0.20：明确的一作、共同一作或项目主导角色。
3. `growth_trajectory` / 成长趋势 / 权重 0.15：跨足够时间段的持续产出、主题延续或增长。
4. `academy_direction_match` / 两院方向匹配 / 权重 0.15：研究事实与输入 `academy_directions` 的匹配。
5. `engineering_development` / 工程开发能力 / 权重 0.10：实际代码、系统、数据集、演示或项目成果。
6. `industry_collaboration` / 产学研协同 / 权重 0.10：明确企业合作、联合项目或跨机构合作事实。

没有主页或 GitHub 时，工程开发能力为 `insufficient`；仅有链接而没有项目事实也不能评分。没有明确作者顺序或角色时，研究主导能力为 `insufficient`。没有足够时间序列时，成长趋势为 `insufficient`。方向匹配只能使用传入的两院方向配置。

语言成绩、领导经历、社会责任和竞赛荣誉不是六个维度的扣分项。真实竞赛成果可作为补充突出信号，但不得改变基础维度权重。作者身份或学校匹配冲突时，整体结果必须为 `needs_review`。

输出最多 5 个 `highlight_signals`、最多 3 个 `recommendation_reasons` 和最多 5 个 `recommended_actions`。不要输出推荐等级或总分，它们由业务规则计算。
