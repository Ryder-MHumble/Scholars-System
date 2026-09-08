# DingTalk Scholar Import and Enrichment Design

## Objective

Import the 584 rows from the DingTalk workbook `两院导师信息.xlsx` into the
existing scholar system without damaging manually maintained mentor data. Add
missing education project memberships, normalize the school-mentor label to
`高校导师`, repair academic metrics with identity-checked academic-search
results, and enrich empty scholar fields and normalized resource tables from
official personal homepages crawled through Firecrawl.

## Confirmed Source State

- Workbook node: `X6GRezwJlA3zpE5ZCg43dDRP8dqbropQ`.
- Primary sheet: `专家库`, 584 rows and 583 unique names.
- Audit sheet: `信息核查报告`, 98 rows.
- Rows with a homepage URL in `备注`: 464.
- Existing database matches: 577 rows have a high-confidence identity match;
  seven rows require explicit candidate resolution.
- Two source identities, 张海宁 at 南开大学 and 王爽 at 西安电子科技大学,
  have same-name database candidates but no candidate for the correct
  institution. They must be created rather than attached to the wrong person.
- Existing education memberships before import: 全职导师 94, 兼职导师 151,
  学院学生高校导师 380, 学术委员会 0, 教学委员会 0.

The source placeholder `【暂无相关信息】` and blank strings are always treated as
missing values. They are never persisted as facts.

## Canonical Project Taxonomy

`高校导师` becomes the canonical stored and displayed subcategory. Existing
`学院学生高校导师` memberships are migrated to `高校导师`. Backend filters keep
`学院学生高校导师` as a read-compatible alias so old URLs and clients continue to
work, but all returned tags and new writes use the canonical name.

Source roles map as follows:

| Source role | Target category | Target subcategory |
| --- | --- | --- |
| 学院导师 | 教育培养 | 全职导师 |
| 兼职导师 | 教育培养 | 兼职导师 |
| 高校导师 | 教育培养 | 高校导师 |
| 学位委员会委员 / 主席 / 副主席 | 教育培养 | 学术委员会 |
| 教学委员会委员 / 主任 | 教育培养 | 教学委员会 |

Unknown role fragments such as `西湖大学兼职博导` do not create an invented
project category. A recognized role in the same cell, such as `高校导师`, is
still imported.

## Identity Resolution

Candidate selection is deterministic and conservative:

1. Exact normalized email match.
2. Exact normalized homepage match.
3. Exact name plus normalized first-level institution match.
4. Exact name plus institution and department evidence.
5. Explicit resolution for the seven ambiguous rows, recorded in the dry-run
   report with the chosen scholar ID and evidence.

A name-only match is insufficient when multiple candidates exist. When no
candidate represents the source institution, create a new scholar with a
deterministic source ID. Never repurpose an unrelated same-name AMiner record.

## Field Mapping

| Source field | Target | Rule |
| --- | --- | --- |
| 姓名 | `scholars.name` | Required identity field |
| 性别 | `scholars.gender` | Normalize to existing enum; fill empty only |
| 所在单位 | `scholars.university` | Resolve to a first-level institution |
| 所在院系/部门 | `scholars.department` | Write only a verified second-level organization |
| 职称 | `scholars.position` | Fill empty only for existing scholars |
| 个人简介 | `scholars.bio` | Fill empty only; strip source formatting artifacts |
| 研究领域 | `scholars.research_areas` | Normalize and deduplicate |
| 研究方向标签 | `scholars.keywords` | Normalize and deduplicate |
| 邮箱 | `scholars.email` | Validate and fill empty only |
| 手机 | `scholars.phone` | Fill empty only |
| 备注中的个人主页 | `scholars.profile_url` | Fill empty only; always retain as crawl evidence |
| 行业兼职 | `scholars.joint_management_roles` | Parse and deduplicate as academic-service roles |
| 最高学历 / 最高学位 | provenance metadata | Do not invent an education institution or year |
| 一级学科名称 | provenance metadata | Do not mislabel it as a research area |
| 是否博导 / 是否有海外经历 | provenance metadata | Preserve without mapping to unrelated booleans |

`AI CORE`, `AI核心和基础`, `AI+自然科学`, `AI+社会科学`, `AI+ST`, and similar
program group labels are not departments. A source `所在单位` value that also
contains a college name is split only when the institution hierarchy provides
an unambiguous first-level parent and second-level child.

