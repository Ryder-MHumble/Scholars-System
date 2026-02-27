import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import PageTransition from "@/layouts/PageTransition";
import { changelog } from "@/data/changelog";
import { formatDate } from "@/utils/format";

export default function ChangeLogPage() {
  const [filter, setFilter] = useState<string>("");

  const filtered = filter
    ? changelog.filter((c) => c.action === filter)
    : changelog;

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">变更记录</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              共 {sorted.length} 条记录
            </p>
          </div>
          <div className="flex items-center gap-2">
            {["", "新增", "修改", "删除"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors",
                  filter === f
                    ? "bg-primary-50 text-primary-700 border-primary-200"
                    : "text-gray-500 border-gray-200 hover:bg-gray-50",
                )}
              >
                {f || "全部"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {sorted.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-4 p-4"
            >
              <div className="flex flex-col items-center mt-1">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    log.action === "新增"
                      ? "bg-emerald-500"
                      : log.action === "修改"
                        ? "bg-primary-500"
                        : "bg-red-500",
                  )}
                />
                {i < sorted.length - 1 && (
                  <div className="w-px h-full bg-gray-100 mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      log.action === "新增"
                        ? "bg-emerald-50 text-emerald-700"
                        : log.action === "修改"
                          ? "bg-primary-50 text-primary-700"
                          : "bg-red-50 text-red-700",
                    )}
                  >
                    {log.action}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {log.scholarName}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                {log.field && log.oldValue && log.newValue && (
                  <div className="mt-2 text-xs bg-gray-50 rounded-lg p-2 inline-flex items-center gap-2">
                    <span className="text-gray-500">{log.field}:</span>
                    <span className="line-through text-red-400">
                      {log.oldValue}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-emerald-600">{log.newValue}</span>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {formatDate(log.timestamp)} · {log.operator}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
