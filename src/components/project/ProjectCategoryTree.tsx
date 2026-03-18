import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { PROJECT_CATEGORIES } from "@/constants/projectCategories";
import type {
  ProjectCategory,
  ProjectSubcategory,
} from "@/constants/projectCategories";

interface ProjectCategoryTreeProps {
  activeCategory: ProjectCategory | null;
  activeSubcategory: ProjectSubcategory | null;
  onSelectCategory: (category: ProjectCategory | null) => void;
  onSelectSubcategory: (
    category: ProjectCategory,
    subcategory: ProjectSubcategory,
  ) => void;
  categoryCounts: Record<string, number>;
  loading?: boolean;
}

export function ProjectCategoryTree({
  activeCategory,
  activeSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  categoryCounts,
  loading = false,
}: ProjectCategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<
    Set<ProjectCategory>
  >(new Set(Object.keys(PROJECT_CATEGORIES) as ProjectCategory[]));

  const toggleCategory = (category: ProjectCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">共建导师分类</h3>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-1">
            {/* All Categories */}
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                !activeCategory && !activeSubcategory
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <span>全部</span>
              <span className="text-xs text-gray-400">
                {Object.values(categoryCounts).reduce(
                  (sum, count) => sum + count,
                  0,
                )}
              </span>
            </button>

            {/* Category Tree */}
            {(
              Object.entries(PROJECT_CATEGORIES) as [
                ProjectCategory,
                (typeof PROJECT_CATEGORIES)[ProjectCategory],
              ][]
            ).map(([category, config]) => {
              const isExpanded = expandedCategories.has(category);
              const isActive =
                activeCategory === category && !activeSubcategory;
              const categoryCount = config.subcategories.reduce(
                (sum, sub) => sum + (categoryCounts[`${category}-${sub}`] || 0),
                0,
              );

              return (
                <div key={category}>
                  {/* Primary Category */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => onSelectCategory(category)}
                      className={cn(
                        "flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700 hover:bg-gray-50",
                      )}
                    >
                      <span>{config.label}</span>
                      <span className="text-xs text-gray-400">
                        {categoryCount}
                      </span>
                    </button>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && (
                    <div className="ml-5 mt-1 space-y-1">
                      {config.subcategories.map((subcategory) => {
                        const isSubActive =
                          activeCategory === category &&
                          activeSubcategory === subcategory;
                        const subCount =
                          categoryCounts[`${category}-${subcategory}`] || 0;

                        return (
                          <button
                            key={subcategory}
                            onClick={() =>
                              onSelectSubcategory(
                                category,
                                subcategory as ProjectSubcategory,
                              )
                            }
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                              isSubActive
                                ? "bg-primary-50 text-primary-700 font-medium"
                                : "text-gray-600 hover:bg-gray-50",
                            )}
                          >
                            <span>{subcategory}</span>
                            <span className="text-xs text-gray-400">
                              {subCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
