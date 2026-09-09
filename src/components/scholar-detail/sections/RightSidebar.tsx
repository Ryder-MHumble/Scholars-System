import { useCallback, useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  Upload,
  X,
  Save,
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
} from "@/services/scholarApi";
import {
  createActivity,
  fetchScholarActivities,
  invalidateScholarActivityCache,
  type ActivityCreateRequest,
  type ActivityEvent,
} from "@/services/activityApi";
import { SelectInput } from "@/components/ui/SelectInput";
import { parseScholarActivitiesFromText } from "@/utils/textParsers";

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

function formatActivityDate(event: ActivityEvent): string {
  const date = new Date(event.event_date);
  if (Number.isNaN(date.getTime())) return "日期待定";
  const dateLabel = date.toLocaleDateString("zh-CN");
  const timeLabel =
    event.event_time?.trim() ||
    (() => {
      const h = date.getHours();
      const m = date.getMinutes();
      if (h === 0 && m === 0) return "";
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    })();
  return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
}

export function RightSidebar({ scholar }: Props) {
  const location = useLocation();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StudentPatch>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<StudentCreate>(emptyAddForm());
  const [isSaving, setIsSaving] = useState(false);
  const [scholarActivities, setScholarActivities] = useState<ActivityEvent[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [showActivityImport, setShowActivityImport] = useState(false);
  const [activeTab, setActiveTab] = useState<"coauthors" | "activities">(
    "coauthors",
  );

  // Check if scholar is adjunct supervisor
  const isAdjunctSupervisor = Boolean(scholar.adjunct_supervisor?.status);
  const coauthors = [...(scholar.coauthors ?? [])].sort(
    (a, b) => b.weight - a.weight,
  );

  const loadScholarActivities = useCallback(async (isActive: () => boolean = () => true) => {
    setIsActivityLoading(true);
    setActivityError(null);
    try {
      const items = await fetchScholarActivities(scholar.url_hash);
      if (!isActive()) return;
      setScholarActivities(items);
    } catch {
      if (!isActive()) return;
      setScholarActivities([]);
      setActivityError("学者活动加载失败");
    } finally {
      if (isActive()) setIsActivityLoading(false);
    }
  }, [scholar.url_hash]);

  useEffect(() => {
    let isActive = true;
    void loadScholarActivities(() => isActive);
    return () => {
      isActive = false;
    };
  }, [loadScholarActivities]);

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

  const handleImportActivities = async (activities: ActivityCreateRequest[]) => {
    const normalize = (value: string) => value.trim().toLocaleLowerCase();
    const existingKeys = new Set(
      scholarActivities.map(
        (item) => `${normalize(item.title)}|${String(item.event_date ?? "").slice(0, 10)}`,
      ),
    );
    const rows = activities
      .map((item) => ({
        ...item,
        scholar_ids: [scholar.url_hash],
      }))
      .filter((item) => {
        if (!item.title.trim()) return false;
        const key = `${normalize(item.title)}|${String(item.event_date ?? "").slice(0, 10)}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });
    if (rows.length === 0) return;

    for (const row of rows) {
      await createActivity(row);
    }
    invalidateScholarActivityCache(scholar.url_hash);
    await loadScholarActivities();
    setActiveTab("activities");
  };

  return (
    <aside className="w-80 shrink-0 space-y-4">
      {/* Scholar Activities Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-900">学者活动</h3>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {activeTab === "coauthors"
              ? `${coauthors.length} 人`
              : `${scholarActivities.length} 条`}
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveTab("activities");
              setShowActivityImport(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-full transition-colors"
          >
            <Upload className="w-3 h-3" />
            批量识别
          </button>
        </div>

        <div className="px-5 pt-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("coauthors")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg border-b-2 transition-colors",
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
              onClick={() => setActiveTab("activities")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg border-b-2 transition-colors",
                activeTab === "activities"
                  ? "text-primary-700 border-primary-600 bg-primary-50/40"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50",
              )}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>学者活动</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
          {activeTab === "coauthors" ? (
            coauthors.length > 0 ? (
              <div className="space-y-3">
                {coauthors.map((coauthor) => (
                  <a
                    key={coauthor.aminer_id || `${coauthor.name}-${coauthor.name_zh}`}
                    href={`https://www.aminer.cn/profile/${coauthor.aminer_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-3 border border-gray-100 hover:border-primary-200 rounded-lg transition-all duration-200 hover:bg-primary-50/30"
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
          ) : isActivityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
            </div>
          ) : activityError ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <ClipboardList className="w-8 h-8 text-red-100" />
              <p className="text-sm text-red-500">{activityError}</p>
              <button
                type="button"
                onClick={() => loadScholarActivities()}
                className="text-xs text-primary-600 hover:underline"
              >
                重新加载
              </button>
            </div>
          ) : scholarActivities.length > 0 ? (
            <div className="space-y-3">
              {scholarActivities.map((activity) => (
                <Link
                  key={activity.id}
                  to={`/activities/${activity.id}`}
                  state={{
                    from: {
                      pathname: location.pathname,
                      search: location.search,
                    },
                  }}
                  className="block p-3 border border-gray-100 hover:border-primary-200 rounded-lg transition-all duration-200 hover:bg-primary-50/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium text-gray-900 line-clamp-2">
                      {activity.title || "未命名活动"}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                      {activity.event_type || "活动"}
                    </span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                      {activity.category || "未分类"}
                    </span>
                    <span>{formatActivityDate(activity)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <ClipboardList className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">暂无关联活动</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Students Card - Only show for adjunct supervisors */}
      {isAdjunctSupervisor && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
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

          <div className="px-5 py-3 max-h-[540px] overflow-y-auto scrollbar-hide">
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
      {showActivityImport && (
        <ScholarActivityPasteImportModal
          onClose={() => setShowActivityImport(false)}
          onSubmit={async (items) => {
            await handleImportActivities(items);
            setShowActivityImport(false);
          }}
        />
      )}
    </aside>
  );
}

function ScholarActivityPasteImportModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (items: ActivityCreateRequest[]) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const parsedItems = useMemo(() => parseScholarActivitiesFromText(text), [text]);

  const handleSubmit = async () => {
    if (parsedItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(parsedItems);
    } finally {
      setIsSubmitting(false);
    }
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
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="mx-4 flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                批量识别学者活动
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                直接复制粘贴多行活动文本，系统会自动识别标题、日期、类型、分类和地点。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoFocus
            rows={8}
            placeholder={
              "示例：\n学者活动标题 | 2026-09-08 14:00 | 学术报告 | 学者活动 | 武汉大学 | 活动摘要\n标题：AI for Science Seminar；日期：2026-09-09；类型：讲座；分类：学者活动；地点：线上；摘要：分享最新研究进展"
            }
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />

          <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-blue-700">
                自动识别预览 {parsedItems.length} 条
              </p>
              <p className="text-[11px] text-slate-400">
                导入后会自动绑定当前学者
              </p>
            </div>
            {parsedItems.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                粘贴活动文本后在这里预览
              </p>
            ) : (
              <div className="space-y-2">
                {parsedItems.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-lg border border-blue-100 bg-white px-3 py-2"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {[item.event_date, item.event_time, item.event_type, item.category, item.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.abstract && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {item.abstract}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || parsedItems.length === 0}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "导入中..." : `导入 ${parsedItems.length} 条`}
          </button>
        </div>
      </motion.div>
    </motion.div>
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
