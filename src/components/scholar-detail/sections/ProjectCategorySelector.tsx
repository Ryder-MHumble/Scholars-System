import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Check,
  Sparkles,
  Link2,
  Edit3,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
  type ProjectSubcategory,
  getPrimaryCategoryForSubcategory,
  normalizeProjectSubcategoryLabel,
} from "@/constants/projectCategories";
import type { ScholarProjectTag } from "@/services/scholarApi";

interface ProjectCategorySelectorProps {
  projectTags: ScholarProjectTag[];
  onSave: (projectTags: ScholarProjectTag[]) => Promise<void>;
}

function normalizeProjectTags(tags: ScholarProjectTag[]): ScholarProjectTag[] {
  const normalized: ScholarProjectTag[] = [];
  const seen = new Set<string>();
  for (const raw of tags ?? []) {
    const category = String(raw.category ?? "").trim();
    const subcategory = normalizeProjectSubcategoryLabel(
      String(raw.subcategory ?? "").trim(),
    );
    const key = `${category.toLowerCase()}|${subcategory.toLowerCase()}`;
    if ((!category && !subcategory) || seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      category,
      subcategory,
      project_id: String(raw.project_id ?? "").trim() || undefined,
      project_title: String(raw.project_title ?? "").trim() || undefined,
    });
  }
  return normalized;
}

function buildProjectSignature(tags: ScholarProjectTag[]): string {
  return normalizeProjectTags(tags)
    .map((tag) => `${tag.category}|${tag.subcategory}`)
    .sort()
    .join("||");
}

export function ProjectCategorySelector({
  projectTags,
  onSave,
}: ProjectCategorySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPrimary, setSelectedPrimary] = useState<string>("");
  const [selectedProjectTags, setSelectedProjectTags] = useState<
    ScholarProjectTag[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const normalized = normalizeProjectTags(projectTags ?? []);
    setSelectedProjectTags(normalized);
    const first = normalized[0];
    setSelectedPrimary(first?.category ?? "");
  }, [projectTags]);

  const handlePrimaryChange = (primary: ProjectCategory) => {
    setSelectedPrimary(primary);
  };

  const handleSubToggle = (sub: ProjectSubcategory) => {
    const primary = getPrimaryCategoryForSubcategory(sub);
    const resolvedPrimary = primary ?? selectedPrimary;
    if (!resolvedPrimary) return;
    setSelectedPrimary(resolvedPrimary);

    setSelectedProjectTags((prev) => {
      const normalizedPrev = normalizeProjectTags(prev);
      const exists = normalizedPrev.some(
        (tag) => tag.category === resolvedPrimary && tag.subcategory === sub,
      );
      if (exists) {
        return normalizedPrev.filter(
          (tag) =>
            !(tag.category === resolvedPrimary && tag.subcategory === sub),
        );
      }
      return [...normalizedPrev, { category: resolvedPrimary, subcategory: sub }];
    });
  };

  const handleRemoveProjectTag = (tag: ScholarProjectTag) => {
    setSelectedProjectTags((prev) =>
      prev.filter(
        (item) =>
          !(
            item.category === tag.category &&
            normalizeProjectSubcategoryLabel(item.subcategory) ===
              normalizeProjectSubcategoryLabel(tag.subcategory)
          ),
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(normalizeProjectTags(selectedProjectTags));
    } finally {
      setSaving(false);
    }
  };

  const projectSignature = buildProjectSignature(selectedProjectTags);
  const originalProjectSignature = buildProjectSignature(projectTags ?? []);
  const hasChanges = projectSignature !== originalProjectSignature;
  const hasAnyCategory = selectedProjectTags.length > 0;

  const selectedProjectTagKeys = useMemo(
    () =>
      new Set(
        selectedProjectTags.map(
          (tag) =>
            `${tag.category.toLowerCase()}|${normalizeProjectSubcategoryLabel(
              tag.subcategory,
            ).toLowerCase()}`,
        ),
      ),
    [selectedProjectTags],
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 via-sky-50 to-cyan-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary-700" />
            <h3 className="text-base font-semibold text-gray-900">共建关系分类</h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
                hasAnyCategory
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-500 border-gray-200",
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {hasAnyCategory ? "共建导师" : "未建立关系"}
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              {isExpanded ? "收起" : "编辑"}
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  isExpanded && "rotate-180",
                )}
              />
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          学者与两院关系仅由项目分类定义，任一项目分类非空即视为共建导师。
        </p>
      </div>

      {isExpanded && (
        <div className="p-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              项目分类
            </p>
            <div className="mb-3">
              <p className="text-[11px] text-gray-500 mb-2">一级分类</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PROJECT_CATEGORIES) as ProjectCategory[]).map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => handlePrimaryChange(category)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-all",
                        selectedPrimary === category
                          ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:bg-primary-50",
                      )}
                    >
                      {category}
                    </button>
                  ),
                )}
              </div>
            </div>

            {selectedPrimary && (
              <div>
                <p className="text-[11px] text-gray-500 mb-2">二级分类</p>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_CATEGORIES[
                    selectedPrimary as ProjectCategory
                  ].subcategories.map((sub) => {
                    const key = `${selectedPrimary.toLowerCase()}|${normalizeProjectSubcategoryLabel(sub).toLowerCase()}`;
                    const selected = selectedProjectTagKeys.has(key);
                    return (
                      <button
                        key={sub}
                        onClick={() => handleSubToggle(sub as ProjectSubcategory)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-sm transition-all",
                          selected
                            ? "bg-primary-100 text-primary-700 border-primary-200 font-medium"
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:bg-primary-50",
                        )}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedProjectTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedProjectTags.map((tag, idx) => (
                  <span
                    key={`${tag.category}-${tag.subcategory}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs text-primary-700"
                  >
                    {tag.category}
                    {tag.subcategory ? ` / ${tag.subcategory}` : ""}
                    <button
                      type="button"
                      onClick={() => handleRemoveProjectTag(tag)}
                      className="text-primary-500 hover:text-primary-700"
                      aria-label="移除项目标签"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setSelectedPrimary("");
                setSelectedProjectTags([]);
              }}
              className="mt-4 text-xs text-gray-500 hover:text-gray-700"
            >
              清空项目分类
            </button>
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600 min-h-6">
          <Link2 className="w-3.5 h-3.5 text-gray-400" />
          {hasAnyCategory ? (
            <div className="flex flex-wrap gap-2">
              {selectedProjectTags.map((tag, idx) => (
                <span
                  key={`project-chip-${tag.category}-${tag.subcategory}-${idx}`}
                  className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-primary-700"
                >
                  项目：{tag.category}
                  {tag.subcategory ? ` / ${tag.subcategory}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <span>当前未配置项目分类</span>
          )}
        </div>

        {isExpanded && hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            保存关系分类
          </button>
        )}
      </div>
    </div>
  );
}
