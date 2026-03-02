/**
 * 与两院关系卡片
 * 从 ScholarDetailPage.tsx:1598-1795 提取
 * 显示与中科院、工程院的关系（顾问委员、兼职导师、潜在引进）和学术交往记录
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Handshake,
  Edit3,
  Check,
  X,
  Calendar,
  Plus,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { FacultyDetail, ExchangeRecord } from "@/services/facultyApi";
import {
  patchFacultyRelation,
} from "@/services/facultyApi";
import { ClickToEditField } from "@/components/scholar-detail/shared/ClickToEditField";
import { ExchangeRecordFormModal } from "@/components/scholar-detail/modals/ExchangeRecordFormModal";
import { slideInUp, listItem } from "@/utils/animations";

interface InstituteRelationCardProps {
  faculty: FacultyDetail;
  editedExchangeRecords: ExchangeRecord[];
  setEditedExchangeRecords: (records: ExchangeRecord[]) => void;
  onSaveExchangeRecords: () => Promise<void>;
  showExchangeRecordForm: boolean;
  setShowExchangeRecordForm: (show: boolean) => void;
  editingExchangeIdx: number | null;
  setEditingExchangeIdx: (idx: number | null) => void;
  exchangeTypeColor: Record<string, string>;
  onFacultyUpdate: (updated: FacultyDetail) => void;
}

export function InstituteRelationCard({
  faculty,
  editedExchangeRecords,
  setEditedExchangeRecords,
  onSaveExchangeRecords,
  showExchangeRecordForm,
  setShowExchangeRecordForm,
  editingExchangeIdx,
  setEditingExchangeIdx,
  exchangeTypeColor,
  onFacultyUpdate,
}: InstituteRelationCardProps) {
  const [isExchangeEditMode, setIsExchangeEditMode] = useState(false);

  const relationBadges = [
    {
      label: "顾问委员",
      active: faculty.is_advisor_committee ?? false,
      desc: "",
    },
    {
      label: "兼职导师",
      active: faculty.is_adjunct_supervisor ?? false,
      desc: "",
    },
    {
      label: "潜在引进",
      active: faculty.is_potential_recruit ?? false,
      desc: "",
    },
  ];

  const handleRelationToggle = async (
    field: "is_advisor_committee" | "is_adjunct_supervisor" | "is_potential_recruit",
  ) => {
    const updated = await patchFacultyRelation(faculty.url_hash, {
      [field]: !faculty[field],
    });
    onFacultyUpdate(updated);
  };

  const handleEnterExchangeEdit = () => {
    setEditedExchangeRecords(faculty.academic_exchange_records || []);
    setIsExchangeEditMode(true);
  };

  const handleCancelExchangeEdit = () => {
    setIsExchangeEditMode(false);
    setEditingExchangeIdx(null);
  };

  const handleDeleteExchangeRecord = (index: number) => {
    const updated = editedExchangeRecords.filter((_, i) => i !== index);
    setEditedExchangeRecords(updated);
  };

  const handleAddExchangeRecord = (record: ExchangeRecord) => {
    if (editingExchangeIdx !== null) {
      const updated = [...editedExchangeRecords];
      updated[editingExchangeIdx] = record;
      setEditedExchangeRecords(updated);
    } else {
      setEditedExchangeRecords([...editedExchangeRecords, record]);
    }
    setEditingExchangeIdx(null);
    setShowExchangeRecordForm(false);
  };

  return (
    <>
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
                onClick={() => {
                  const fieldMap: Record<string, "is_advisor_committee" | "is_adjunct_supervisor" | "is_potential_recruit"> = {
                    顾问委员: "is_advisor_committee",
                    兼职导师: "is_adjunct_supervisor",
                    潜在引进: "is_potential_recruit",
                  };
                  const field = fieldMap[rel.label];
                  if (field) handleRelationToggle(field);
                }}
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
          </div>
          {faculty.institute_relation_notes ? (
            <ClickToEditField
              value={faculty.institute_relation_notes}
              onSave={async (val) => {
                const updated = await patchFacultyRelation(faculty.url_hash, {
                  institute_relation_notes: val,
                });
                onFacultyUpdate(updated);
              }}
              multiline
              renderValue={
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {faculty.institute_relation_notes}
                </p>
              }
            />
          ) : null}
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
                  onClick={onSaveExchangeRecords}
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

          {/* Edit mode: show editedExchangeRecords */}
          {isExchangeEditMode ? (
            <div className="space-y-2 p-3 bg-primary-50/20 rounded-lg border border-primary-100">
              {editedExchangeRecords.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">暂无交往记录</p>
              )}
              {editedExchangeRecords.map((record, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 flex items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {record.type && (
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-semibold",
                            exchangeTypeColor[record.type] ?? "bg-gray-100 text-gray-600",
                          )}
                        >
                          {record.type}
                        </span>
                      )}
                      {record.date && (
                        <span className="text-xs text-gray-400">{record.date}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      {[record.title, record.organization].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingExchangeIdx(index)}
                      className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExchangeRecord(index)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowExchangeRecordForm(true)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> 添加交往记录
              </button>
            </div>
          ) : (
            /* View mode */
            faculty.academic_exchange_records && faculty.academic_exchange_records.length > 0 ? (
              <div className="space-y-3">
                {faculty.academic_exchange_records.map((record, index) => (
                  <motion.div
                    key={index}
                    variants={listItem}
                    className="p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 flex-wrap mb-2">
                      {record.type && (
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap",
                            exchangeTypeColor[record.type] ?? "bg-gray-100 text-gray-600",
                          )}
                        >
                          {record.type}
                        </span>
                      )}
                      {record.date && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="w-3 h-3" />
                          {record.date}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {[record.title, record.organization, record.description]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">暂无交往记录</p>
            )
          )}
        </div>
      </motion.div>

      {/* Exchange Record Form Modal */}
      {showExchangeRecordForm && (
        <ExchangeRecordFormModal
          record={editingExchangeIdx !== null ? editedExchangeRecords[editingExchangeIdx] : undefined}
          onClose={() => {
            setShowExchangeRecordForm(false);
            setEditingExchangeIdx(null);
          }}
          onSubmit={handleAddExchangeRecord}
        />
      )}
    </>
  );
}
