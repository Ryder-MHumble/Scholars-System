import { useState } from "react";
import { FolderKanban, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
  type ProjectSubcategory,
  getPrimaryCategoryForSubcategory,
} from "@/constants/projectCategories";

interface ProjectCategorySelectorProps {
  primaryCategory: string;
  subcategory: string;
  onSave: (primary: string, sub: string) => Promise<void>;
}

export function ProjectCategorySelector({
  primaryCategory,
  subcategory,
  onSave,
}: ProjectCategorySelectorProps) {
  const [selectedPrimary, setSelectedPrimary] = useState<string>(
    primaryCategory || ""
  );
  const [selectedSub, setSelectedSub] = useState<string>(subcategory || "");
  const [saving, setSaving] = useState(false);

  const handlePrimaryChange = (primary: ProjectCategory) => {
    setSelectedPrimary(primary);
    // Reset subcategory when primary changes
    setSelectedSub("");
  };

  const handleSubChange = (sub: ProjectSubcategory) => {
    setSelectedSub(sub);
    // Auto-set primary category based on subcategory
    const primary = getPrimaryCategoryForSubcategory(sub);
    if (primary) {
      setSelectedPrimary(primary);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedPrimary, selectedSub);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    selectedPrimary !== primaryCategory || selectedSub !== subcategory;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <FolderKanban className="w-5 h-5 text-primary-600" />
        <h3 className="text-base font-semibold text-gray-900">项目分类</h3>
      </div>

      {/* Primary Category Selection */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          一级分类
        </p>
        <div className="flex gap-2">
          {(Object.keys(PROJECT_CATEGORIES) as ProjectCategory[]).map(
            (category) => (
              <button
                key={category}
                onClick={() => handlePrimaryChange(category)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                  selectedPrimary === category
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                )}
              >
                {category}
              </button>
            )
          )}
          <button
            onClick={() => {
              setSelectedPrimary("");
              setSelectedSub("");
            }}
            className={cn(
              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
              !selectedPrimary
                ? "bg-gray-100 text-gray-600 border-gray-300"
                : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            清除
          </button>
        </div>
      </div>

      {/* Subcategory Selection */}
      {selectedPrimary && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            二级分类
          </p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_CATEGORIES[selectedPrimary as ProjectCategory].subcategories.map(
              (sub) => (
                <button
                  key={sub}
                  onClick={() => handleSubChange(sub as ProjectSubcategory)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition-all",
                    selectedSub === sub
                      ? "bg-primary-50 text-primary-700 border-primary-200 font-medium"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:bg-primary-50"
                  )}
                >
                  {sub}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            保存分类
          </button>
        </div>
      )}

      {/* Current Selection Display */}
      {!hasChanges && (primaryCategory || subcategory) && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            当前分类：
            {primaryCategory && (
              <span className="ml-1 font-medium text-primary-600">
                {primaryCategory}
              </span>
            )}
            {subcategory && (
              <>
                <span className="mx-1 text-gray-300">/</span>
                <span className="font-medium text-primary-600">
                  {subcategory}
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
