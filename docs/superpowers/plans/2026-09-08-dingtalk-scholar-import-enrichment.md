# DingTalk Scholar Import and Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the 584-row DingTalk scholar workbook conservatively, canonicalize `高校导师`, repair verified academic metrics, enrich empty profile/resource fields from official homepages, and prove semantic correctness and idempotency.

**Architecture:** Keep permanent code changes limited to project-taxonomy normalization and backward-compatible filtering. Use a temporary, test-driven backend maintenance script for workbook parsing, identity resolution, dry-run/apply, academic-search, Firecrawl extraction, and audit output; remove that script and its temporary tests after a zero-change second dry-run. Database writes use existing PostgreSQL tables, per-row savepoints, deterministic provenance keys, and fill-empty/merge-only rules for existing records.

**Tech Stack:** React 19, TypeScript, FastAPI/Python, PostgreSQL/asyncpg, pytest, DingTalk DWS, `academic-search`, Firecrawl.

---

### Task 1: Canonicalize the frontend project label

**Files:**
- Modify: `src/constants/projectCategories.ts`
- Modify: `src/constants/navTree.ts`
- Modify: `src/hooks/useScholarList.ts`

- [ ] **Step 1: Run GitNexus impact analysis before editing**

Run:

```bash
node .gitnexus/run.cjs impact "normalizeProjectSubcategoryLabel" --direction upstream --repo .
node .gitnexus/run.cjs impact "PROJECT_SUBTAB_FILTER" --direction upstream --repo .
```

Expected: callers and affected flows are reported. Stop and warn before editing if either result is `HIGH` or `CRITICAL`; if `UNKNOWN`, confirm all references with `rg`.

- [ ] **Step 2: Establish the failing compile contract**

Change only the `ProjectSubcategory` type and category list to require `高校导师`, then run:

```bash
npm run build
```

Expected: FAIL at remaining literal uses of `学院学生高校导师`, demonstrating that all display/filter call sites must migrate together.

- [ ] **Step 3: Add canonical normalization and update display/filter literals**

Implement this alias in `src/constants/projectCategories.ts`:

```ts
const PROJECT_SUBCATEGORY_ALIAS_MAP: Record<string, ProjectSubcategory> = {
  科技育青委员会: "科技教育委员会",
  学院学生事务导师: "高校导师",
  学院学生高校导师: "高校导师",
};
```

Use `高校导师` in `PROJECT_CATEGORIES`, `ProjectSubcategory`, the navigation label, and `PROJECT_SUBTAB_FILTER.student_mentor`. Keep the route/subtab ID `student_mentor` stable.

- [ ] **Step 4: Verify frontend behavior**

Run:

```bash
npm run build
rg -n '学院学生高校导师' src
```

Expected: build exits 0; the old string appears only in the compatibility alias map.

### Task 2: Add backend canonical taxonomy and old-filter compatibility

**Files:**
- Modify: `/home/ubuntu/workspace/DeanAgent-Backend/config/project_taxonomy.yaml`
- Modify: `/home/ubuntu/workspace/DeanAgent-Backend/app/services/scholar/_filters.py`
- Test: `/home/ubuntu/workspace/DeanAgent-Backend/tests/test_scholar_multi_tag_filters.py`

- [ ] **Step 1: Run GitNexus impact analysis before editing**

Run from `/home/ubuntu/workspace/DeanAgent-Backend`:

```bash
node .gitnexus/run.cjs impact "apply_project_subcategory_filter" --direction upstream --repo .
```

Expected: the scholar list/filter path is reported. Treat `UNKNOWN` as unresolved and confirm references with `rg`.

- [ ] **Step 2: Write failing compatibility tests**

Add tests asserting that both input labels generate a query matching canonical and legacy stored memberships, while the canonical label remains `高校导师`:

