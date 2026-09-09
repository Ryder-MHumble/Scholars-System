import { useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  MapPin,
  Plus,
  Check,
  Edit3,
  Trash2,
  Loader2,
  ClipboardList,
  ArrowUpRight,
  Users,
  Newspaper,
  Upload,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  fetchStudents,
  createStudent,
  patchStudent,
  deleteStudent,
  type StudentRecord,
  type StudentCreate,
  type StudentPatch,
  type ScholarDetail,
  type CoauthorInfo,
  patchScholarDetail,
} from "@/services/scholarApi";
import {
  createScholarNews,
  deleteScholarNews,
  fetchScholarNews,
  updateScholarNews,
} from "@/services/scholarResourcesApi";
import type {
  ScholarNews,
  ScholarNewsCreate,
  ScholarNewsUpdate,
} from "@/services/scholarApi/types";
import { EditNewsModal } from "@/components/scholar-detail/modals/EditNewsModal";
import { NewsBatchImportModal } from "@/components/scholar-detail/modals/NewsBatchImportModal";
import { BaseModal } from "@/components/common/BaseModal";
import { SelectInput } from "@/components/ui/SelectInput";

interface Props {
  scholar: ScholarDetail;
}

const degreeColor: Record<string, string> = {
  博士: "bg-violet-100 text-violet-700 border-violet-200",
  硕士: "bg-blue-100 text-blue-700 border-blue-200",
  博士后: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusColor: Record<string, string> = {
  在读: "bg-green-50 text-green-600",
  已毕业: "bg-gray-50 text-gray-500",
  已离校: "bg-red-50 text-red-500",
};

const STATUS_OPTIONS = ["在读", "已毕业", "已离校"];

const emptyAddForm = (): StudentCreate => ({
  name: "",
  degree_type: "博士",
  enrollment_year: "",
  expected_graduation_year: "",
  status: "在读",
  home_university: "",
  student_no: "",
  email: "",
  phone: "",
  notes: "",
});

export function RightSidebar({ scholar }: Props) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StudentPatch>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<StudentCreate>(emptyAddForm());
  const [isSaving, setIsSaving] = useState(false);
  const [news, setNews] = useState<ScholarNews[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [newsModal, setNewsModal] = useState<
    { mode: "create" } | { mode: "edit"; news: ScholarNews } | null
  >(null);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [activeTab, setActiveTab] = useState<"coauthors" | "news">("coauthors");
  const [isRelationManagerOpen, setIsRelationManagerOpen] = useState(false);
  const [relationManagerTab, setRelationManagerTab] = useState<"coauthors" | "news">(
    "coauthors",
  );
  const [localCoauthors, setLocalCoauthors] = useState<CoauthorInfo[]>(
    scholar.coauthors ?? [],
  );
  const [relationError, setRelationError] = useState("");
  const [isRelationSaving, setIsRelationSaving] = useState(false);

  // Check if scholar is adjunct supervisor
  const isAdjunctSupervisor = Boolean(scholar.adjunct_supervisor?.status);
  const coauthors = [...localCoauthors].sort(
    (a, b) => b.weight - a.weight,
  );
  const approvedNews = news
    .filter((item) => item.review_status === "approved")
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );

  const loadNews = useCallback(async () => {
    setIsNewsLoading(true);
    setNewsError("");
    try {
      setNews(await fetchScholarNews(scholar.url_hash));
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : "学者活动加载失败");
    } finally {
      setIsNewsLoading(false);
    }
  }, [scholar.url_hash]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  useEffect(() => {
    setLocalCoauthors(scholar.coauthors ?? []);
  }, [scholar.coauthors]);

  useEffect(() => {
    if (!isAdjunctSupervisor) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchStudents(scholar.url_hash)
      .then((res) => {
        setStudents(res.items);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [scholar.url_hash, isAdjunctSupervisor]);

  const handleEnterEdit = () => setIsEditMode(true);

  const handleFinishEdit = () => {
    setIsEditMode(false);
    setEditingId(null);
    setShowAddForm(false);
    setEditForm({});
    setAddForm(emptyAddForm());
  };

  const handleStartEdit = (student: StudentRecord) => {
    setEditingId(student.id);
    setEditForm({
      name: student.name,
      degree_type: student.degree_type,
      enrollment_year: student.enrollment_year,
      expected_graduation_year: student.expected_graduation_year,
      status: student.status,
      home_university: student.home_university,
      student_no: student.student_no,
      email: student.email,
      phone: student.phone,
      notes: student.notes,
    });
  };

  const handleSaveEdit = async (studentId: string) => {
    setIsSaving(true);
    try {
      const updated = await patchStudent(scholar.url_hash, studentId, editForm);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? updated : s)),
      );
      setEditingId(null);
      setEditForm({});
    } catch (e) {
      console.error("Failed to update student:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    setIsSaving(true);
    try {
      await deleteStudent(scholar.url_hash, studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (e) {
      console.error("Failed to delete student:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setIsSaving(true);
    try {
      const created = await createStudent(scholar.url_hash, addForm);
      setStudents((prev) => [...prev, created]);
      setAddForm(emptyAddForm());
      setShowAddForm(false);
    } catch (e) {
      console.error("Failed to create student:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewsSubmit = async (
    payload: ScholarNewsCreate | ScholarNewsUpdate,
  ) => {
    if (newsModal?.mode === "edit") {
      await updateScholarNews(scholar.url_hash, newsModal.news.id, payload);
    } else {
      await createScholarNews(scholar.url_hash, payload as ScholarNewsCreate);
    }
    await loadNews();
  };

  const handleNewsDelete = async (item: ScholarNews) => {
    if (!window.confirm(`确认删除“${item.title}”？`)) return;
    try {
      await deleteScholarNews(scholar.url_hash, item.id);
      await loadNews();
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : "删除学者活动失败");
    }
  };

  const handleCoauthorDelete = async (coauthor: CoauthorInfo) => {
    const displayName = coauthor.name_zh || coauthor.name || "未知学者";
    if (!window.confirm(`确认删除合作学者“${displayName}”？`)) return;

    const remaining = localCoauthors.filter((item) => item !== coauthor);
    setIsRelationSaving(true);
    setRelationError("");
    try {
      await patchScholarDetail(scholar.url_hash, { coauthors: remaining });
      setLocalCoauthors(remaining);
    } catch (error) {
      setRelationError(error instanceof Error ? error.message : "删除合作学者失败");
    } finally {
      setIsRelationSaving(false);
    }
  };

  return (
    <aside className="w-full space-y-4 xl:w-80 xl:shrink-0">
      {/* Scholar Activities Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden bg-white"
      >
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <ClipboardList className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-900">学者关系</h3>
          <button
            type="button"
            aria-label="编辑学者关系"
            title="编辑学者关系"
            onClick={() => {
              setRelationManagerTab(activeTab);
              setIsRelationManagerOpen(true);
            }}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-700"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-gray-100 pt-2">
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab("coauthors")}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1 px-1 py-2 text-[11px] whitespace-nowrap border-b-2 transition-colors",
                activeTab === "coauthors"
                  ? "text-primary-700 border-primary-600 bg-primary-50/40"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50",
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>合作学者</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("news")}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1 px-1 py-2 text-[11px] whitespace-nowrap border-b-2 transition-colors",
                activeTab === "news"
                  ? "text-primary-700 border-primary-600 bg-primary-50/40"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50",
              )}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>学者活动</span>
            </button>
          </div>
        </div>

        <div className="py-3">
          {activeTab === "coauthors" ? (
            coauthors.length > 0 ? (
              <div className="space-y-3">
                {coauthors.map((coauthor) => (
                  <a
                    key={coauthor.aminer_id || `${coauthor.name}-${coauthor.name_zh}`}
                    href={`https://www.aminer.cn/profile/${coauthor.aminer_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block border-b border-gray-100 py-3 transition-colors last:border-0 hover:bg-primary-50/30"
                  >
                    <div className="flex items-start gap-3">
                      {coauthor.avatar ? (
                        <img
                          src={coauthor.avatar}
                          alt={coauthor.name_zh || coauthor.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold shrink-0">
                          {(coauthor.name_zh || coauthor.name).charAt(0) || "?"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {coauthor.name_zh || coauthor.name || "未知学者"}
                            </p>
                            {coauthor.name_zh && coauthor.name && (
                              <p className="text-xs text-gray-500 truncate">
                                {coauthor.name}
                              </p>
                            )}
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        </div>
                        {coauthor.position && (
                          <p className="mt-1 text-xs text-gray-600 truncate">
                            {coauthor.position}
                          </p>
                        )}
                        {(coauthor.affiliation_zh || coauthor.affiliation) && (
                          <p className="mt-0.5 text-[11px] text-gray-400 line-clamp-2">
                            {coauthor.affiliation_zh || coauthor.affiliation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                      {[
                        ["H-index", coauthor.h_index],
                        ["论文", coauthor.n_pubs],
                        ["引用", coauthor.n_citation],
                        ["权重", coauthor.weight],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded bg-gray-50 px-1 py-1.5">
                          <p className="text-[10px] text-gray-400">{label}</p>
                          <p className="mt-0.5 text-xs font-medium text-gray-700 truncate">
                            {typeof value === "number"
                              ? value.toLocaleString("zh-CN")
                              : "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <Users className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-400">暂无合作学者</p>
              </div>
            )
          ) : activeTab === "news" ? (
            <div className="space-y-3">
              {isNewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                </div>
              ) : newsError ? (
                <div className="flex flex-col items-center gap-2 py-7 text-center">
                  <AlertCircle className="h-6 w-6 text-red-300" />
                  <p className="text-xs text-red-600">{newsError}</p>
                  <button
                    type="button"
                    onClick={() => void loadNews()}
                    aria-label="重试学者活动"
                    className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    <RefreshCw className="h-3 w-3" /> 重试
                  </button>
                </div>
              ) : approvedNews.length > 0 ? (
                approvedNews.map((item) => (
                  <article key={item.id} className="border-b border-gray-100 py-3 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p data-testid="news-title" className="text-sm font-medium text-gray-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {new Date(item.published_at).toLocaleDateString("zh-CN")}
                          {item.news_type ? ` · ${item.news_type}` : ""}
                        </p>
                      </div>
                    </div>
                    {(item.summary || item.content) && (
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-600">
                        {item.summary || item.content}
                      </p>
                    )}
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                      >
                        查看来源 <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                  </article>
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Newspaper className="h-8 w-8 text-gray-200" />
                  <p className="text-sm text-gray-400">暂无学者活动</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Students Card - Only show for adjunct supervisors */}
      {isAdjunctSupervisor && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden border-t border-gray-200 bg-white pt-4"
        >
          <div
            className={cn(
              "px-5 py-4 border-b border-gray-100 flex items-center gap-2 transition-colors",
              isEditMode && "bg-primary-50/40",
            )}
          >
            <GraduationCap className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-900">指导学生</h3>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {students.length} 人
            </span>
            {!isEditMode ? (
              <button
                onClick={handleEnterEdit}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-full transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                编辑
              </button>
            ) : (
              <button
                onClick={handleFinishEdit}
                className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
              >
                完成
              </button>
            )}
          </div>

          <div className="py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            ) : students.length === 0 && !showAddForm ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <GraduationCap className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-400">暂无指导学生记录</p>
              </div>
            ) : (
              students.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                    {student.name.charAt(0) || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditMode && editingId === student.id ? (
                      <StudentEditForm
                        editForm={editForm}
                        setEditForm={setEditForm}
                        isSaving={isSaving}
                        onSave={() => handleSaveEdit(student.id)}
                        onCancel={() => {
                          setEditingId(null);
                          setEditForm({});
                        }}
                      />
                    ) : (
                      <StudentDisplay student={student} />
                    )}
                  </div>

                  {isEditMode && editingId !== student.id && (
                    <div className="flex gap-1 shrink-0 self-center">
                      <button
                        onClick={() => handleStartEdit(student)}
                        className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        disabled={isSaving}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}

            {isEditMode && showAddForm && (
              <StudentAddForm
                addForm={addForm}
                setAddForm={setAddForm}
                isSaving={isSaving}
                onAdd={handleAdd}
                onCancel={() => {
                  setShowAddForm(false);
                  setAddForm(emptyAddForm());
                }}
              />
            )}

            {isEditMode && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full mt-3 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> 添加学生
              </button>
            )}
          </div>
        </motion.div>
      )}

      {newsModal && (
        <EditNewsModal
          news={newsModal.mode === "edit" ? newsModal.news : undefined}
          onClose={() => {
            setNewsModal(null);
            setRelationManagerTab("news");
            setIsRelationManagerOpen(true);
          }}
          onSubmit={handleNewsSubmit}
        />
      )}
      <NewsBatchImportModal
        isOpen={showBatchImport}
        scholarRef={scholar.url_hash}
        onClose={() => {
          setShowBatchImport(false);
          setRelationManagerTab("news");
          setIsRelationManagerOpen(true);
        }}
        onSuccess={() => void loadNews()}
      />
      <BaseModal
        isOpen={isRelationManagerOpen}
        onClose={() => setIsRelationManagerOpen(false)}
        title="编辑学者关系"
        maxWidth="xl"
      >
        <div className="border-b border-gray-200">
          <div className="grid grid-cols-2">
            {(["coauthors", "news"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRelationManagerTab(tab)}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-sm transition-colors",
                  relationManagerTab === tab
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                )}
              >
                {tab === "coauthors" ? "合作学者" : "学者活动"}
              </button>
            ))}
          </div>
        </div>

        {relationError && (
          <p className="mt-4 text-sm text-red-600">{relationError}</p>
        )}

        {relationManagerTab === "coauthors" ? (
          <div className="divide-y divide-gray-100">
            {coauthors.length > 0 ? (
              coauthors.map((coauthor) => {
                const displayName = coauthor.name_zh || coauthor.name || "未知学者";
                return (
                  <div
                    key={coauthor.aminer_id || `${coauthor.name}-${coauthor.name_zh}`}
                    className="flex items-center gap-3 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {displayName}
                      </p>
                      {coauthor.name_zh && coauthor.name && (
                        <p className="truncate text-xs text-gray-500">{coauthor.name}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isRelationSaving}
                      onClick={() => void handleCoauthorDelete(coauthor)}
                      aria-label={`删除合作学者：${displayName}`}
                      title="删除合作学者"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">暂无合作学者</p>
            )}
          </div>
        ) : (
          <div className="pt-4">
            <div className="flex justify-end gap-2 border-b border-gray-100 pb-3">
              <button
                type="button"
                aria-label="新增学者活动"
                onClick={() => {
                  setIsRelationManagerOpen(false);
                  setNewsModal({ mode: "create" });
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" /> 新增
              </button>
              <button
                type="button"
                aria-label="批量识别学者活动"
                onClick={() => {
                  setIsRelationManagerOpen(false);
                  setShowBatchImport(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700"
              >
                <Upload className="h-4 w-4" /> 批量识别
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {approvedNews.length > 0 ? (
                approvedNews.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(item.published_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRelationManagerOpen(false);
                        setNewsModal({ mode: "edit", news: item });
                      }}
                      aria-label={`编辑 ${item.title}`}
                      title="编辑学者活动"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-primary-50 hover:text-primary-600"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleNewsDelete(item)}
                      aria-label={`删除 ${item.title}`}
                      title="删除学者活动"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="py-10 text-center text-sm text-gray-400">暂无学者活动</p>
              )}
            </div>
          </div>
        )}
      </BaseModal>
    </aside>
  );
}

/* -- Student Display Component -- */
function StudentDisplay({ student }: { student: StudentRecord }) {
  return (
    <>
      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
        <span className="text-sm font-medium text-gray-900">
          {student.name}
        </span>
        {student.degree_type && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border font-medium",
              degreeColor[student.degree_type] ??
                "bg-gray-100 text-gray-600 border-gray-200",
            )}
          >
            {student.degree_type}
          </span>
        )}
        {student.status && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium",
              statusColor[student.status] ?? "bg-gray-50 text-gray-500",
            )}
          >
            {student.status}
          </span>
        )}
      </div>
      {(student.enrollment_year || student.expected_graduation_year) && (
        <div className="text-xs text-gray-500 mb-1">
          {student.enrollment_year && student.expected_graduation_year
            ? `${student.enrollment_year}–${student.expected_graduation_year}`
            : student.enrollment_year
              ? `${student.enrollment_year} 入学`
              : `预计 ${student.expected_graduation_year} 毕业`}
        </div>
      )}
      {student.home_university && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{student.home_university}</span>
        </div>
      )}
    </>
  );
}

/* -- Student Edit Form Component -- */
function StudentEditForm({
  editForm,
  setEditForm,
  isSaving,
  onSave,
  onCancel,
}: {
  editForm: StudentPatch;
  setEditForm: React.Dispatch<React.SetStateAction<StudentPatch>>;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={editForm.name ?? ""}
        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
        placeholder="姓名 *"
        className="w-full text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
      />
      <div className="flex gap-1">
        <SelectInput
          value={editForm.degree_type ?? ""}
          onChange={(v) => setEditForm((p) => ({ ...p, degree_type: v }))}
          className="flex-1 px-2 py-1 text-sm border-gray-200 rounded focus:ring-1 focus:ring-primary-400"
        >
          <option value="">学位</option>
          {["博士", "硕士", "博士后"].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          value={editForm.status ?? "在读"}
          onChange={(v) => setEditForm((p) => ({ ...p, status: v }))}
          className="flex-1 px-2 py-1 text-sm border-gray-200 rounded focus:ring-1 focus:ring-primary-400"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectInput>
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={editForm.enrollment_year ?? ""}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, enrollment_year: e.target.value }))
          }
          placeholder="入学年份"
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
        <input
          type="text"
          value={editForm.expected_graduation_year ?? ""}
          onChange={(e) =>
            setEditForm((p) => ({
              ...p,
              expected_graduation_year: e.target.value,
            }))
          }
          placeholder="预计毕业"
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
      </div>
      <input
        type="text"
        value={editForm.home_university ?? ""}
        onChange={(e) =>
          setEditForm((p) => ({ ...p, home_university: e.target.value }))
        }
        placeholder="所属高校"
        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
      />
      <div className="flex gap-1">
        <input
          type="text"
          value={editForm.email ?? ""}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, email: e.target.value }))
          }
          placeholder="邮箱"
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
        <input
          type="text"
          value={editForm.phone ?? ""}
          onChange={(e) =>
            setEditForm((p) => ({ ...p, phone: e.target.value }))
          }
          placeholder="电话"
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
      </div>
      <input
        type="text"
        value={editForm.student_no ?? ""}
        onChange={(e) =>
          setEditForm((p) => ({ ...p, student_no: e.target.value }))
        }
        placeholder="学号"
        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
      />
      <textarea
        value={editForm.notes ?? ""}
        onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
        placeholder="备注"
        rows={2}
        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
      />
      <div className="flex gap-1">
        <button
          onClick={onSave}
          disabled={isSaving || !editForm.name?.trim()}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
          {isSaving ? "保存中" : "保存"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-2 py-1.5 border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}

