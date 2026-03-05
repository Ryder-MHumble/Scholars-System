import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import type {
  PublicationRecord,
  PatentRecord,
  AwardRecord,
} from "@/services/scholarApi";

interface EditAchievementsModalProps {
  publications: PublicationRecord[];
  patents: PatentRecord[];
  awards: AwardRecord[];
  onClose: () => void;
  onSubmit: (data: {
    publications: PublicationRecord[];
    patents: PatentRecord[];
    awards: AwardRecord[];
  }) => void;
}

export function EditAchievementsModal({
  publications,
  patents,
  awards,
  onClose,
  onSubmit,
}: EditAchievementsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "publications" | "patents" | "awards"
  >("publications");
  const [editedPublications, setEditedPublications] =
    useState<PublicationRecord[]>(publications);
  const [editedPatents, setEditedPatents] = useState<PatentRecord[]>(patents);
  const [editedAwards, setEditedAwards] = useState<AwardRecord[]>(awards);
  const [batchMode, setBatchMode] = useState<
    "publications" | "patents" | "awards" | null
  >(null);
  const [batchText, setBatchText] = useState("");

  const applyBatchPublications = () => {
    const newItems = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const p = line.split("|").map((s) => s.trim());
        return {
          title: p[0] || "",
          venue: p[1] || "",
          year: p[2] || "",
          authors: p[3] || "",
          url: p[4] || "",
          citation_count: 0,
          is_corresponding: false,
          added_by: "user",
        } as PublicationRecord;
      });
    setEditedPublications((prev) => [...prev, ...newItems]);
    setBatchMode(null);
    setBatchText("");
  };

  const applyBatchPatents = () => {
    const newItems = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const p = line.split("|").map((s) => s.trim());
        return {
          title: p[0] || "",
          patent_no: p[1] || "",
          year: p[2] || "",
          inventors: p[3] || "",
          patent_type: p[4] || "",
          status: p[5] || "",
          added_by: "user",
        } as PatentRecord;
      });
    setEditedPatents((prev) => [...prev, ...newItems]);
    setBatchMode(null);
    setBatchText("");
  };

  const applyBatchAwards = () => {
    const newItems = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const p = line.split("|").map((s) => s.trim());
        return {
          title: p[0] || "",
          year: p[1] || "",
          level: p[2] || "",
          grantor: p[3] || "",
          description: p[4] || "",
          added_by: "user",
        } as AwardRecord;
      });
    setEditedAwards((prev) => [...prev, ...newItems]);
    setBatchMode(null);
    setBatchText("");
  };

  const handleSubmit = () => {
    onSubmit({
      publications: editedPublications,
      patents: editedPatents,
      awards: editedAwards,
    });
  };

  const addPublication = () => {
    setEditedPublications([
      ...editedPublications,
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
    setEditedPublications(editedPublications.filter((_, i) => i !== index));
  };

  const updatePublication = (
    index: number,
    field: keyof PublicationRecord,
    value: any,
  ) => {
    const updated = [...editedPublications];
    updated[index] = { ...updated[index], [field]: value };
    setEditedPublications(updated);
  };

  const addPatent = () => {
    setEditedPatents([
      ...editedPatents,
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
    setEditedPatents(editedPatents.filter((_, i) => i !== index));
  };

  const updatePatent = (
    index: number,
    field: keyof PatentRecord,
    value: any,
  ) => {
    const updated = [...editedPatents];
    updated[index] = { ...updated[index], [field]: value };
    setEditedPatents(updated);
  };

  const addAward = () => {
    setEditedAwards([
      ...editedAwards,
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
    setEditedAwards(editedAwards.filter((_, i) => i !== index));
  };

  const updateAward = (index: number, field: keyof AwardRecord, value: any) => {
    const updated = [...editedAwards];
    updated[index] = { ...updated[index], [field]: value };
    setEditedAwards(updated);
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
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            编辑学术成就
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex gap-3 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("publications")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "publications"
                ? "text-primary-600 border-b-2 border-primary-600 -mb-px"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            代表性论文 ({editedPublications.length})
          </button>
          <button
            onClick={() => setActiveTab("patents")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "patents"
                ? "text-primary-600 border-b-2 border-primary-600 -mb-px"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            专利 ({editedPatents.length})
          </button>
          <button
            onClick={() => setActiveTab("awards")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "awards"
                ? "text-primary-600 border-b-2 border-primary-600 -mb-px"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            奖项 ({editedAwards.length})
          </button>
        </div>

        {/* 论文编辑 */}
        {activeTab === "publications" && (
          <div className="space-y-3 mb-4">
            {editedPublications.map((pub, i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-lg space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    论文 {i + 1}
                  </span>
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
                  onChange={(e) =>
                    updatePublication(i, "title", e.target.value)
                  }
                  placeholder="论文标题"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={pub.venue || ""}
                  onChange={(e) =>
                    updatePublication(i, "venue", e.target.value)
                  }
                  placeholder="会议/期刊"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={pub.year || ""}
                  onChange={(e) => updatePublication(i, "year", e.target.value)}
                  placeholder="年份"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={pub.authors || ""}
                  onChange={(e) =>
                    updatePublication(i, "authors", e.target.value)
                  }
                  placeholder="作者"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={pub.url || ""}
                  onChange={(e) => updatePublication(i, "url", e.target.value)}
                  placeholder="URL"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={pub.citation_count || 0}
                    onChange={(e) =>
                      updatePublication(
                        i,
                        "citation_count",
                        parseInt(e.target.value),
                      )
                    }
                    placeholder="被引数"
                    className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pub.is_corresponding || false}
                      onChange={(e) =>
                        updatePublication(
                          i,
                          "is_corresponding",
                          e.target.checked,
                        )
                      }
                      className="rounded"
                    />
                    <span>通讯作者</span>
                  </label>
                </div>
              </div>
            ))}
            {batchMode === "publications" ? (
              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/30 space-y-2">
                <p className="text-xs text-gray-500">
                  每行一条，字段用{" "}
                  <code className="bg-gray-100 px-1 rounded font-mono">|</code>{" "}
                  分隔：
                  <code className="bg-gray-100 px-1 rounded font-mono text-xs">
                    标题 | 会议/期刊 | 年份 | 作者
                  </code>
                  （仅标题也可）
                </p>
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  autoFocus
                  rows={5}
                  placeholder={
                    "Deep Learning for NLP | NeurIPS | 2022 | 张三, 李四\n另一篇论文标题 | ICML | 2021\n仅标题也行"
                  }
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={applyBatchPublications}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    确认导入 (
                    {batchText.split("\n").filter((l) => l.trim()).length} 条)
                  </button>
                  <button
                    onClick={() => {
                      setBatchMode(null);
                      setBatchText("");
                    }}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={addPublication}
                  className="flex-1 px-4 py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> 逐条添加
                </button>
                <button
                  onClick={() => {
                    setBatchMode("publications");
                    setBatchText("");
                  }}
                  className="flex-1 px-4 py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                >
                  批量导入
                </button>
              </div>
            )}
          </div>
        )}

        {/* 专利编辑 */}
        {activeTab === "patents" && (
          <div className="space-y-3 mb-4">
            {editedPatents.map((patent, i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-lg space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    专利 {i + 1}
                  </span>
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
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.patent_no || ""}
                  onChange={(e) => updatePatent(i, "patent_no", e.target.value)}
                  placeholder="专利号"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.year || ""}
                  onChange={(e) => updatePatent(i, "year", e.target.value)}
                  placeholder="年份"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.inventors || ""}
                  onChange={(e) => updatePatent(i, "inventors", e.target.value)}
                  placeholder="发明人"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.patent_type || ""}
                  onChange={(e) =>
                    updatePatent(i, "patent_type", e.target.value)
                  }
                  placeholder="专利类型"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.status || ""}
                  onChange={(e) => updatePatent(i, "status", e.target.value)}
                  placeholder="状态"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            ))}
            {batchMode === "patents" ? (
              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/30 space-y-2">
                <p className="text-xs text-gray-500">
                  每行一条，字段用{" "}
                  <code className="bg-gray-100 px-1 rounded font-mono">|</code>{" "}
                  分隔：
                  <code className="bg-gray-100 px-1 rounded font-mono text-xs">
                    专利名称 | 专利号 | 年份 | 发明人 | 类型 | 状态
                  </code>
                </p>
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  autoFocus
                  rows={5}
                  placeholder={
                    "一种AI方法 | CN123456789A | 2022 | 张三; 李四 | 发明专利 | 已授权\n另一专利名称 | CN987654321B | 2021"
                  }
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={applyBatchPatents}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    确认导入 (
                    {batchText.split("\n").filter((l) => l.trim()).length} 条)
                  </button>
                  <button
                    onClick={() => {
                      setBatchMode(null);
                      setBatchText("");
                    }}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={addPatent}
                  className="flex-1 px-4 py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> 逐条添加
                </button>
                <button
                  onClick={() => {
                    setBatchMode("patents");
                    setBatchText("");
                  }}
                  className="flex-1 px-4 py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                >
                  批量导入
                </button>
              </div>
            )}
          </div>
        )}

        {/* 奖项编辑 */}
        {activeTab === "awards" && (
          <div className="space-y-3 mb-4">
            {editedAwards.map((award, i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-lg space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    奖项 {i + 1}
                  </span>
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
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={award.year || ""}
                  onChange={(e) => updateAward(i, "year", e.target.value)}
                  placeholder="年份"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={award.level || ""}
                  onChange={(e) => updateAward(i, "level", e.target.value)}
                  placeholder="等级"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={award.grantor || ""}
                  onChange={(e) => updateAward(i, "grantor", e.target.value)}
                  placeholder="颁发单位"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <textarea
                  value={award.description || ""}
                  onChange={(e) =>
                    updateAward(i, "description", e.target.value)
                  }
                  placeholder="描述"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
                />
              </div>
            ))}
            {batchMode === "awards" ? (
              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/30 space-y-2">
                <p className="text-xs text-gray-500">
                  每行一条，字段用{" "}
                  <code className="bg-gray-100 px-1 rounded font-mono">|</code>{" "}
                  分隔：
                  <code className="bg-gray-100 px-1 rounded font-mono text-xs">
                    奖项名称 | 年份 | 等级 | 颁发单位 | 描述
                  </code>
                  （仅名称也可）
                </p>
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  autoFocus
                  rows={5}
                  placeholder={
                    "国家科学技术进步奖 | 2022 | 一等奖 | 国务院\n吴文俊人工智能科技奖 | 2021 | 自然科学奖\n省级优秀青年教师"
                  }
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={applyBatchAwards}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    确认导入 (
                    {batchText.split("\n").filter((l) => l.trim()).length} 条)
                  </button>
                  <button
                    onClick={() => {
                      setBatchMode(null);
                      setBatchText("");
                    }}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={addAward}
                  className="flex-1 px-4 py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> 逐条添加
                </button>
                <button
                  onClick={() => {
                    setBatchMode("awards");
                    setBatchText("");
                  }}
                  className="flex-1 px-4 py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                >
                  批量导入
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