```python
@pytest.mark.parametrize("requested", ["高校导师", "学院学生高校导师"])
def test_school_mentor_filter_accepts_canonical_and_legacy_labels(requested):
    sql, params = build_project_filter_for_test(requested)
    assert "高校导师" in params
    assert "学院学生高校导师" in params
```

Run:

```bash
./.venv/bin/python -m pytest tests/test_scholar_multi_tag_filters.py -q
```

Expected: FAIL because the current filter does not expand the legacy/canonical pair.

- [ ] **Step 3: Implement the minimal alias expansion**

Add one normalization map in `_filters.py` and expand only this pair:

```python
PROJECT_SUBCATEGORY_FILTER_ALIASES = {
    "高校导师": ("高校导师", "学院学生高校导师"),
    "学院学生高校导师": ("高校导师", "学院学生高校导师"),
}
```

Replace the taxonomy entry `学院学生高校导师` with `高校导师`. Do not change unrelated categories.

- [ ] **Step 4: Verify the focused backend tests**

Run:

```bash
./.venv/bin/python -m pytest tests/test_scholar_multi_tag_filters.py -q
```

Expected: all tests pass.

### Task 3: Build a deterministic workbook importer in TDD cycles

**Files:**
- Create temporarily: `/home/ubuntu/workspace/DeanAgent-Backend/scripts/maintenance/import_dingtalk_scholars_20260908.py`
- Create temporarily: `/home/ubuntu/workspace/DeanAgent-Backend/tests/test_import_dingtalk_scholars_20260908.py`
- Output: `/home/ubuntu/workspace/DeanAgent-Backend/output/dingtalk-scholar-import-20260908/dry-run.json`

- [ ] **Step 1: Write and run failing parser tests**

Cover these exact contracts: `【暂无相关信息】` becomes empty; role mappings match the approved table; `AI CORE`, `AI核心和基础`, `AI+自然科学`, `AI+社会科学`, and `AI+ST` are rejected as departments; `行业兼职` is split only on semicolons into `joint_management_roles`; homepage URLs are extracted from remarks.

Run:

```bash
./.venv/bin/python -m pytest tests/test_import_dingtalk_scholars_20260908.py -q
```

Expected: FAIL because the temporary importer module does not yet exist.

- [ ] **Step 2: Implement workbook parsing and field normalization**

Define immutable `SourceScholar`, `IdentityDecision`, and `ChangeProposal` dataclasses; `load_source_rows(path)`, `normalize_role_tags(value)`, `normalize_department(value)`, `parse_management_roles(value)`, and `extract_homepage_url(remarks)`. Preserve unmapped source fields, including gender because the live table has no physical `scholars.gender` column, under the provenance payload instead of mapping them to semantically adjacent scholar columns.

- [ ] **Step 3: Write and run failing identity tests**

Cover exact email, exact homepage, name plus first-level institution, ambiguous rejection, and forced creation for `张海宁/南开大学` and `王爽/西安电子科技大学`. Assert explicit IDs/evidence for 温健, 高孝天, 秦兵, 王川, and 刘偲 using the dry-run candidate inventory.

Run the same focused pytest command; expected: identity tests FAIL before implementation.

- [ ] **Step 4: Implement conservative identity resolution and change planning**

Use normalized email/homepage/name/institution evidence. Never accept name-only candidates when duplicates exist. For existing scholars, fill empty scalar fields, normalized-merge list fields, and add missing project memberships. For existing full-time/part-time mentors, never overwrite non-empty profile fields.

- [ ] **Step 5: Write and run failing persistence tests**

Use a fake async connection to assert per-row savepoints, deterministic source IDs, project membership deduplication, and rollback of only the failing scholar. Assert `行业兼职` never reaches `academic_titles`, current employment, or `position`.

- [ ] **Step 6: Implement dry-run/apply and execute the dry-run**

Run:

```bash
./.venv/bin/python scripts/maintenance/import_dingtalk_scholars_20260908.py --workbook /tmp/liangyuan-mentor-info.xlsx --output output/dingtalk-scholar-import-20260908/dry-run.json
```

