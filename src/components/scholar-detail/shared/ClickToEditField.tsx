import { useState } from "react";
import { Edit3, Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

// ─── 点击编辑字段组件 ─────────────────────────────────────────────
interface ClickToEditFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  renderValue?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function ClickToEditField({
  value,
  onSave,
  placeholder = "-",
  multiline = false,
  renderValue,
  className,
  inputClassName,
}: ClickToEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleStart = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch {
      // stay in edit mode on error
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-start gap-1 flex-1", className)}>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            rows={3}
            className={cn(
              "flex-1 text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none",
              inputClassName,
            )}
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className={cn(
              "flex-1 text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500",
              inputClassName,
            )}
          />
        )}
        <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            title="保存"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCancel}
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
        renderValue !== undefined ? (
          renderValue
        ) : (
          <span>{value}</span>
        )
      ) : (
        <span className="text-gray-300 italic text-xs">{placeholder}</span>
      )}
      <Edit3 className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-50 text-primary-500" />
    </span>
  );
}
