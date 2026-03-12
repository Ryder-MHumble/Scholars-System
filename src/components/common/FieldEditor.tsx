import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/utils/cn";

interface FieldEditorProps {
  value: string | number | undefined;
  onSave: (value: string) => Promise<void>;
  label: string;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  className?: string;
  displayFormatter?: (value: string | number | undefined) => string;
}

export function FieldEditor({
  value,
  onSave,
  label,
  type = "text",
  placeholder,
  className,
  displayFormatter,
}: FieldEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ""));
    setIsEditing(false);
  };

  const displayValue = displayFormatter
    ? displayFormatter(value)
    : value ?? placeholder ?? "未设置";

  if (!isEditing) {
    return (
      <div className={cn("group relative", className)}>
        <div className="text-sm text-gray-900">{displayValue}</div>
        <button
          onClick={() => {
            setEditValue(String(value ?? ""));
            setIsEditing(true);
          }}
          className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary-600 transition-all"
          title={`编辑${label}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {type === "textarea" ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 px-2 py-1 border border-primary-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={3}
          placeholder={placeholder}
          autoFocus
        />
      ) : (
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 px-2 py-1 border border-primary-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={placeholder}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && !saving) handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
        title="保存"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={handleCancel}
        disabled={saving}
        className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
        title="取消"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