Expected: 584 source rows, 583 unique names, 464 homepage rows, all rows resolved or explicitly rejected, no database mutations, and explicit decisions for the seven ambiguous rows.

- [ ] **Step 7: Audit the dry-run before writes**

Run structured checks over `dry-run.json` for duplicate target IDs with conflicting institutions, protected-field overwrites, placeholder persistence, invalid department labels, role/category mismatches, and name-only ambiguous matches.

Expected: zero unsafe proposals. Any non-zero result is fixed and dry-run repeated before apply.

### Task 4: Apply category and profile import transactionally

**Files:**
- Use temporary importer from Task 3
- Output: `/home/ubuntu/workspace/DeanAgent-Backend/output/dingtalk-scholar-import-20260908/apply.json`

- [ ] **Step 1: Capture exact pre-apply invariants**

Record category counts, protected full-time/part-time non-empty scalar hashes, and the total count of stored placeholders into `apply.json` before mutations.

- [ ] **Step 2: Apply in bounded batches**

Run:

```bash
./.venv/bin/python scripts/maintenance/import_dingtalk_scholars_20260908.py --workbook /tmp/liangyuan-mentor-info.xlsx --apply --output output/dingtalk-scholar-import-20260908/apply.json
```

Expected: existing 380 legacy memberships migrate to `高校导师`; approved workbook memberships are inserted; failures are isolated per scholar and listed with evidence.

- [ ] **Step 3: Verify immediate post-apply invariants**

Assert no stored `学院学生高校导师`, no protected non-empty scalar hash changed, no placeholder value was inserted, 贺樑 is in `教育培养/学术委员会`, and source memberships are either present or explicitly rejected.

### Task 5: Install and use academic-search for coherent metric repair

**Files:**
- Install: `/home/ubuntu/.agents/skills/academic-search/`
- Extend temporarily: `/home/ubuntu/workspace/DeanAgent-Backend/scripts/maintenance/import_dingtalk_scholars_20260908.py`
- Extend temporarily: `/home/ubuntu/workspace/DeanAgent-Backend/tests/test_import_dingtalk_scholars_20260908.py`
- Output: `/home/ubuntu/workspace/DeanAgent-Backend/output/dingtalk-scholar-import-20260908/metrics.json`

- [ ] **Step 1: Install and read the requested skill**

Run:

```bash
cd /home/ubuntu/.agents
npx clawhub install academic-search --registry https://skills.zgci.org
sed -n '1,260p' /home/ubuntu/.agents/skills/academic-search/SKILL.md
```

Expected: installation succeeds and the skill instructions identify the supported search/detail commands.

- [ ] **Step 2: Write failing metric acceptance tests**

Require one accepted profile to supply h-index, publication count, and citation count together. Reject same-name candidates without institution/homepage/email-domain/topic corroboration. For protected mentors, allow changes only for missing, negative, zero, or strongly contradicted metrics; for other imported categories, allow a fully evidenced current profile to replace stale values.

- [ ] **Step 3: Implement proposal generation and run metric dry-run**

Persist candidate ID, evidence reasons, score, old/new values, and timestamp in the report. Do not write any metric for rejected or partially identified profiles.

Expected: all 142 scholars with at least one invalid metric have either one coherent proposal or an explicit rejection reason.

- [ ] **Step 4: Apply accepted metrics and verify relationships**

Apply accepted proposals, set `metrics_updated_at` when any metric changes, and audit `h_index <= publications_count`, non-negative counts, one candidate ID per metric triplet, and no unexpected protected-record changes.

### Task 6: Crawl official homepages and populate normalized resources

