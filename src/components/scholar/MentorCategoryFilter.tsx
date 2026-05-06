import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ComboboxGroup } from "@/components/ui/GroupedComboboxInput";

interface MentorCategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  groups: ComboboxGroup[];
  placeholder?: string;
}

export function MentorCategoryFilter({
  value,
  onChange,
  groups,
  placeholder = "选择项目分类",
}: MentorCategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const commonGroup = groups.find((group) => group.label === "通用");
  const categoryGroups = useMemo(
    () => groups.filter((group) => group.label !== "通用"),
    [groups],
  );

  const selectedCategory = useMemo(() => {
    const matched = categoryGroups.find((group) =>
      group.options.includes(value),
    );
    return matched?.label ?? categoryGroups[0]?.label ?? "";
  }, [categoryGroups, value]);

  const [activeCategory, setActiveCategory] = useState(selectedCategory);

  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeGroup =
    categoryGroups.find((group) => group.label === activeCategory) ??
    categoryGroups[0];
  const activeSubcategories =
    activeGroup?.options.filter((option) => option !== activeGroup.label) ?? [];
  const displayValue = value || "全部";

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const clearSelection = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange("全部");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border bg-white px-3 text-left text-sm transition-all",
          isOpen
            ? "border-primary-400 ring-2 ring-primary-100"
            : "border-gray-200 hover:border-gray-300",
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              displayValue ? "text-gray-800" : "text-gray-400",
            )}
          >
            {displayValue || placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-gray-400 transition-transform",
              isOpen && "rotate-180 text-primary-500",
            )}
          />
        </button>
        {value && value !== "全部" && (
          <button
            type="button"
            onClick={clearSelection}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="清除共建导师类别筛选"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(540px,calc(100vw-32px))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <div className="grid grid-cols-2 gap-2">
              {(commonGroup?.options ?? ["全部", "全部共建导师"]).map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex h-9 items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors",
                      value === option || (!value && option === "全部")
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <span>{option}</span>
                    {(value === option || (!value && option === "全部")) && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="grid min-h-[232px] grid-cols-[160px_1fr]">
            <div className="border-r border-gray-100 bg-gray-50/70 p-2">
              {categoryGroups.map((group) => {
                const isActive = group.label === activeCategory;
                const isSelected = value === group.label;
                return (
                  <button
                    key={group.label}
                    type="button"
                    onMouseEnter={() => setActiveCategory(group.label)}
                    onFocus={() => setActiveCategory(group.label)}
                    onClick={() => handleSelect(group.label)}
                    className={cn(
                      "mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      isActive || isSelected
                        ? "bg-white text-primary-700 shadow-sm"
                        : "text-gray-600 hover:bg-white hover:text-gray-900",
                    )}
                  >
                    <span className="font-medium">{group.label}</span>
                    {isSelected ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs text-gray-400">
                        {group.options.length - 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {activeGroup?.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    选择一级分类或具体项目分类
                  </p>
                </div>
                {activeGroup && value === activeGroup.label && (
                  <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                    已选一级
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {activeSubcategories.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex min-h-10 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      value === option
                        ? "border-primary-200 bg-primary-50 text-primary-700"
                        : "border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50",
                    )}
                  >
                    <span className="min-w-0 truncate">{option}</span>
                    {value === option && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
