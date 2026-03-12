import { useState, useRef, useEffect } from "react";
import { Edit3, Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface ClickToEditWithAutocompleteProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  options: string[];
  placeholder?: string;
  className?: string;
}

/**
 * 点击编辑 + 下拉自动补全组件。
 * 单击文字进入编辑态，同时弹出下拉列表供快速选择；也可直接键盘输入。
 */
export function ClickToEditWithAutocomplete({
  value,
  onSave,
  options,
  placeholder = "-",
  className,
}: ClickToEditWithAutocompleteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = inputValue
    ? options.filter((o) => o.toLowerCase().includes(inputValue.toLowerCase()))
    : options;

  const showDropdown = isEditing && filtered.length > 0;

  const handleStart = () => {
    setInputValue(value);
    setHighlightIdx(-1);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setHighlightIdx(-1);
  };

  const commitSave = async (val: string) => {
    if (val === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(val);
      setIsEditing(false);
    } catch {
      // stay in edit mode
    } finally {
      setIsSaving(false);
      setHighlightIdx(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && filtered[highlightIdx]) {
        commitSave(filtered[highlightIdx]);
      } else {
        commitSave(inputValue);
      }
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={containerRef} className="relative flex items-start gap-1 flex-1">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            autoFocus
            onChange={(e) => {
              setInputValue(e.target.value);
              setHighlightIdx(-1);
            }}
            onKeyDown={handleKeyDown}
            className="w-full text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {showDropdown && (
            <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
              {filtered.map((opt, i) => (
                <li
                  key={opt}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitSave(opt);
                  }}
                  onMouseEnter={() => setHighlightIdx(i)}
                  className={cn(
                    "px-3 py-1.5 cursor-pointer truncate",
                    i === highlightIdx
                      ? "bg-primary-50 text-primary-700"
                      : "hover:bg-gray-50 text-gray-700",
                  )}
                >
                  {opt}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              commitSave(inputValue);
            }}
            disabled={isSaving}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            title="保存"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
            title="取消"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "cursor-pointer group inline-flex items-center gap-0.5 rounded px-0.5 -mx-0.5 transition-colors hover:bg-primary-50",
        className,
      )}
      onClick={handleStart}
      title="点击编辑"
    >
      {value ? (
        <span>{value}</span>
      ) : (
        <span className="text-gray-300 italic text-xs">{placeholder}</span>
      )}
      <Edit3 className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-50 text-primary-500" />
    </span>
  );
}
