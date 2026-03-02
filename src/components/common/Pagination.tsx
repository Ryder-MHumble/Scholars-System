/**
 * 分页控件组件
 * 从 ScholarListPage 的两处分页代码提取（第 682-734 和 837-862 行）
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  showPageCount?: boolean;
  compact?: boolean;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  showPageCount = true,
  compact = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  if (compact) {
    // 简化版（仅上一页/下一页按钮）
    return (
      <div className="flex items-center justify-between">
        {showPageCount && (
          <p className="text-xs text-gray-500">
            第 {page} / {totalPages} 页，共 {totalItems} 条
          </p>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            上一页
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            下一页
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // 完整版（包含页码按钮）
  return (
    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
      <p className="text-xs text-gray-500">
        第 {page} / {totalPages} 页，共{" "}
        <span className="font-medium">{totalItems}</span> 条
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          上一页
        </button>
        {Array.from(
          { length: Math.min(totalPages, 7) },
          (_, i) => {
            let p: number;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "w-8 h-8 text-xs font-medium rounded-lg transition-colors",
                  p === page
                    ? "bg-primary-500 text-white"
                    : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50",
                )}
              >
                {p}
              </button>
            );
          },
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          下一页
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
