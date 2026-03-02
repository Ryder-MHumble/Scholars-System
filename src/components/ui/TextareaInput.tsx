/**
 * 文本区域输入框组件
 * 从 AddScholarPage:170-190 提取
 */

interface TextareaInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextareaInput({
  value,
  onChange,
  placeholder,
  rows = 4,
}: TextareaInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow placeholder-gray-300 resize-none"
    />
  );
}
