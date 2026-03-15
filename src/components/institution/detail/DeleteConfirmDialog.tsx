import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

export function DeleteConfirmDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex gap-4 mb-5">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">删除机构</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              此操作不可撤销，请谨慎操作
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 mb-5">
          确定要删除{" "}
          <span className="font-bold text-slate-900">「{name}」</span> 吗？
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              await onConfirm();
            }}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            确认删除
          </button>
        </div>
      </motion.div>
    </div>
  );
}
