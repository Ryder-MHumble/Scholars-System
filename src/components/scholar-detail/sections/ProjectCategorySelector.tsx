import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Check,
  Edit3,
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
  variant?: "card" | "embedded";
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
  variant = "card",
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
  const embedded = variant === "embedded";

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
    <div
      className={cn(
        "border-gray-200",
        embedded
          ? "border-b bg-white"
          : "rounded-2xl bg-white shadow-sm",
      )}
    >
      <div
        className={cn(
          "border-b border-gray-100 bg-white",
          embedded ? "px-4 py-3" : "px-6 py-4",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary-700" />
            <h3 className="text-base font-semibold text-gray-900">共建关系分类</h3>
          </div>
          <button
            type="button"
            aria-label="编辑共建关系分类"
            title="编辑共建关系分类"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-700",
              isExpanded && "bg-primary-50 text-primary-700",
            )}
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
        {!isExpanded && hasAnyCategory && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedProjectTags.map((tag, idx) => (
              <span
                key={`project-chip-${tag.category}-${tag.subcategory}-${idx}`}
                className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs text-primary-700"
              >
                {tag.category}
                {tag.subcategory ? ` / ${tag.subcategory}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className={embedded ? "p-4" : "p-6"}>
          <div className="rounded-lg border border-gray-200 bg-white/80 p-4">
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

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedPrimary("");
                  setSelectedProjectTags([]);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                清空项目分类
              </button>
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {saving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  保存关系分类
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
