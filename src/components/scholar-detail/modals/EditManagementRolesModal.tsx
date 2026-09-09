import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, RefreshCw, Trash2, X } from "lucide-react";
import type { ManagementRole } from "@/services/scholarApi";
import { parseManagementRolesFromText } from "@/utils/textParsers";

interface EditManagementRolesModalProps {
  roles: ManagementRole[];
  onClose: () => void;
  onSubmit: (records: ManagementRole[]) => void | Promise<void>;
}

function roleKey(role: ManagementRole): string {
  return `${String(role.organization ?? "").trim().toLocaleLowerCase()}\u0000${String(role.role ?? "").trim().toLocaleLowerCase()}`;
}

function mergeRoles(
  existing: ManagementRole[],
  incoming: ManagementRole[],
): ManagementRole[] {
  const merged: ManagementRole[] = [];
  const indexes = new Map<string, number>();

  for (const raw of [...existing, ...incoming]) {
    const role = {
      organization: String(raw.organization ?? "").trim(),
      role: String(raw.role ?? "").trim(),
      start_year: String(raw.start_year ?? "").trim(),
      end_year: String(raw.end_year ?? "").trim(),
    };
    if (!role.organization && !role.role) continue;
    const key = roleKey(role);
    const index = indexes.get(key);
    if (index === undefined) {
      indexes.set(key, merged.length);
      merged.push(role);
      continue;
    }
    merged[index] = {
      ...merged[index],
      start_year: merged[index].start_year || role.start_year,
      end_year: merged[index].end_year || role.end_year,
    };
  }
  return merged;
}

export function EditManagementRolesModal({
  roles,
  onClose,
  onSubmit,
}: EditManagementRolesModalProps) {
  const [records, setRecords] = useState<ManagementRole[]>(roles);
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [batchStrategy, setBatchStrategy] = useState<"append" | "replace">(
    "append",
  );
  const parsedBatch = useMemo(
    () => parseManagementRolesFromText(batchText),
    [batchText],
  );

  const updateRecord = (
    index: number,
    key: keyof ManagementRole,
    value: string,
  ) => {
    setRecords((current) =>
      current.map((record, itemIndex) =>
        itemIndex === index ? { ...record, [key]: value } : record,
      ),
    );
  };

  const applyBatch = () => {
    if (parsedBatch.length === 0) return;
    setRecords((current) =>
      batchStrategy === "replace"
        ? mergeRoles([], parsedBatch)
        : mergeRoles(current, parsedBatch),
    );
    setBatchMode(false);
    setBatchText("");
  };

  const cleanRecords = mergeRoles([], records);

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
        className="mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">编辑学术兼职</h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 space-y-3">
          {records.map((record, index) => (
            <div
              key={`${roleKey(record)}-${index}`}
              className="rounded-lg border border-gray-200 bg-gray-50/60 p-3"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={record.organization ?? ""}
                  onChange={(event) =>
                    updateRecord(index, "organization", event.target.value)
                  }
                  placeholder="机构，如：中国人工智能学会"
                  className="min-w-0 rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  value={record.role ?? ""}
                  onChange={(event) =>
                    updateRecord(index, "role", event.target.value)
                  }
                  placeholder="职务，如：会士 / 编委"
                  className="min-w-0 rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  value={record.start_year ?? ""}
                  onChange={(event) =>
                    updateRecord(index, "start_year", event.target.value)
                  }
                  placeholder="开始年份"
                  className="min-w-0 rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  value={record.end_year ?? ""}
                  onChange={(event) =>
                    updateRecord(index, "end_year", event.target.value)
                  }
                  placeholder="结束年份 / 至今"
                  className="min-w-0 rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <button
                type="button"
                aria-label={`删除第 ${index + 1} 条学术兼职`}
                onClick={() =>
                  setRecords((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </button>
            </div>
          ))}

          {batchMode ? (
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-600">
                  支持逐行、管道分隔、字段标签及中文逗号分隔的多条兼职
                </p>
                <span className="shrink-0 text-xs font-medium text-blue-700">
                  已识别 {parsedBatch.length} 条
                </span>
              </div>
              <textarea
                aria-label="批量导入学术兼职"
                value={batchText}
                onChange={(event) => setBatchText(event.target.value)}
                autoFocus
                rows={6}
                placeholder={"中国人工智能学会 | 会士\n职务：期刊编委；机构：IEEE TCC；开始：2024；结束：至今"}
                className="w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span>导入方式</span>
                <button
                  type="button"
                  aria-pressed={batchStrategy === "append"}
                  onClick={() => setBatchStrategy("append")}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${batchStrategy === "append" ? "border-blue-300 bg-blue-100 text-blue-700" : "border-gray-200 bg-white text-gray-500"}`}
                >
                  <Plus className="h-3 w-3" /> 追加并去重
                </button>
                <button
                  type="button"
                  aria-pressed={batchStrategy === "replace"}
                  onClick={() => setBatchStrategy("replace")}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${batchStrategy === "replace" ? "border-blue-300 bg-blue-100 text-blue-700" : "border-gray-200 bg-white text-gray-500"}`}
                >
                  <RefreshCw className="h-3 w-3" /> 替换当前列表
                </button>
              </div>
              {parsedBatch.length > 0 && (
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border border-blue-100 bg-white/80 p-2">
                  {parsedBatch.map((record, index) => (
                    <div
                      key={`${roleKey(record)}-${index}`}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="truncate">
                        {[record.organization, record.role]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={parsedBatch.length === 0}
                  onClick={applyBatch}
                  className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  应用识别结果
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBatchMode(false);
                    setBatchText("");
                  }}
                  className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setRecords((current) => [
                    ...current,
                    { role: "", organization: "", start_year: "", end_year: "" },
                  ])
                }
                className="flex-1 rounded-lg border border-dashed border-primary-300 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
              >
                <Plus className="mr-1 inline h-4 w-4" /> 逐条添加
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchMode(true);
                  setBatchText("");
                  setBatchStrategy("append");
                }}
                className="flex-1 rounded-lg border border-dashed border-blue-300 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                批量导入
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onSubmit(cleanRecords)}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
