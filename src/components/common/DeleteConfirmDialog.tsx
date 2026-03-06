import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  itemName?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isDangerous = true,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div
              className={cn(
                "px-6 py-4 flex items-center justify-between",
                isDangerous
                  ? "bg-gradient-to-r from-red-50 to-red-40 border-b border-red-100"
                  : "bg-gradient-to-r from-amber-50 to-amber-40 border-b border-amber-100"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isDangerous
                      ? "bg-red-100"
                      : "bg-amber-100"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "w-5 h-5",
                      isDangerous
                        ? "text-red-600"
                        : "text-amber-600"
                    )}
                  />
                </div>
                <h2 className={cn(
                  "text-lg font-bold",
                  isDangerous
                    ? "text-red-900"
                    : "text-amber-900"
                )}>
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isDangerous
                    ? "hover:bg-red-100 text-red-500"
                    : "hover:bg-amber-100 text-amber-500",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className={cn(
                "text-sm mb-4",
                isDangerous
                  ? "text-gray-700"
                  : "text-gray-600"
              )}>
                {description}
              </p>

              {itemName && (
                <div className={cn(
                  "px-3 py-2 rounded-lg mb-6",
                  isDangerous
                    ? "bg-red-50 border border-red-100"
                    : "bg-amber-50 border border-amber-100"
                )}>
                  <p className={cn(
                    "text-sm font-medium break-words",
                    isDangerous
                      ? "text-red-900"
                      : "text-amber-900"
                  )}>
                    {itemName}
                  </p>
                </div>
              )}

              <div className={cn(
                "px-4 py-3 rounded-lg",
                isDangerous
                  ? "bg-red-50 border border-red-100"
                  : "bg-amber-50 border border-amber-100"
              )}>
                <p className={cn(
                  "text-xs font-medium flex items-center gap-2",
                  isDangerous
                    ? "text-red-700"
                    : "text-amber-700"
                )}>
                  <span>⚠️</span>
                  此操作不可撤销，请谨慎确认
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  "px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                  isDangerous
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isLoading ? "删除中..." : "确认删除"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
