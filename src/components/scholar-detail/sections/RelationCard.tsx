import { useState } from "react";
import { motion } from "framer-motion";
import {
  Handshake,
  Calendar,
  Edit3,
  Check,
  X,
  Plus,
  FileText,
} from "lucide-react";
import type { ScholarDetail } from "@/services/scholarApi";
import { ClickToEditField } from "@/components/scholar-detail/shared/ClickToEditField";
import { ExchangeRecordFormModal } from "@/components/scholar-detail/modals/ExchangeRecordFormModal";
import { cn } from "@/utils/cn";
import { slideInUp } from "@/utils/animations";

const AGREEMENT_STATUS_STYLES: Record<string, string> = {
  已签署: "bg-emerald-50 text-emerald-700 border-emerald-200",
  流程中: "bg-amber-50 text-amber-700 border-amber-200",
  待签署: "bg-amber-50 text-amber-700 border-amber-200",
  签署中: "bg-blue-50 text-blue-700 border-blue-200",
  已过期: "bg-gray-100 text-gray-500 border-gray-200",
  已终止: "bg-red-50 text-red-600 border-red-200",
};

interface RelationCardProps {
  scholar: ScholarDetail;
  onRelationToggle: (
    field: "is_advisor_committee" | "is_potential_recruit",
  ) => Promise<void>;
  onRelationNotesSave: (val: string) => Promise<void>;
  onSaveExchangeRecords: (records: string[]) => Promise<void>;
}

const RELATION_BADGES = [
  { label: "顾问委员", field: "is_advisor_committee" as const },
  { label: "潜在引进", field: "is_potential_recruit" as const },
] as const;

