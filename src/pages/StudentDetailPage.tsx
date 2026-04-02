import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  GraduationCap,
  Mail,
  Phone,
  Pencil,
  Save,
  X,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  fetchStudentDetail,
  fetchStudentListAll,
  patchStudent,
  fetchAcademicStudents,
  fetchAcademicStudentPapers,
  createAcademicPaper,
  updateAcademicPaper,
  updateAcademicPaperCompliance,
  deleteAcademicPaper,
  type AcademicPaperCompliancePayload,
  type AcademicPaperUpsertPayload,
  type StudentPaperRecord,
  type StudentRecord,
  type StudentUpdatePayload,
} from "@/services/studentApi";
import { cn } from "@/utils/cn";

type StudentDetailLocationState = {
  from?: { pathname?: string; search?: string };
  studentSnapshot?: StudentRecord;
};

type EditablePaperForm = {
  title: string;
  doi: string;
  arxiv_id: string;
  publication_date: string;
  source: string;
  authors_csv: string;
  affiliations_csv: string;
  abstract: string;
};

type ComplianceForm = {
  affiliation_status: string;
  compliance_reason: string;
  matched_tokens_csv: string;
};

const EMPTY_PAPER_FORM: EditablePaperForm = {
  title: "",
  doi: "",
  arxiv_id: "",
  publication_date: "",
  source: "manual",
  authors_csv: "",
  affiliations_csv: "",
  abstract: "",
};

const EMPTY_COMPLIANCE_FORM: ComplianceForm = {
  affiliation_status: "unknown",
  compliance_reason: "",
  matched_tokens_csv: "",
};

function safeText(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text || "-";
}

function parseYear(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = String(value).match(/(\d{4})/);
  return match ? match[1] : null;
}

function formatEnrollmentYear(value: string | null | undefined): string {
  const year = parseYear(value);
  return year ? `${year}级` : "-";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function statusClass(status: string): string {
  if (status === "毕业") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "实习") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

function complianceClass(status: string): string {
  const normalized = status.trim();
  if (normalized === "通过" || normalized === "已通过") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (normalized === "待补材料" || normalized === "待复核") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }
  if (normalized === "不通过" || normalized === "高风险") {
    return "bg-red-50 text-red-700 border-red-100";
  }
  return "bg-gray-50 text-gray-600 border-gray-200";
}

function classifyCompliance(status: string): "pass" | "pending" | "risk" | "other" {
  const normalized = status.trim();
  if (normalized === "通过" || normalized === "已通过") return "pass";
  if (normalized === "待补材料" || normalized === "待复核") return "pending";
  if (normalized === "不通过" || normalized === "高风险") return "risk";
  return "other";
}

