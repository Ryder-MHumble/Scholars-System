/**
 * DepartmentAutocomplete Component
 *
 * An autocomplete input for selecting departments with:
 * - Loads departments for the selected university
 * - "Create new" option for non-existent departments
 * - Keyboard navigation
 */

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Building } from "lucide-react";
import { getDepartmentsForUniversity } from "@/services/institutionApi";
import { cn } from "@/utils/cn";

interface DepartmentAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCreateNew?: (
    departmentName: string,
    universityName: string,
  ) => Promise<string | void> | string | void;
  university: string; // Parent university name
  required?: boolean;
  placeholder?: string;
}

export function DepartmentAutocomplete({
  label,
  value,
  onChange,
  onCreateNew,
  university,
  required,
  placeholder = "输入院系名称...",
}: DepartmentAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load departments when university changes
  useEffect(() => {
    if (!university) {
      setDepartments([]);
      return;
    }

    setLoading(true);
    getDepartmentsForUniversity(university)
      .then(setDepartments)
      .catch((error) => {
        console.error("Failed to load departments:", error);
        setDepartments([]);
      })
      .finally(() => setLoading(false));
  }, [university]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Filter departments based on input
  const filtered = value
    ? departments.filter((d) => d.toLowerCase().includes(value.toLowerCase()))
    : departments;

  // Check if current value matches any department exactly
  const hasExactMatch = departments.some(
    (d) => d.toLowerCase() === value.toLowerCase()
  );

  // Show "Create new" option if no exact match and value is not empty
  const showCreateNew = value.trim().length > 0 && !hasExactMatch;

  // Combined options: filtered + "create new" option
  const allOptions = showCreateNew ? [...filtered, `__create_new__:${value}`] : filtered;

  const handleSelect = async (selected: string) => {
    const isCreateNew = selected.startsWith("__create_new__:");
    const displayName = isCreateNew
      ? selected.replace("__create_new__:", "").trim()
      : selected.trim();

    if (!displayName) return;

    if (isCreateNew && onCreateNew) {
      setCreating(true);
      try {
        const createdName = await onCreateNew(displayName, university);
        onChange((createdName ?? displayName).trim());
        setDepartments((prev) =>
          prev.includes(displayName) ? prev : [...prev, displayName],
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "创建院系失败";
        alert(message);
      } finally {
        setCreating(false);
        setOpen(false);
      }
      return;
    }

    onChange(displayName);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs text-gray-500 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          disabled={!university || creating}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlightIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIdx((i) => Math.min(i + 1, allOptions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIdx((i) => Math.max(i - 1, -1));
            } else if (
              e.key === "Enter" &&
              highlightIdx >= 0 &&
              allOptions[highlightIdx]
            ) {
              e.preventDefault();
              void handleSelect(allOptions[highlightIdx]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* Dropdown */}
      {open && university && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {loading && (
            <div className="px-3 py-2 text-gray-400 text-center">
              加载中...
            </div>
          )}

          {!loading && allOptions.length === 0 && (
            <div className="px-3 py-2 text-gray-400 text-center">
              {value ? "未找到匹配的院系" : "该机构暂无院系"}
            </div>
          )}

          {!loading && allOptions.length > 0 && (
            <ul>
              {allOptions.map((option, i) => {
                const isCreateNew = option.startsWith("__create_new__:");
                const displayName = isCreateNew
                  ? option.replace("__create_new__:", "")
                  : option;

                return (
                  <li
                    key={option}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void handleSelect(option);
                    }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={cn(
                      "px-3 py-1.5 cursor-pointer",
                      i === highlightIdx
                        ? "bg-primary-50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    {isCreateNew ? (
                      <div className="flex items-center gap-2 text-primary-600">
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">
                          {creating ? "创建中..." : `创建新院系: ${displayName}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{displayName}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