export function RelationCard({
  scholar,
  onRelationToggle,
  onRelationNotesSave,
  onSaveExchangeRecords,
}: RelationCardProps) {
  // Exchange records editing state
  const [isExchangeEditMode, setIsExchangeEditMode] = useState(false);
  const [editedExchangeRecords, setEditedExchangeRecords] = useState<string[]>(
    [],
  );
  const [showExchangeRecordForm, setShowExchangeRecordForm] = useState(false);
  const [editingExchangeIdx, setEditingExchangeIdx] = useState<number | null>(
    null,
  );

  const handleEnterExchangeEdit = () => {
    setEditedExchangeRecords([...(scholar.academic_exchange_records ?? [])]);
    setIsExchangeEditMode(true);
  };

  const handleCancelExchangeEdit = () => {
    setIsExchangeEditMode(false);
    setEditedExchangeRecords([]);
    setShowExchangeRecordForm(false);
    setEditingExchangeIdx(null);
  };

  const handleSaveExchangeRecords = async () => {
    await onSaveExchangeRecords(editedExchangeRecords);
    setIsExchangeEditMode(false);
    setEditedExchangeRecords([]);
    setShowExchangeRecordForm(false);
    setEditingExchangeIdx(null);
  };

  const handleExchangeRecordSubmit = (record: string) => {
    if (editingExchangeIdx !== null) {
      setEditedExchangeRecords((prev) => {
        const updated = [...prev];
        updated[editingExchangeIdx] = record;
        return updated;
      });
      setEditingExchangeIdx(null);
    } else {
      setEditedExchangeRecords((prev) => [...prev, record]);
    }
  };

  const handleDeleteExchangeRecord = (idx: number) => {
    setEditedExchangeRecords((prev) => prev.filter((_, i) => i !== idx));
  };

  const relationBadges = RELATION_BADGES.map((badge) => ({
    ...badge,
    active: scholar[badge.field],
    desc: scholar[badge.field]
      ? badge.label === "潜在引进"
        ? "已标记"
        : "顾问委员会"
      : "",
  }));

  const adjSup = scholar.adjunct_supervisor;
  const hasAdjunct = Boolean(adjSup?.status);

  return (
    <>
      {/* Exchange Record Form Modal */}
      {(showExchangeRecordForm || editingExchangeIdx !== null) && (
        <ExchangeRecordFormModal
          record={
            editingExchangeIdx !== null
              ? editedExchangeRecords[editingExchangeIdx]
              : undefined
          }
          onClose={() => {
            setShowExchangeRecordForm(false);
            setEditingExchangeIdx(null);
          }}
          onSubmit={handleExchangeRecordSubmit}
        />
      )}

      <motion.div
        variants={slideInUp}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Handshake className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-semibold text-gray-900">与两院关系</h3>
        </div>

        {/* Relation badges */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            关系概况
          </p>
          <div className="flex flex-wrap gap-2">
            {relationBadges.map((rel) => (
              <button
                key={rel.label}
                onClick={() => onRelationToggle(rel.field)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all hover:opacity-80",
                  rel.active
                    ? "bg-primary-50 border-primary-200 text-primary-700"
                    : "bg-gray-50 border-gray-200 text-gray-400",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    rel.active ? "bg-primary-500" : "bg-gray-300",
                  )}
                />
                <span className="font-medium">{rel.label}</span>
                {rel.active && rel.desc && (
                  <span className="text-xs text-primary-500">{rel.desc}</span>
                )}
              </button>
            ))}
            {/* Adjunct supervisor badge (read-only display) */}
            {hasAdjunct && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm bg-indigo-50 border-indigo-200 text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="font-medium">共建导师</span>
                {adjSup?.status && (
                  <span className="text-xs text-indigo-500">{adjSup.status}</span>
                )}
              </span>
            )}
          </div>
          {scholar.institute_relation_notes ? (
            <ClickToEditField
              value={scholar.institute_relation_notes}
              onSave={onRelationNotesSave}
              multiline
              renderValue={
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {scholar.institute_relation_notes}
                </p>
              }
            />
          ) : null}
        </div>

        {/* Adjunct Supervisor Details */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              共建导师协议
            </p>
            {hasAdjunct && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                共建导师
              </span>
            )}
          </div>

          {hasAdjunct && adjSup ? (
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      类型
                    </th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      协议类型
                    </th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      状态
                    </th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      协议期限
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-primary-50/20 transition-colors duration-100">
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-700 font-medium">
                        {adjSup.type || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {adjSup.agreement_type || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {adjSup.status ? (
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                            AGREEMENT_STATUS_STYLES[adjSup.status] ??
                              "bg-gray-100 text-gray-600 border-gray-200",
                          )}
                        >
                          {adjSup.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {adjSup.agreement_period ? (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {adjSup.agreement_period}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              {adjSup.recommender && (
                <div className="px-3 py-2 bg-gray-50/50 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-400">推荐主体：</span>
                    {adjSup.recommender}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <FileText className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <p className="text-xs text-gray-400">暂无共建导师协议记录</p>
            </div>
          )}
        </div>

        {/* Exchange Records */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              交往记录
            </p>
            {!isExchangeEditMode ? (
              <button
                onClick={handleEnterExchangeEdit}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-full transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                编辑
              </button>
            ) : (
              <div className="ml-auto flex gap-1">
                <button
                  onClick={handleSaveExchangeRecords}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors"
                >
                  <Check className="w-3 h-3" />
                  保存
                </button>
                <button
                  onClick={handleCancelExchangeEdit}
                  className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          {isExchangeEditMode ? (
            <ExchangeEditList
              records={editedExchangeRecords}
              onEdit={setEditingExchangeIdx}
              onDelete={handleDeleteExchangeRecord}
              onAdd={() => setShowExchangeRecordForm(true)}
            />
          ) : scholar.academic_exchange_records &&
            scholar.academic_exchange_records.length > 0 ? (
            <div className="space-y-2">
              {scholar.academic_exchange_records.map((record, index) => (
                <motion.div
                  key={index}
                  className="p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
                >
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {record}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              暂无交往记录
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* -- Exchange edit list sub-component -- */
function ExchangeEditList({
  records,
  onEdit,
  onDelete,
  onAdd,
}: {
  records: string[];
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2 p-3 bg-primary-50/20 rounded-lg border border-primary-100">
      {records.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">暂无交往记录</p>
      )}
      {records.map((record, index) => (
        <div
          key={index}
          className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 flex items-start gap-2"
        >
          <p className="flex-1 text-sm text-gray-700 min-w-0 break-words">
            {record}
          </p>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(index)}
              className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
              title="编辑"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(index)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="删除"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> 添加交往记录
      </button>
    </div>
  );
}
