/**
 * 选择框组件
 * 从 AddScholarPage:193-224 提取
 */
import { cn } from "@/utils/cn";

interface SelectInputProps {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export function SelectInput({
  value,
  onChange,
  children,
  placeholder,
  error,
  disabled,
}: SelectInputProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        error ? "border-red-300 ring-1 ring-red-300" : "border-gray-200",
        !value ? "text-gray-300" : "text-gray-800",
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}