/* -- Student Add Form Component -- */
function StudentAddForm({
  addForm,
  setAddForm,
  isSaving,
  onAdd,
  onCancel,
}: {
  addForm: StudentCreate;
  setAddForm: React.Dispatch<React.SetStateAction<StudentCreate>>;
  isSaving: boolean;
  onAdd: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-2 p-3 border border-primary-100 bg-primary-50/30 rounded-lg space-y-2">
      <p className="text-xs font-semibold text-primary-700">添加学生</p>
      <input
        type="text"
        value={addForm.name}
        onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
        placeholder="姓名 *"
        className="w-full text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
      />
      <div className="flex gap-1">
        <SelectInput
          value={addForm.degree_type ?? "博士"}
          onChange={(v) => setAddForm((p) => ({ ...p, degree_type: v }))}
          className="flex-1 px-2 py-1 text-sm border-gray-200 rounded focus:ring-1 focus:ring-primary-400"
        >
          <option value="">学位</option>
          {["博士", "硕士", "博士后"].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          value={addForm.status ?? "在读"}
          onChange={(v) => setAddForm((p) => ({ ...p, status: v }))}
          className="flex-1 px-2 py-1 text-sm border-gray-200 rounded focus:ring-1 focus:ring-primary-400"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectInput>
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={addForm.enrollment_year ?? ""}
          onChange={(e) =>
            setAddForm((p) => ({ ...p, enrollment_year: e.target.value }))
          }
          placeholder="入学年份"
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
        <input
          type="text"
          value={addForm.expected_graduation_year ?? ""}
          onChange={(e) =>
            setAddForm((p) => ({
              ...p,
              expected_graduation_year: e.target.value,
            }))
          }
          placeholder="预计毕业"
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
      </div>
      <input
        type="text"
        value={addForm.home_university ?? ""}
        onChange={(e) =>
          setAddForm((p) => ({ ...p, home_university: e.target.value }))
        }
        placeholder="所属高校"
        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
      />
      <div className="flex gap-1">
        <input
          type="text"
          value={addForm.email ?? ""}
          onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="邮箱"
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
        <input
          type="text"
          value={addForm.phone ?? ""}
          onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
          placeholder="电话"
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
      </div>
      <input
        type="text"
        value={addForm.student_no ?? ""}
        onChange={(e) =>
          setAddForm((p) => ({ ...p, student_no: e.target.value }))
        }
        placeholder="学号"
        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
      />
      <textarea
        value={addForm.notes ?? ""}
        onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))}
        placeholder="备注"
        rows={2}
        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
      />
      <div className="flex gap-1">
        <button
          onClick={onAdd}
          disabled={!addForm.name.trim() || isSaving}
          className="flex-1 px-3 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? "添加中..." : "添加"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