function csvToList(value: string): string[] {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toInputDatetime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function fromInputDatetime(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizePaper(paper: StudentPaperRecord): StudentPaperRecord {
  const year = paper.year ?? parseYear(paper.publication_date ?? undefined) ?? "";
  const venue = paper.venue ?? paper.source ?? "";
  const complianceStatus =
    paper.compliance_status ??
    (paper.affiliation_status === "compliant"
      ? "已通过"
      : paper.affiliation_status === "review_needed"
        ? "待补材料"
        : paper.affiliation_status === "non_compliant"
          ? "高风险"
          : "未标记");

  return {
    ...paper,
    venue,
    year,
    compliance_status: complianceStatus,
    compliance_note: paper.compliance_note ?? paper.compliance_reason ?? "",
  };
}

function Panel({
  title,
  children,
  compact = false,
  actions,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
  actions?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur",
        compact ? "p-3.5" : "p-4",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-gray-800">{title}</h2>
        {actions}
      </div>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function LabelValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="py-2 border-b border-slate-100 last:border-b-0">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700 break-words leading-6">{value}</p>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "red" | "slate";
}) {
  const styleMap = {
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-700",
    amber: "border-amber-200 bg-amber-50/80 text-amber-700",
    red: "border-red-200 bg-red-50/80 text-red-700",
    slate: "border-slate-200 bg-slate-50/90 text-slate-600",
  } as const;
  return (
    <div
      className={cn(
        "min-w-[96px] rounded-xl border px-3 py-2 text-xs",
        styleMap[tone],
      )}
    >
      <p>{label}</p>
      <p className="mt-1 text-base font-semibold leading-none">{value}</p>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white border border-gray-100 shadow-xl">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const location = useLocation();

  const locationState = (location.state ?? null) as StudentDetailLocationState | null;
  const snapshot = locationState?.studentSnapshot ?? null;

  const [student, setStudent] = useState<StudentRecord | null>(snapshot);
  const [isLoading, setIsLoading] = useState(!snapshot);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [papers, setPapers] = useState<StudentPaperRecord[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersError, setPapersError] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const [targetHint, setTargetHint] = useState<string | null>(null);

  const [studentEditorOpen, setStudentEditorOpen] = useState(false);
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentForm, setStudentForm] = useState<StudentUpdatePayload>({});

  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<StudentPaperRecord | null>(null);
  const [paperForm, setPaperForm] = useState<EditablePaperForm>(EMPTY_PAPER_FORM);
  const [paperSaving, setPaperSaving] = useState(false);

  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [compliancePaper, setCompliancePaper] = useState<StudentPaperRecord | null>(null);
  const [complianceForm, setComplianceForm] = useState<ComplianceForm>(EMPTY_COMPLIANCE_FORM);
  const [complianceSaving, setComplianceSaving] = useState(false);

  const backLink = useMemo(() => {
    const prevLocation = locationState?.from;
    if (prevLocation?.pathname) {
      return `${prevLocation.pathname}${prevLocation.search ?? ""}`;
    }
    return window.sessionStorage.getItem("student_list_return_to") ?? "/?tab=students";
  }, [locationState]);

  const refreshPapers = async (studentRecord: StudentRecord) => {
    setPapersLoading(true);
    setPapersError(null);
    setTargetHint(null);

    try {
      let resolvedTargetKey: string | null = null;
      let paperResp: { items: StudentPaperRecord[] } | null = null;
      const hints: string[] = [];

      if (studentRecord.id?.startsWith("student_")) {
        try {
          paperResp = await fetchAcademicStudentPapers(studentRecord.id);
          resolvedTargetKey = studentRecord.id;
        } catch {
          resolvedTargetKey = null;
        }
      }

      if (!resolvedTargetKey) {
        const candidates = await fetchAcademicStudents(studentRecord.name, 1, 100);
        const exact = candidates.items.filter((x) => x.name === studentRecord.name);
        const matched = (exact.length > 0 ? exact : candidates.items)[0] ?? null;
        if (matched) {
          resolvedTargetKey = matched.target_key;
          if (exact.length > 1) {
            hints.push("按姓名匹配到多个 academic-monitor 目标，已自动选择第一项");
          }
        }
      }

      setTargetKey(resolvedTargetKey);
      if (!resolvedTargetKey) {
        setPapers([]);
        setPapersError("未在 academic-monitor 匹配到该学生，无法加载论文与合规数据。");
        setTargetHint("请检查学生姓名或先在 academic-monitor 建立该学生目标");
        return;
      }

      if (!paperResp) {
        paperResp = await fetchAcademicStudentPapers(resolvedTargetKey);
      }
      const normalized = (paperResp.items ?? []).map(normalizePaper);
      setPapers(normalized);
      hints.unshift(`academic-monitor 目标：${resolvedTargetKey}`);
      setTargetHint(hints.join("；"));
    } catch {
      setPapers([]);
      setPapersError("academic-monitor 接口不可用，无法加载论文与合规数据。");
      setTargetHint(null);
      setTargetKey(null);
    } finally {
      setPapersLoading(false);
    }
  };

  useEffect(() => {
    if (!studentId) {
      setError("缺少学生ID");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const hasMatchedSnapshot = Boolean(snapshot && snapshot.id === studentId);

    if (!hasMatchedSnapshot) {
      setIsLoading(true);
    }
    setError(null);

    const load = async () => {
      try {
        const detail = await fetchStudentDetail(studentId, controller.signal);
        if (controller.signal.aborted) return;
        setStudent(detail);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;

        if (hasMatchedSnapshot && snapshot) {
          setStudent(snapshot);
          setError(null);
          return;
        }

        try {
          const all = await fetchStudentListAll({ page_size: 500 }, controller.signal);
          if (controller.signal.aborted) return;
          const matched = all.find((item) => item.id === studentId) ?? null;
          if (matched) {
            setStudent(matched);
            setError(null);
          } else {
            setStudent(null);
            setError(err instanceof Error ? err.message : "学生详情加载失败");
          }
        } catch {
          if (controller.signal.aborted) return;
          setStudent(null);
          setError(err instanceof Error ? err.message : "学生详情加载失败");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => controller.abort();
  }, [snapshot, studentId]);

  useEffect(() => {
    if (!student) return;
    void refreshPapers(student);
  }, [student]);

  useEffect(() => {
    if (!student) return;
    setStudentForm({
      scholar_id: student.scholar_id || "",
      mentor_name: student.mentor_name || "",
      student_no: student.student_no || "",
      name: student.name || "",
      home_university: student.home_university || "",
      major: student.major || "",
      degree_type: student.degree_type || "",
      enrollment_year: parseYear(student.enrollment_year) || "",
      expected_graduation_year: parseYear(student.expected_graduation_year) || "",
      status: student.status || "在读",
      email: student.email || "",
      phone: student.phone || "",
      notes: student.notes || "",
      updated_by: "scholars-system",
    });
  }, [student]);

  const complianceStats = useMemo(() => {
    const initial = { pass: 0, pending: 0, risk: 0, other: 0 };
    papers.forEach((paper) => {
      const status = (paper.compliance_status ?? "").trim() || "未标记";
      const key = classifyCompliance(status);
      initial[key] += 1;
    });
    return initial;
  }, [papers]);

  const openCreatePaper = () => {
    setEditingPaper(null);
    setPaperForm(EMPTY_PAPER_FORM);
    setPaperModalOpen(true);
  };

  const openEditPaper = (paper: StudentPaperRecord) => {
    setEditingPaper(paper);
    setPaperForm({
      title: paper.title ?? "",
      doi: paper.doi ?? "",
      arxiv_id: paper.arxiv_id ?? "",
      publication_date: toInputDatetime(paper.publication_date),
      source: paper.source ?? "manual",
      authors_csv: (paper.authors ?? []).join(", "),
      affiliations_csv: (paper.affiliations ?? []).join(", "),
      abstract: paper.abstract ?? "",
    });
    setPaperModalOpen(true);
  };

  const openComplianceEditor = (paper: StudentPaperRecord) => {
    setCompliancePaper(paper);
    setComplianceForm({
      affiliation_status: paper.affiliation_status ?? "unknown",
      compliance_reason: paper.compliance_reason ?? "",
      matched_tokens_csv: (paper.matched_tokens ?? []).join(", "),
    });
    setComplianceModalOpen(true);
  };

  const handleSaveStudent = async () => {
    if (!student) return;
    setStudentSaving(true);
    setSaveError(null);
    try {
      const updated = await patchStudent(student.id, studentForm);
      setStudent(updated);
      setStudentEditorOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "学生信息保存失败");
    } finally {
      setStudentSaving(false);
    }
  };

  const openStudentEditor = () => {
    if (!student) return;
    setStudentForm({
      scholar_id: student.scholar_id || "",
      mentor_name: student.mentor_name || "",
      student_no: student.student_no || "",
      name: student.name || "",
      home_university: student.home_university || "",
      major: student.major || "",
      degree_type: student.degree_type || "",
      enrollment_year: parseYear(student.enrollment_year) || "",
      expected_graduation_year: parseYear(student.expected_graduation_year) || "",
      status: student.status || "在读",
      email: student.email || "",
      phone: student.phone || "",
      notes: student.notes || "",
      updated_by: "scholars-system",
    });
    setStudentEditorOpen(true);
  };

  const handleSavePaper = async () => {
    if (!targetKey) {
      setSaveError("未匹配 academic-monitor 目标，无法保存论文");
      return;
    }
    if (!paperForm.title.trim()) {
      setSaveError("论文标题不能为空");
      return;
    }

    setPaperSaving(true);
    setSaveError(null);
    try {
      const payload: AcademicPaperUpsertPayload = {
        title: paperForm.title.trim(),
        doi: paperForm.doi.trim() || null,
        arxiv_id: paperForm.arxiv_id.trim() || null,
        abstract: paperForm.abstract.trim() || null,
        publication_date: fromInputDatetime(paperForm.publication_date),
        source: paperForm.source.trim() || "manual",
        authors: csvToList(paperForm.authors_csv),
        affiliations: csvToList(paperForm.affiliations_csv),
      };

      if (editingPaper?.paper_uid) {
        await updateAcademicPaper(targetKey, editingPaper.paper_uid, payload);
      } else {
        await createAcademicPaper(targetKey, payload);
      }
      setPaperModalOpen(false);
      setEditingPaper(null);
      if (student) await refreshPapers(student);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "论文保存失败");
    } finally {
      setPaperSaving(false);
    }
  };

  const handleSaveCompliance = async () => {
    if (!targetKey || !compliancePaper?.paper_uid) {
      setSaveError("缺少论文标识，无法保存合规结果");
      return;
    }
    setComplianceSaving(true);
    setSaveError(null);
    try {
      const payload: AcademicPaperCompliancePayload = {
        affiliation_status: complianceForm.affiliation_status || null,
        compliance_reason: complianceForm.compliance_reason.trim() || null,
        matched_tokens: csvToList(complianceForm.matched_tokens_csv),
        assessed_at: new Date().toISOString(),
      };
      await updateAcademicPaperCompliance(
        targetKey,
        compliancePaper.paper_uid,
        payload,
      );
      setComplianceModalOpen(false);
      setCompliancePaper(null);
      if (student) await refreshPapers(student);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "合规保存失败");
    } finally {
      setComplianceSaving(false);
    }
  };

  const handleDeletePaper = async (paper: StudentPaperRecord) => {
    if (!targetKey || !paper.paper_uid) {
      setSaveError("缺少论文标识，无法删除");
      return;
    }
    if (!window.confirm("确认删除该论文？")) return;

    setSaveError(null);
    try {
      await deleteAcademicPaper(targetKey, paper.paper_uid);
      if (student) await refreshPapers(student);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "删除论文失败");
    }
  };

  if (isLoading && !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        学生详情加载中...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-100 rounded-2xl p-6 w-full max-w-md text-center">
          <p className="text-red-500 text-sm">{error ?? "未找到该学生"}</p>
          <Link
            to={backLink}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" /> 返回学生列表
          </Link>
        </div>
      </div>
    );
  }

  const mentorName = student.mentor_name || student.scholar_name;
  const enrollmentYear = parseYear(student.enrollment_year);
  const graduationYear = parseYear(student.expected_graduation_year);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <div className="max-w-[1720px] mx-auto px-2.5 md:px-3.5 lg:px-4 py-4 md:py-5">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-center gap-3">
            <Link
              to={backLink}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary-600"
            >
              <ArrowLeft className="w-4 h-4" /> 返回学生列表
            </Link>
            <span className="hidden md:inline h-4 w-px bg-slate-200" />
            <span className="text-sm text-slate-900 font-semibold">{safeText(student.name)}</span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <span>{safeText(student.home_university)}</span>
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded-full border",
                statusClass(student.status || "在读"),
              )}
            >
              {student.status || "在读"}
            </span>
          </div>
        </motion.div>

        {saveError && (
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {saveError}
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_292px] gap-3 md:gap-3.5">
          <motion.aside
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="order-2 xl:order-1 space-y-3 xl:sticky xl:top-3 self-start"
          >
            <Panel
              title="学生档案"
              actions={
                <button
                  type="button"
                  onClick={openStudentEditor}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-primary-600"
                >
                  <Pencil className="w-3.5 h-3.5" /> 编辑资料
                </button>
              }
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center text-lg font-semibold shrink-0">
                  {safeText(student.name).slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-slate-900 break-words">{safeText(student.name)}</h1>
                  <p className="text-sm text-slate-500 mt-0.5 break-words">{safeText(student.major)}</p>
                  <p className="text-xs text-slate-400 mt-1">{safeText(student.degree_type)}</p>
                </div>
              </div>

              <div className="mt-3">
                <LabelValue label="导师" value={safeText(mentorName)} />
                <LabelValue label="共建高校" value={safeText(student.home_university)} />
                <LabelValue label="年级" value={formatEnrollmentYear(student.enrollment_year)} />
                <LabelValue label="学号" value={safeText(student.student_no)} />
                <LabelValue label="预计毕业" value={safeText(graduationYear)} />
              </div>
            </Panel>

            <Panel title="联系方式" compact>
              <div className="space-y-1.5">
                <LabelValue label="邮箱" value={safeText(student.email)} />
                <LabelValue label="电话" value={safeText(student.phone)} />
              </div>
            </Panel>

            <Panel title="培养轨迹" compact>
              <div className="space-y-2">
                <div className="inline-flex items-start gap-2 text-sm text-gray-700">
                  <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5" />
                  入学：{safeText(enrollmentYear)}
                </div>
                <div className="inline-flex items-start gap-2 text-sm text-gray-700">
                  <CalendarClock className="w-4 h-4 text-gray-400 mt-0.5" />
                  预计毕业：{safeText(graduationYear)}
                </div>
              </div>
            </Panel>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="order-1 xl:order-2"
          >
            <section className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">论文与合规工作台</h2>
                  <p className="text-xs text-slate-500 mt-0.5">论文列表、合规标记与维护操作集中在中间区域</p>
                  {targetHint && <p className="text-[11px] text-slate-500 mt-1.5 break-all">{targetHint}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {targetKey && (
                    <button
                      type="button"
                      onClick={openCreatePaper}
                      className="h-8 px-3 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" /> 新增论文
                    </button>
                  )}
                  <span
                    className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50/80 text-emerald-700 whitespace-nowrap"
                  >
                    academic-monitor
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2.5">
                <StatChip label="已通过" value={complianceStats.pass} tone="emerald" />
                <StatChip label="待补材料" value={complianceStats.pending} tone="amber" />
                <StatChip label="高风险" value={complianceStats.risk} tone="red" />
                <StatChip label="未标记" value={complianceStats.other} tone="slate" />
              </div>

              {papersLoading ? (
                <div className="h-52 flex items-center justify-center text-sm text-slate-400">
                  论文与合规信息加载中...
                </div>
              ) : papersError ? (
                <div className="h-52 flex items-center justify-center text-sm text-red-500 px-4 text-center">
                  {papersError}
                </div>
              ) : papers.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-slate-400">
                  academic-monitor 中暂无论文与合规数据
                </div>
              ) : (
                <div className="overflow-auto max-h-[69vh]">
                  <table className="w-full text-left min-w-[980px] table-fixed">
                    <colgroup>
                      <col className="w-[46%]" />
                      <col className="w-[12%]" />
                      <col className="w-[8%]" />
                      <col className="w-[12%]" />
                      <col className="w-[16%]" />
                      <col className="w-[6%]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-slate-50/95 z-10 backdrop-blur">
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-[11px] font-semibold text-slate-500">论文标题</th>
                        <th className="px-3 py-3 text-[11px] font-semibold text-slate-500">来源</th>
                        <th className="px-3 py-3 text-[11px] font-semibold text-slate-500">年份</th>
                        <th className="px-3 py-3 text-[11px] font-semibold text-slate-500">合规状态</th>
                        <th className="px-3 py-3 text-[11px] font-semibold text-slate-500">合规说明</th>
                        <th className="px-3 py-3 text-[11px] font-semibold text-slate-500 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {papers.map((paper, idx) => {
                        const compliance = (paper.compliance_status ?? "").trim() || "未标记";
                        return (
                          <tr
                            key={paper.paper_uid ?? paper.id ?? `${paper.title}-${idx}`}
                            className={cn(
                              "border-b border-slate-100 last:border-b-0",
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                            )}
                          >
                            <td className="px-4 py-3 text-slate-800 font-medium leading-6 break-words">
                              {safeText(paper.title)}
                            </td>
                            <td className="px-3 py-3 text-slate-600 truncate">{safeText(paper.venue)}</td>
                            <td className="px-3 py-3 text-slate-600">{safeText(String(paper.year ?? ""))}</td>
                            <td className="px-3 py-3">
                              <span
                                className={cn(
                                  "inline-flex text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap",
                                  complianceClass(compliance),
                                )}
                              >
                                {compliance}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-600 leading-6 break-words">{safeText(paper.compliance_note)}</td>
                            <td className="px-3 py-3 sticky right-0 bg-inherit">
                              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => openEditPaper(paper)}
                                  disabled={!targetKey}
                                  title="编辑论文"
                                  className="h-7 w-7 rounded-md border border-slate-200 text-slate-700 inline-flex items-center justify-center disabled:opacity-50"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openComplianceEditor(paper)}
                                  disabled={!targetKey || !paper.paper_uid}
                                  title="编辑合规"
                                  className="h-7 w-7 rounded-md border border-blue-200 text-blue-700 inline-flex items-center justify-center disabled:opacity-50"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeletePaper(paper)}
                                  disabled={!targetKey || !paper.paper_uid}
                                  title="删除论文"
                                  className="h-7 w-7 rounded-md border border-red-200 text-red-700 inline-flex items-center justify-center disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </motion.main>

          <motion.aside
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="order-3 space-y-3 xl:sticky xl:top-3 self-start"
          >
            <Panel title="备注" compact>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words min-h-[80px]">
                {safeText(student.notes)}
              </p>
            </Panel>

            <Panel title="系统信息" compact>
              <div className="space-y-1.5">
                <LabelValue label="关联导师ID" value={safeText(student.scholar_id)} />
                <LabelValue label="录入人" value={safeText(student.added_by)} />
                <LabelValue label="创建时间" value={formatDateTime(student.created_at)} />
                <LabelValue label="更新时间" value={formatDateTime(student.updated_at)} />
              </div>
            </Panel>

            <Panel title="快速操作" compact>
              <div className="flex flex-col gap-2">
                <a
                  href={student.email ? `mailto:${student.email}` : undefined}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs border inline-flex items-center gap-1.5 justify-center",
                    student.email
                      ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                      : "border-gray-100 text-gray-300 cursor-not-allowed",
                  )}
                  onClick={(e) => {
                    if (!student.email) e.preventDefault();
                  }}
                >
                  <Mail className="w-3.5 h-3.5" /> 发送邮件
                </a>
                <a
                  href={student.phone ? `tel:${student.phone}` : undefined}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs border inline-flex items-center gap-1.5 justify-center",
                    student.phone
                      ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                      : "border-gray-100 text-gray-300 cursor-not-allowed",
                  )}
                  onClick={(e) => {
                    if (!student.phone) e.preventDefault();
                  }}
                >
                  <Phone className="w-3.5 h-3.5" /> 拨打电话
                </a>
              </div>
            </Panel>
          </motion.aside>
        </div>
      </div>

      <Modal
        open={studentEditorOpen}
        title="编辑学生资料"
        onClose={() => setStudentEditorOpen(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ["学生姓名", "name"],
            ["导师姓名", "mentor_name"],
            ["导师ID", "scholar_id"],
            ["学号", "student_no"],
            ["共建高校", "home_university"],
            ["专业", "major"],
            ["培养类型", "degree_type"],
            ["入学年份", "enrollment_year"],
            ["预计毕业年份", "expected_graduation_year"],
            ["状态", "status"],
            ["邮箱", "email"],
            ["电话", "phone"],
          ].map(([label, key]) => (
            <label key={key} className="text-xs text-gray-500">
              {label}
              <input
                value={String((studentForm as Record<string, unknown>)[key] ?? "")}
                onChange={(e) =>
                  setStudentForm((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className="mt-1 w-full h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
              />
            </label>
          ))}
          <label className="text-xs text-gray-500 md:col-span-2">
            备注
            <textarea
              value={studentForm.notes ?? ""}
              onChange={(e) =>
                setStudentForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setStudentEditorOpen(false)}
            className="h-8 px-3 rounded-md border border-gray-200 text-xs text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            disabled={studentSaving}
            onClick={() => void handleSaveStudent()}
            className="h-8 px-3 rounded-md bg-primary-600 text-white text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            {studentSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </Modal>

      <Modal
        open={paperModalOpen}
        title={editingPaper ? "编辑论文" : "新增论文"}
        onClose={() => setPaperModalOpen(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 md:col-span-2">
            论文标题
            <input
              value={paperForm.title}
              onChange={(e) => setPaperForm((s) => ({ ...s, title: e.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            DOI
            <input
              value={paperForm.doi}
              onChange={(e) => setPaperForm((s) => ({ ...s, doi: e.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            arXiv ID
            <input
              value={paperForm.arxiv_id}
              onChange={(e) => setPaperForm((s) => ({ ...s, arxiv_id: e.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            发表时间
            <input
              type="datetime-local"
              value={paperForm.publication_date}
              onChange={(e) =>
                setPaperForm((s) => ({ ...s, publication_date: e.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            来源
            <input
              value={paperForm.source}
              onChange={(e) => setPaperForm((s) => ({ ...s, source: e.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            作者（逗号分隔）
            <input
              value={paperForm.authors_csv}
              onChange={(e) =>
                setPaperForm((s) => ({ ...s, authors_csv: e.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            单位（逗号分隔）
            <input
              value={paperForm.affiliations_csv}
              onChange={(e) =>
                setPaperForm((s) => ({ ...s, affiliations_csv: e.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            摘要
            <textarea
              rows={3}
              value={paperForm.abstract}
              onChange={(e) =>
                setPaperForm((s) => ({ ...s, abstract: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPaperModalOpen(false)}
            className="h-8 px-3 rounded-md border border-gray-200 text-xs text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            disabled={paperSaving}
            onClick={() => void handleSavePaper()}
            className="h-8 px-3 rounded-md bg-primary-600 text-white text-xs disabled:opacity-60"
          >
            {paperSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </Modal>

      <Modal
        open={complianceModalOpen}
        title="编辑合规状态"
        onClose={() => setComplianceModalOpen(false)}
      >
        <div className="grid grid-cols-1 gap-3">
          <label className="text-xs text-gray-500">
            合规状态
            <select
              value={complianceForm.affiliation_status}
              onChange={(e) =>
                setComplianceForm((s) => ({ ...s, affiliation_status: e.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            >
              <option value="unknown">unknown</option>
              <option value="compliant">compliant</option>
              <option value="review_needed">review_needed</option>
              <option value="non_compliant">non_compliant</option>
            </select>
          </label>
          <label className="text-xs text-gray-500">
            匹配 token（逗号分隔）
            <input
              value={complianceForm.matched_tokens_csv}
              onChange={(e) =>
                setComplianceForm((s) => ({ ...s, matched_tokens_csv: e.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            合规说明
            <textarea
              rows={4}
              value={complianceForm.compliance_reason}
              onChange={(e) =>
                setComplianceForm((s) => ({ ...s, compliance_reason: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setComplianceModalOpen(false)}
            className="h-8 px-3 rounded-md border border-gray-200 text-xs text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            disabled={complianceSaving}
            onClick={() => void handleSaveCompliance()}
            className="h-8 px-3 rounded-md bg-primary-600 text-white text-xs disabled:opacity-60"
          >
            {complianceSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
