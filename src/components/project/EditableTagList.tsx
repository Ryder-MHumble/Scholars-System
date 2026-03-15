import { useState, useRef } from "react";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/utils/cn";

interface EditableTagListProps {
  items: string[];
  onUpdate: (items: string[]) => Promise<void>;
  color: "blue" | "purple" | "emerald";
  icon?: React.ReactNode;
  placeholder: string;
}

export function EditableTagList({
  items,
  onUpdate,
  color,
  icon,
  placeholder,
}: EditableTagListProps) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  };

  const handleAdd = async () => {
    const val = newItem.trim();
    if (!val || items.includes(val)) return;
    await onUpdate([...items, val]);
    setNewItem("");
    inputRef.current?.focus();
  };

  const handleRemove = async (index: number) => {
    await onUpdate(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border group/tag transition-colors",
              colorMap[color],
            )}
          >
            {icon}
            {item}
            <button
              onClick={() => handleRemove(i)}
              className="p-0.5 rounded-full opacity-0 group-hover/tag:opacity-100 hover:bg-black/10 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {adding ? (
          <div className="inline-flex items-center gap-1">
            <input
              ref={inputRef}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setAdding(false);
                  setNewItem("");
                }
              }}
              placeholder={placeholder}
              className="px-2 py-1 text-xs border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 w-28"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="p-1 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewItem("");
              }}
              className="p-1 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors border border-dashed border-gray-300"
          >
            <Plus className="w-3 h-3" />
            添加
          </button>
        )}
      </div>
    </div>
  );
}
