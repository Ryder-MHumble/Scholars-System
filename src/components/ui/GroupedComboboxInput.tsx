import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ComboboxGroup {
  label: string;
  options: string[];
}

interface GroupedComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  groups: ComboboxGroup[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  maxHeight?: string;
}

export function GroupedComboboxInput({
  value,
  onChange,
  groups,
  placeholder,
  error,
  disabled,
  clearable = true,
  maxHeight = "400px",
}: GroupedComboboxInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten and filter options
  const filtered = groups
    .map((group) => ({
      ...group,
      options: group.options.filter((opt) =>
        opt.toLowerCase().includes(searchText.toLowerCase()),
      ),
    }))
    .filter((group) => group.options.length > 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchText(value);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const totalOptions = filtered.reduce(
            (sum, g) => sum + g.options.length,
            0,
          );
          setHighlightedIndex((prev) =>
            prev < totalOptions - 1 ? prev + 1 : prev,
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          let currentIndex = 0;
          for (const group of filtered) {
            if (highlightedIndex < currentIndex + group.options.length) {
              const optionIndex = highlightedIndex - currentIndex;
              handleSelectOption(group.options[optionIndex]);
              break;
            }
            currentIndex += group.options.length;
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchText(value);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSelectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchText(option);
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchText("");
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setSearchText(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div
        className={cn(
          "relative flex items-center w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent focus-within:shadow-sm",
          error
            ? "border-red-300 ring-1 ring-red-300"
            : "border-slate-200 hover:border-slate-300",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          isOpen && "border-blue-400 ring-2 ring-blue-400/20",
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchText : value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder || "搜索..."}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 disabled:cursor-not-allowed"
        />

        {/* Clear Button */}
        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Chevron Icon */}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 ml-1 transition-transform flex-shrink-0",
            isOpen && "rotate-180 text-blue-500",
          )}
        />
      </div>

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ maxHeight, overflow: "auto" }}
        >
          {filtered.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filtered.map((group, groupIndex) => (
                <div key={group.label}>
                  {/* Group Header */}
                  <div className="px-4 py-2 bg-slate-50 sticky top-0 z-10">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      {group.label}
                    </p>
                  </div>

                  {/* Group Options */}
                  {group.options.map((option, optionIndex) => {
                    let globalIndex = 0;
                    for (let i = 0; i < groupIndex; i++) {
                      globalIndex += filtered[i].options.length;
                    }
                    globalIndex += optionIndex;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelectOption(option)}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        onMouseLeave={() => setHighlightedIndex(-1)}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between group",
                          globalIndex === highlightedIndex
                            ? "bg-blue-50 text-blue-900"
                            : "text-slate-700 hover:bg-slate-50",
                          option === value &&
                            "bg-blue-100 font-semibold text-blue-900",
                        )}
                      >
                        <span>{option}</span>
                        {option === value && (
                          <span className="text-xs font-semibold text-blue-600 px-2 py-1 bg-blue-200/50 rounded-full">
                            已选择
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              <div className="mb-1">🔍</div>
              没有找到匹配的选项
            </div>
          )}
        </div>
      )}
    </div>
  );
}
