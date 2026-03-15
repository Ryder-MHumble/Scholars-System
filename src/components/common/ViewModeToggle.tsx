import { cn } from "@/utils/cn";
import type { ComponentType } from "react";

export interface ViewModeOption<T extends string> {
  value: T;
  icon: ComponentType<{ className?: string }>;
  title: string;
}

interface ViewModeToggleProps<T extends string> {
  value: T;
  options: ViewModeOption<T>[];
  onChange: (value: T) => void;
}

export function ViewModeToggle<T extends string>({
  value,
  options,
  onChange,
}: ViewModeToggleProps<T>) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
      {options.map(({ value: optValue, icon: Icon, title }) => (
        <button
          key={optValue}
          onClick={() => onChange(optValue)}
          title={title}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            value === optValue
              ? "bg-white shadow-sm text-primary-600"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
