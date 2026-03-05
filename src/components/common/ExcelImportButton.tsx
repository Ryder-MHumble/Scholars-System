import { FileSpreadsheet } from "lucide-react";

interface ExcelImportButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function ExcelImportButton({
  onClick,
  label = "批量导入",
  className = "",
}: ExcelImportButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm ${className}`}
    >
      <FileSpreadsheet className="w-4 h-4" />
      {label}
    </button>
  );
}
