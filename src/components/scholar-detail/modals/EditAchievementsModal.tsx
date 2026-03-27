import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Save, Upload, BookOpen, Award, Trophy } from "lucide-react";
import { cn } from "@/utils/cn";
import type {
  PublicationRecord,
  PatentRecord,
  AwardRecord,
} from "@/services/scholarApi";
import {
  parsePublicationsFromText,
  parsePatentsFromText,
  parseAwardsFromText,
} from "@/utils/textParsers";

interface EditAchievementsModalProps {
  publications: PublicationRecord[];
  patents: PatentRecord[];
  awards: AwardRecord[];
  onClose: () => void;
  onSubmit: (data: {
    publications: PublicationRecord[];
    patents: PatentRecord[];
    awards: AwardRecord[];
  }) => void | Promise<void>;
}

type AchievementsTab = "publications" | "patents" | "awards";

export function EditAchievementsModal({
  publications,
  patents,
  awards,
  onClose,
  onSubmit,
}: EditAchievementsModalProps) {
  const [activeTab, setActiveTab] = useState<AchievementsTab>("publications");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBatchPanel, setShowBatchPanel] = useState(false);

  const [editedPublications, setEditedPublications] =
    useState<PublicationRecord[]>(publications);
  const [editedPatents, setEditedPatents] = useState<PatentRecord[]>(patents);
  const [editedAwards, setEditedAwards] = useState<AwardRecord[]>(awards);

  const [batchInputs, setBatchInputs] = useState({
    publications: "",
    patents: "",
    awards: "",
  });

  const parsedBatchCounts = useMemo(
    () => ({
      publications: parsePublicationsFromText(batchInputs.publications).length,
      patents: parsePatentsFromText(batchInputs.patents).length,
      awards: parseAwardsFromText(batchInputs.awards).length,
    }),
    [batchInputs],
  );

  const handleBatchChange = (field: AchievementsTab, value: string) => {
    setBatchInputs((prev) => ({ ...prev, [field]: value }));
  };

  const applyBatchFor = (field: AchievementsTab) => {
    if (field === "publications") {
      const parsed = parsePublicationsFromText(batchInputs.publications);
      if (parsed.length > 0) {
        setEditedPublications((prev) => [...prev, ...parsed]);
      }
    } else if (field === "patents") {
      const parsed = parsePatentsFromText(batchInputs.patents);
      if (parsed.length > 0) {
        setEditedPatents((prev) => [...prev, ...parsed]);
      }
    } else {
      const parsed = parseAwardsFromText(batchInputs.awards);
      if (parsed.length > 0) {
        setEditedAwards((prev) => [...prev, ...parsed]);
      }
    }
    setBatchInputs((prev) => ({ ...prev, [field]: "" }));
  };

  const applyAllBatches = () => {
    applyBatchFor("publications");
    applyBatchFor("patents");
    applyBatchFor("awards");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        publications: editedPublications,
        patents: editedPatents,
        awards: editedAwards,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPublication = () => {
    setEditedPublications((prev) => [
      ...prev,
      {
        title: "",
        venue: "",
        year: "",
        authors: "",
        url: "",
        citation_count: 0,
        is_corresponding: false,
        added_by: "user",
      },
    ]);
  };

  const removePublication = (index: number) => {
    setEditedPublications((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePublication = (
    index: number,
    field: keyof PublicationRecord,
    value: unknown,
  ) => {
    setEditedPublications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPatent = () => {
    setEditedPatents((prev) => [
      ...prev,
      {
        title: "",
        patent_no: "",
        year: "",
        inventors: "",
        patent_type: "",
        status: "",
        added_by: "user",
      },
    ]);
  };

  const removePatent = (index: number) => {
    setEditedPatents((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePatent = (
    index: number,
    field: keyof PatentRecord,
    value: unknown,
  ) => {
    setEditedPatents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addAward = () => {
    setEditedAwards((prev) => [
      ...prev,
      {
        title: "",
        year: "",
        level: "",
        grantor: "",
        description: "",
        added_by: "user",
      },
    ]);
  };

  const removeAward = (index: number) => {
    setEditedAwards((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAward = (
    index: number,
    field: keyof AwardRecord,
    value: unknown,
  ) => {
    setEditedAwards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">编辑学术成就</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBatchPanel((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors",
                  showBatchPanel
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                {showBatchPanel ? "收起批量导入" : "批量导入"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmitting ? "保存中..." : "保存全部"}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            支持同时导入论文、专利、奖项，点击顶部“保存全部”后一次性提交三类数据。
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {showBatchPanel && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <BatchImportCard
                  title="论文批量导入"
                  value={batchInputs.publications}
                  count={parsedBatchCounts.publications}
                  placeholder={'[1] Authors, "Title", Venue (2025)\n[2] ...'}
                  onChange={(v) => handleBatchChange("publications", v)}
                  onApply={() => applyBatchFor("publications")}
                />
                <BatchImportCard
                  title="专利批量导入"
                  value={batchInputs.patents}
                  count={parsedBatchCounts.patents}
                  placeholder={"[1] 发明人.专利标题, ZL202511129049.1\n[2] ..."}
                  onChange={(v) => handleBatchChange("patents", v)}
                  onApply={() => applyBatchFor("patents")}
                />
                <BatchImportCard
                  title="奖项批量导入"
                  value={batchInputs.awards}
                  count={parsedBatchCounts.awards}
                  placeholder={"[1] 2025年度XX一等奖\n[2] ..."}
                  onChange={(v) => handleBatchChange("awards", v)}
                  onApply={() => applyBatchFor("awards")}
                />
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={applyAllBatches}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  一键导入全部（{parsedBatchCounts.publications}/
                  {parsedBatchCounts.patents}/{parsedBatchCounts.awards}）
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 border-b border-gray-200">
            <TabButton
              active={activeTab === "publications"}
              onClick={() => setActiveTab("publications")}
              icon={BookOpen}
              label={`代表性论文 (${editedPublications.length})`}
            />
            <TabButton
              active={activeTab === "patents"}
              onClick={() => setActiveTab("patents")}
              icon={Award}
              label={`专利 (${editedPatents.length})`}
            />
            <TabButton
              active={activeTab === "awards"}
              onClick={() => setActiveTab("awards")}
              icon={Trophy}
              label={`奖项 (${editedAwards.length})`}
            />
          </div>

          {activeTab === "publications" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={addPublication}
                className="px-3 py-1.5 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                添加论文
              </button>
              {editedPublications.map((pub, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500">论文 {i + 1}</span>
                    <button
                      onClick={() => removePublication(i)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      删除
                    </button>
                  </div>
                  <input
                    type="text"
                    value={pub.title || ""}
                    onChange={(e) => updatePublication(i, "title", e.target.value)}
                    placeholder="论文标题"
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={pub.venue || ""}
                    onChange={(e) => updatePublication(i, "venue", e.target.value)}
                    placeholder="会议/期刊"
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pub.year || ""}
                      onChange={(e) => updatePublication(i, "year", e.target.value)}
                      placeholder="年份"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={pub.url || ""}
                      onChange={(e) => updatePublication(i, "url", e.target.value)}
                      placeholder="URL"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                  </div>
                  <input
                    type="text"
                    value={pub.authors || ""}
                    onChange={(e) => updatePublication(i, "authors", e.target.value)}
                    placeholder="作者"
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={pub.citation_count || 0}
                      onChange={(e) =>
                        updatePublication(
                          i,
                          "citation_count",
                          Number.parseInt(e.target.value || "0", 10),
                        )
                      }
                      placeholder="被引数"
                      className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={pub.is_corresponding || false}
                        onChange={(e) =>
                          updatePublication(i, "is_corresponding", e.target.checked)
                        }
                        className="rounded"
                      />
                      <span>通讯作者</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "patents" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={addPatent}
                className="px-3 py-1.5 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                添加专利
              </button>
              {editedPatents.map((patent, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500">专利 {i + 1}</span>
                    <button
                      onClick={() => removePatent(i)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      删除
                    </button>
                  </div>
                  <input
                    type="text"
                    value={patent.title || ""}
                    onChange={(e) => updatePatent(i, "title", e.target.value)}
                    placeholder="专利名称"
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={patent.patent_no || ""}
                      onChange={(e) => updatePatent(i, "patent_no", e.target.value)}
                      placeholder="专利号"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={patent.year || ""}
                      onChange={(e) => updatePatent(i, "year", e.target.value)}
                      placeholder="年份"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                  </div>
                  <input
                    type="text"
                    value={patent.inventors || ""}
                    onChange={(e) => updatePatent(i, "inventors", e.target.value)}
                    placeholder="发明人"
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={patent.patent_type || ""}
                      onChange={(e) => updatePatent(i, "patent_type", e.target.value)}
                      placeholder="专利类型"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={patent.status || ""}
                      onChange={(e) => updatePatent(i, "status", e.target.value)}
                      placeholder="状态"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "awards" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={addAward}
                className="px-3 py-1.5 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                添加奖项
              </button>
              {editedAwards.map((award, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500">奖项 {i + 1}</span>
                    <button
                      onClick={() => removeAward(i)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      删除
                    </button>
                  </div>
                  <input
                    type="text"
                    value={award.title || ""}
                    onChange={(e) => updateAward(i, "title", e.target.value)}
                    placeholder="奖项名称"
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={award.year || ""}
                      onChange={(e) => updateAward(i, "year", e.target.value)}
                      placeholder="年份"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={award.level || ""}
                      onChange={(e) => updateAward(i, "level", e.target.value)}
                      placeholder="等级"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={award.grantor || ""}
                      onChange={(e) => updateAward(i, "grantor", e.target.value)}
                      placeholder="颁发单位"
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                    />
                  </div>
                  <textarea
                    value={award.description || ""}
                    onChange={(e) => updateAward(i, "description", e.target.value)}
                    placeholder="描述"
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1 resize-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 py-3 border-t border-gray-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px inline-flex items-center gap-1.5",
        active
          ? "text-primary-600 border-primary-600"
          : "text-gray-600 border-transparent hover:text-gray-800",
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function BatchImportCard({
  title,
  value,
  count,
  placeholder,
  onChange,
  onApply,
}: {
  title: string;
  value: string;
  count: number;
  placeholder: string;
  onChange: (value: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-600">{title}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none font-mono"
      />
      <button
        type="button"
        onClick={onApply}
        className="w-full px-2.5 py-1.5 text-xs rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
      >
        导入 {count} 条
      </button>
    </div>
  );
}
