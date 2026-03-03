import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ManagementRole } from "@/services/facultyApi";

interface ManagementRoleFormModalProps {
  role?: ManagementRole;
  onClose: () => void;
  onSubmit: (role: ManagementRole) => void;
}

export function ManagementRoleFormModal({
  role,
  onClose,
  onSubmit,
}: ManagementRoleFormModalProps) {
  const [form, setForm] = useState<ManagementRole>({
    role: role?.role ?? "",
    organization: role?.organization ?? "",
    start_year: role?.start_year ?? "",
    end_year: role?.end_year ?? "",
  });

  const handleSubmit = () => {
    if (!form.role?.toString().trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {role ? "编辑任职经历" : "添加任职经历"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              职务名称 *
            </label>
            <input
              value={form.role?.toString() ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="如：顾问委员会委员、兼职教授…"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              机构
            </label>
            <input
              value={form.organization?.toString() ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, organization: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="所在机构或单位"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                开始年份
              </label>
              <input
                type="text"
                value={form.start_year?.toString() ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_year: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="2020"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                结束年份
              </label>
              <input
                type="text"
                value={form.end_year?.toString() ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_year: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="留空表示至今"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.role?.toString().trim()}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            确定
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
