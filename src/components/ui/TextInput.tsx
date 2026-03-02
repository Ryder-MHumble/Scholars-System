/**
 * 文本输入框组件
 * 从 AddScholarPage:142-167 提取
 */
import { cn } from "@/utils/cn";

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full px-3 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow placeholder-gray-300",
        error ? "border-red-300 ring-1 ring-red-300" : "border-gray-200",
      )}
    />
  );
}
