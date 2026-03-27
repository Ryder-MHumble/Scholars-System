/**
 * InstitutionAutocomplete Component
 *
 * An autocomplete input for selecting institutions with:
 * - Async search with debouncing
 * - "Create new" option for non-existent institutions
 * - Keyboard navigation
 * - Region and org_type badges
 */

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Building2 } from "lucide-react";
import { searchInstitutions, type InstitutionSearchResult } from "@/services/institutionApi";
import { cn } from "@/utils/cn";

interface InstitutionAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCreateNew?: (name: string) => Promise<string | void> | string | void;
  required?: boolean;
  placeholder?: string;
  region?: string; // Optional region filter
  orgType?: string; // Optional org_type filter
}

export function InstitutionAutocomplete({
  label,
  value,
  onChange,
  onCreateNew,
  required,
  placeholder = "输入机构名称搜索...",
  region,
  orgType,
}: InstitutionAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InstitutionSearchResult[]>([]);
  const [creating, setCreating] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (!value || value.length < 2) {
      setResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchInstitutions(value, {
          limit: 20,
          region,
          orgType,
        });
        setResults(response.results);
      } catch (error) {
        console.error("Failed to search institutions:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, region, orgType]);

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

  // Check if current value matches any result exactly
  const hasExactMatch = results.some(
    (r) => r.name.toLowerCase() === value.toLowerCase()
  );

  // Show "Create new" option if no exact match and value is not empty
  const showCreateNew = value.trim().length > 0 && !hasExactMatch;

  // Combined options: results + "create new" option
  const allOptions = showCreateNew
    ? [...results, { id: "__create_new__", name: value, entity_type: null, region: null, org_type: null, parent_id: null, scholar_count: 0 } as InstitutionSearchResult]
    : results;

  const handleSelect = async (option: InstitutionSearchResult) => {
    const isCreateNew = option.id === "__create_new__";
    const selectedName = option.name.trim();
    if (!selectedName) return;

    if (isCreateNew && onCreateNew) {
      setCreating(true);
      try {
        const createdName = await onCreateNew(selectedName);
        onChange((createdName ?? selectedName).trim());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "创建机构失败";
        alert(message);
      } finally {
        setCreating(false);
        setOpen(false);
      }
      return;
    }

    onChange(selectedName);
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
          disabled={creating}
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
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* Dropdown */}
      {open && (value.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {loading && (
            <div className="px-3 py-2 text-gray-400 text-center">
              搜索中...
            </div>
          )}

          {!loading && allOptions.length === 0 && value.length >= 2 && (
            <div className="px-3 py-2 text-gray-400 text-center">
              未找到匹配的机构
            </div>
          )}

          {!loading && allOptions.length > 0 && (
            <ul>
              {allOptions.map((option, i) => {
                const isCreateNew = option.id === "__create_new__";

                return (
                  <li
                    key={option.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void handleSelect(option);
                    }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={cn(
                      "px-3 py-2 cursor-pointer",
                      i === highlightIdx
                        ? "bg-primary-50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    {isCreateNew ? (
                      <div className="flex items-center gap-2 text-primary-600">
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">
                          {creating ? "创建中..." : `创建新机构: ${option.name}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate text-gray-700">
                            {option.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {option.region && (
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded",
                                option.region === "国内"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-purple-50 text-purple-600"
                              )}
                            >
                              {option.region}
                            </span>
                          )}
                          {option.org_type && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {option.org_type}
                            </span>
                          )}
                          {option.scholar_count > 0 && (
                            <span className="text-[10px] text-gray-400">
                              {option.scholar_count}人
                            </span>
                          )}
                        </div>
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