For `行业兼职`, split on semicolons only. If an organization and role can be
identified without guessing, store them separately. Otherwise keep the full
text as the role and leave the organization empty. Never put industry or
academic service in `academic_titles`, which is reserved for honors such as
院士, 杰青, or 长江学者.

## Preservation Rules

Existing 全职导师 and 兼职导师 records have the highest protection level:

- Never replace a non-empty scalar profile value from the workbook or homepage.
- Merge list fields by normalized semantic key and retain existing entries.
- Add only missing project memberships.
- Do not replace manually maintained relation fields.
- Store source and matching evidence without replacing unrelated provenance.

The same fill-empty policy applies to other existing scholars unless a field is
explicitly an academic metric. Newly created committee scholars can receive all
verified workbook and homepage values.

## Academic Metrics

Install `academic-search` with the requested registry command from a working
directory that places it at `~/.agents/skills/academic-search`. Read its installed
instructions before use.

An academic profile is accepted only when name evidence and at least one of
institution, official homepage, email domain, or research-topic evidence agree.
Same-name candidates without corroboration are rejected. Persist the selected
profile ID, evidence, score, source timestamp, and old/new metric values.

For protected full-time and part-time mentors, replace only missing, negative,
zero, or strongly contradicted metrics. For the remaining imported categories,
accepted current academic-search metrics may replace stale values. Update
`metrics_updated_at` whenever any of h-index, publication count, or citation
count changes. Never combine the three metrics from different candidate
profiles.

## Homepage Enrichment

Use the configured Firecrawl skill for public official homepages. The workbook
URL is the primary source; an existing verified official homepage may be used
when the workbook lacks one. Authentication barriers are not bypassed.

Extract only facts evidenced on the fetched page:

- Empty scalar profile fields in `scholars`.
- Education entries with an explicit institution and degree or year.
- Representative publications with identifiable titles.
- Awards and patents with identifiable names.
- Academic service from the workbook into `joint_management_roles`.
- Employment and visiting appointments into `scholar_academic_positions`.
- Explicit research projects into `scholar_research_projects`.
- Repositories into `scholar_open_source_projects`.
- Dated first-party news into `scholar_news` with `review_status=approved`.

All normalized resource rows carry the scholar ID, source URL, source type,
deterministic source record ID, evidence payload, and importer identity. News is
deduplicated by fingerprint/source key, research projects by semantic identity,
repositories by normalized repository URL, and positions by scholar,
organization, title, and start date. Homepage content is not dumped into generic
JSON fields when a normalized table exists.

## Execution and Failure Handling

The importer has a dry-run mode and an apply mode. Dry-run produces counts,
identity decisions, field changes, protected-field skips, category changes,
metric proposals, and rejected candidates. Apply uses bounded batches and
per-row savepoints so one bad row does not partially corrupt another scholar.

No database backup is created, per the established enrichment preference.
Idempotency is proved by a second dry-run after apply showing zero remaining
changes for identical inputs. Network failures are reported and retried only in
bounded fashion; a failed crawl never produces fabricated data.

## Validation

Completion requires all of the following evidence:

- No stored project tag uses `学院学生高校导师`; old-name API filters return the
  same scholar set as `高校导师`.
- 贺樑 appears under `教育培养 / 学术委员会` with the existing scholar identity.
- Expected committee and mentor memberships from all 584 rows are present or
  listed with an explicit rejection reason.
- No source placeholder is stored as profile data.
- No program group label is inserted as a department.
- No `行业兼职` item is inserted into `academic_titles` or current employment.
- Existing non-empty protected profile values remain unchanged.
- Every changed academic metric has one accepted identity and one coherent
  three-metric source.
- Normalized homepage resources retain source evidence and contain no duplicate
  semantic keys.
- API list/detail responses reload the written data correctly.
- A final anomaly report covers same-name collisions, institution/department
  inversion, malformed contacts, implausible metric relationships, and semantic
  field leakage.

Temporary test, crawl, and one-off import scripts created for this operation are
deleted after verification. Reusable production taxonomy and compatibility code
remain. Existing unrelated dirty-worktree changes are not reverted or included
in task commits.