**Files:**
- Extend temporarily: `/home/ubuntu/workspace/DeanAgent-Backend/scripts/maintenance/import_dingtalk_scholars_20260908.py`
- Extend temporarily: `/home/ubuntu/workspace/DeanAgent-Backend/tests/test_import_dingtalk_scholars_20260908.py`
- Output: `/home/ubuntu/workspace/DeanAgent-Backend/output/dingtalk-scholar-import-20260908/homepage-enrichment.json`
- Crawl cache: `/home/ubuntu/workspace/DeanAgent-Backend/output/dingtalk-scholar-import-20260908/firecrawl/`

- [ ] **Step 1: Write failing extraction and deduplication tests**

Use saved representative markdown fixtures to prove: scalar fields are fill-empty only; employment/visiting roles go to `scholar_academic_positions`; explicit projects go to `scholar_research_projects`; repositories go to `scholar_open_source_projects`; dated first-party news goes to `scholar_news` with `review_status=approved`; academic service remains in `joint_management_roles`.

- [ ] **Step 2: Crawl source homepages through the Firecrawl skill**

For each accepted public official URL run the configured command with bounded concurrency and retries:

```bash
python3 /home/ubuntu/.codex/skills/firecrawl/scripts/scrape.py '<URL>' --format markdown --output '<CACHE_PATH>'
```

Expected: every URL has either cached markdown plus retrieval metadata or a recorded failure; authentication barriers are not bypassed.

- [ ] **Step 3: Extract evidence-backed proposals and audit semantics**

Generate deterministic source record IDs and evidence payloads. Reject facts without an explicit source span. Check that organization/department, honor/role, publication/project, and news/biography fields are not interchanged.

- [ ] **Step 4: Apply normalized resources and profile fill-ins**

Use existing table constraints/service upserts. Deduplicate news by fingerprint/source key, projects by semantic identity, repositories by normalized URL, and positions by scholar/organization/title/start date. Record before/after counts in the report.

### Task 7: Prove idempotency, API behavior, and remove temporary code

**Files:**
- Delete: `/home/ubuntu/workspace/DeanAgent-Backend/scripts/maintenance/import_dingtalk_scholars_20260908.py`
- Delete: `/home/ubuntu/workspace/DeanAgent-Backend/tests/test_import_dingtalk_scholars_20260908.py`
- Keep: taxonomy compatibility code/tests and audit JSON outputs

- [ ] **Step 1: Run the second dry-run before deleting the tool**

Run the same workbook, academic, and homepage stages without `--apply`.

Expected: zero remaining database changes for identical accepted inputs; network failures remain explicit and do not become fabricated values.

- [ ] **Step 2: Verify API compatibility and canonical output**

Query `/api/scholars` with URL-encoded `project_category=教育培养` and each of `project_subcategory=高校导师` and `project_subcategory=学院学生高校导师`.

Expected: equal ID sets and counts; list/detail payloads return only canonical `高校导师` tags; 贺樑 reloads with `学术委员会`.

- [ ] **Step 3: Run the final anomaly audit**

Check same-name collisions, institution/department inversion, program-label departments, malformed email/phone/URL values, metric inconsistencies, orphaned resources, duplicate semantic keys, `行业兼职` leakage, placeholders, and protected-value hashes.

Expected: zero unexplained anomalies. Every intentional exception has scholar ID, source row, evidence URL, and reason in the audit output.

- [ ] **Step 4: Delete temporary scripts and tests**

Remove only the two task-owned temporary files listed above. Do not touch unrelated dirty files or existing maintenance scripts.

- [ ] **Step 5: Run permanent validation and graph change analysis**

Run:

```bash
cd /home/ubuntu/workspace/Scholars-System
npm run build
node .gitnexus/run.cjs detect-changes --scope all --repo .
cd /home/ubuntu/workspace/DeanAgent-Backend
./.venv/bin/python -m pytest tests/test_scholar_multi_tag_filters.py -q
node .gitnexus/run.cjs detect-changes --scope all --repo .
git status --short
```

Expected: build/tests exit 0; GitNexus results are complete, not partial/truncated; only scoped permanent code, tests, and audit artifacts remain from this task.
