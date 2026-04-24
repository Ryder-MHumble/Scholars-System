import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  confirmStudentPublicationCandidate,
  createAcademicPaper,
  deleteAcademicPaper,
  fetchStudentDetail,
  fetchStudentListAll,
  fetchStudentPublicationWorkspace,
  patchStudent,
  rejectStudentPublicationCandidate,
  reopenStudentPublicationCandidate,
  updateAcademicPaper,
  updateStudentPublicationCandidate,
  type StudentPaperRecord,
  type StudentPublicationCandidateDecisionPayload,
  type StudentPublicationCandidatePatchPayload,
  type StudentPublicationCandidateRecord,
  type StudentPublicationWorkspaceResponse,
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

type CandidateReviewForm = {
  affiliation_status: string;
  compliance_reason: string;
  matched_tokens_csv: string;
  checked_affiliations_csv: string;
  note: string;
};

type CandidateAction = "confirm" | "reject" | "reopen";

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

const EMPTY_REVIEW_FORM: CandidateReviewForm = {
  affiliation_status: "unknown",
  compliance_reason: "",
  matched_tokens_csv: "",
  checked_affiliations_csv: "",
  note: "",
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

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN");
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

function sourceTypeLabel(value: string | null | undefined): string {
  const token = (value ?? "").trim();
  if (token === "monitor_api") return "academic-monitor";
  if (token === "legacy_migrated") return "历史迁移";
  if (token === "manual_upload") return "手动录入";
  if (token === "bulk_import") return "批量导入";
  return token || "未标记来源";
}

function affiliationStatusLabel(value: string | null | undefined): string {
  const token = (value ?? "").trim();
  if (token === "compliant") return "合规";
  if (token === "review_needed") return "待复核";
  if (token === "non_compliant") return "不合规";
  return "未判定";
}

function affiliationStatusClass(value: string | null | undefined): string {
  const token = (value ?? "").trim();
  if (token === "compliant") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (token === "review_needed") return "border-amber-200 bg-amber-50 text-amber-700";
  if (token === "non_compliant") return "border-red-200 bg-red-50 text-red-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function candidateStatusLabel(value: string): string {
  if (value === "pending_review") return "待审核";
  if (value === "rejected") return "已拒绝";
  if (value === "confirmed") return "已确认";
  return value || "未标记";
}

function csvToList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toInputDatetime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function fromInputDatetime(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toEditablePaperForm(
  record: Pick<
    StudentPaperRecord | StudentPublicationCandidateRecord,
    "title" | "doi" | "arxiv_id" | "publication_date" | "source" | "authors" | "affiliations" | "abstract"
  >,
): EditablePaperForm {
  return {
    title: record.title ?? "",
    doi: record.doi ?? "",
    arxiv_id: record.arxiv_id ?? "",
    publication_date: toInputDatetime(record.publication_date),
    source: record.source ?? "manual",
    authors_csv: (record.authors ?? []).join(", "),
    affiliations_csv: (record.affiliations ?? []).join(", "),
    abstract: record.abstract ?? "",
  };
}

function extractReviewNote(candidate: StudentPublicationCandidateRecord): string {
  const reviewDecision = candidate.review_decision ?? {};
  const note =
    (typeof reviewDecision.note === "string" ? reviewDecision.note : "") ||
    candidate.compliance_reason ||
    "";
  return note.trim();
}

function summarizeSource(candidate: StudentPublicationCandidateRecord): string {
  const providers = Array.isArray(candidate.source_details?.source_providers)
    ? (candidate.source_details?.source_providers as string[])
    : [];
  const providerText = providers.filter(Boolean).join(" / ");
  const source = (candidate.source ?? "").trim();
  if (providerText && source) return `${source} · ${providerText}`;
  return source || providerText || sourceTypeLabel(candidate.source_type);
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
  tone: "emerald" | "amber" | "red";
}) {
  const styleMap = {
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-700",
    amber: "border-amber-200 bg-amber-50/80 text-amber-700",
    red: "border-red-200 bg-red-50/80 text-red-700",
  } as const;
  return (
    <div
      className={cn(
        "min-w-[112px] rounded-xl border px-3 py-2 text-xs",
        styleMap[tone],
      )}
    >
      <p>{label}</p>
      <p className="mt-1 text-base font-semibold leading-none">{value}</p>
    </div>
  );
}

function MetaTag({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "slate" | "emerald" | "amber" | "red";
}) {
  const styles = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  } as const;
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px]", styles[tone])}>
      {label}
    </span>
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
      <div className="w-full max-w-3xl rounded-xl bg-white border border-gray-100 shadow-xl">
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function PublicationCard({
  paper,
  onEdit,
  onDelete,
}: {
  paper: StudentPaperRecord;
  onEdit: (paper: StudentPaperRecord) => void;
  onDelete: (paper: StudentPaperRecord) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 break-words">{safeText(paper.title)}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <MetaTag label={paper.source?.trim() || "已确认成果"} tone="emerald" />
            <MetaTag label={paper.doi?.trim() ? `DOI ${paper.doi}` : paper.arxiv_id?.trim() ? `arXiv ${paper.arxiv_id}` : "无标准标识"} />
            <MetaTag label={formatDate(paper.publication_date)} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(paper)}
            className="h-8 w-8 rounded-lg border border-slate-200 text-slate-700 inline-flex items-center justify-center"
            title="编辑真实成果"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void onDelete(paper)}
            className="h-8 w-8 rounded-lg border border-red-200 text-red-700 inline-flex items-center justify-center"
            title="删除真实成果"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[11px] text-slate-400">作者</p>
          <p className="mt-1 text-sm text-slate-600 break-words leading-6">
            {paper.authors?.length ? paper.authors.join("，") : "-"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">机构</p>
          <p className="mt-1 text-sm text-slate-600 break-words leading-6">
            {paper.affiliations?.length ? paper.affiliations.join("；") : "-"}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[11px] text-slate-400">摘要</p>
        <p className="mt-1 text-sm text-slate-600 break-words leading-6">
          {safeText(paper.abstract)}
        </p>
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  variant,
  onEdit,
  onConfirm,
  onReject,
  onReopen,
}: {
  candidate: StudentPublicationCandidateRecord;
  variant: "pending" | "rejected";
  onEdit: (candidate: StudentPublicationCandidateRecord) => void;
  onConfirm: (candidate: StudentPublicationCandidateRecord) => void;
  onReject: (candidate: StudentPublicationCandidateRecord) => void;
  onReopen: (candidate: StudentPublicationCandidateRecord) => void;
}) {
  const reviewNote = extractReviewNote(candidate);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 break-words">{safeText(candidate.title)}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <MetaTag label={candidateStatusLabel(candidate.review_status)} tone={variant === "rejected" ? "red" : "amber"} />
            <MetaTag label={affiliationStatusLabel(candidate.affiliation_status)} tone={candidate.affiliation_status === "non_compliant" ? "red" : candidate.affiliation_status === "compliant" ? "emerald" : "amber"} />
            <MetaTag label={sourceTypeLabel(candidate.source_type)} />
            <MetaTag label={summarizeSource(candidate)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(candidate)}
            className="h-8 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs inline-flex items-center gap-1"
          >
            <Pencil className="w-3.5 h-3.5" /> 编辑候选
          </button>
          {variant === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => onConfirm(candidate)}
                className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Yes
              </button>
              <button
                type="button"
                onClick={() => onReject(candidate)}
                className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs inline-flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> No
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onReopen(candidate)}
                className="h-8 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 恢复待审核
              </button>
              <button
                type="button"
                onClick={() => onConfirm(candidate)}
                className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> 直接确认 Yes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[11px] text-slate-400">标准标识</p>
          <p className="mt-1 text-sm text-slate-600 break-all">
            {candidate.doi?.trim() ? `DOI ${candidate.doi}` : candidate.arxiv_id?.trim() ? `arXiv ${candidate.arxiv_id}` : candidate.canonical_uid}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">发布时间 / 最近发现</p>
          <p className="mt-1 text-sm text-slate-600">
            {formatDate(candidate.publication_date)} / {formatDateTime(candidate.last_seen_at)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[11px] text-slate-400">作者</p>
          <p className="mt-1 text-sm text-slate-600 break-words leading-6">
            {candidate.authors?.length ? candidate.authors.join("，") : "-"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">机构</p>
          <p className="mt-1 text-sm text-slate-600 break-words leading-6">
            {candidate.affiliations?.length ? candidate.affiliations.join("；") : "-"}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[11px] text-slate-400">审核说明</p>
        <p className="mt-1 text-sm text-slate-600 break-words leading-6">{safeText(reviewNote)}</p>
      </div>

      <div className="mt-3">
        <p className="text-[11px] text-slate-400">摘要</p>
        <p className="mt-1 text-sm text-slate-600 break-words leading-6">{safeText(candidate.abstract)}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px]", affiliationStatusClass(candidate.affiliation_status))}>
          {affiliationStatusLabel(candidate.affiliation_status)}
        </span>
        {candidate.matched_tokens?.length ? (
          <MetaTag label={`匹配词：${candidate.matched_tokens.join("，")}`} />
        ) : null}
      </div>
    </div>
  );
}

function workspaceFallback(): StudentPublicationWorkspaceResponse {
  return {
    counts: {
      confirmed: 0,
      pending_review: 0,
      rejected: 0,
    },
    confirmed_publications: [],
    pending_candidates: [],
    rejected_candidates: [],
  };
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

  const [workspace, setWorkspace] = useState<StudentPublicationWorkspaceResponse>(workspaceFallback());
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const [studentEditorOpen, setStudentEditorOpen] = useState(false);
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentForm, setStudentForm] = useState<StudentUpdatePayload>({});

  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<StudentPaperRecord | null>(null);
  const [paperForm, setPaperForm] = useState<EditablePaperForm>(EMPTY_PAPER_FORM);
  const [paperSaving, setPaperSaving] = useState(false);

  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<StudentPublicationCandidateRecord | null>(null);
  const [candidateForm, setCandidateForm] = useState<EditablePaperForm>(EMPTY_PAPER_FORM);
  const [candidateSaving, setCandidateSaving] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewCandidate, setReviewCandidate] = useState<StudentPublicationCandidateRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<CandidateAction>("confirm");
  const [reviewForm, setReviewForm] = useState<CandidateReviewForm>(EMPTY_REVIEW_FORM);
  const [reviewSaving, setReviewSaving] = useState(false);

  const backLink = useMemo(() => {
    const prevLocation = locationState?.from;
    if (prevLocation?.pathname) {
      return `${prevLocation.pathname}${prevLocation.search ?? ""}`;
    }
    return window.sessionStorage.getItem("student_list_return_to") ?? "/?tab=students";
  }, [locationState]);

  const confirmedPublications = workspace.confirmed_publications ?? [];
  const pendingCandidates = workspace.pending_candidates ?? [];
  const rejectedCandidates = workspace.rejected_candidates ?? [];

  const refreshWorkspace = async (currentStudentId: string) => {
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      const nextWorkspace = await fetchStudentPublicationWorkspace(currentStudentId);
      setWorkspace(nextWorkspace);
    } catch (err) {
      setWorkspace(workspaceFallback());
      setWorkspaceError(err instanceof Error ? err.message : "学生成果工作台加载失败");
    } finally {
      setWorkspaceLoading(false);
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
    if (!student?.id) return;
    void refreshWorkspace(student.id);
  }, [student?.id]);

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

  const openCreatePaper = () => {
    setEditingPaper(null);
    setPaperForm(EMPTY_PAPER_FORM);
    setPaperModalOpen(true);
  };

  const openEditPaper = (paper: StudentPaperRecord) => {
    setEditingPaper(paper);
    setPaperForm(toEditablePaperForm(paper));
    setPaperModalOpen(true);
  };

  const openCandidateEditor = (candidate: StudentPublicationCandidateRecord) => {
    setEditingCandidate(candidate);
    setCandidateForm(toEditablePaperForm(candidate));
    setCandidateModalOpen(true);
  };

  const openCandidateReview = (
    candidate: StudentPublicationCandidateRecord,
    action: CandidateAction,
  ) => {
    setReviewCandidate(candidate);
    setReviewAction(action);
    setReviewForm({
      affiliation_status: candidate.affiliation_status ?? "unknown",
      compliance_reason: candidate.compliance_reason ?? "",
      matched_tokens_csv: (candidate.matched_tokens ?? []).join(", "),
      checked_affiliations_csv: (candidate.checked_affiliations ?? []).join(", "),
      note: extractReviewNote(candidate),
    });
    setReviewModalOpen(true);
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

  const handleSavePaper = async () => {
    if (!student?.id) {
      setSaveError("缺少学生标识，无法保存成果");
      return;
    }
    if (!paperForm.title.trim()) {
      setSaveError("成果标题不能为空");
      return;
    }

    setPaperSaving(true);
    setSaveError(null);
    try {
      const payload = {
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
        await updateAcademicPaper(student.id, editingPaper.paper_uid, payload);
      } else {
        await createAcademicPaper(student.id, payload);
      }
      setPaperModalOpen(false);
      setEditingPaper(null);
      await refreshWorkspace(student.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "真实成果保存失败");
    } finally {
      setPaperSaving(false);
    }
  };

  const handleDeletePaper = async (paper: StudentPaperRecord) => {
    if (!student?.id || !paper.paper_uid) {
      setSaveError("缺少成果标识，无法删除");
      return;
    }
    if (!window.confirm("确认删除这条已确认成果？")) return;

    setSaveError(null);
    try {
      await deleteAcademicPaper(student.id, paper.paper_uid);
      await refreshWorkspace(student.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "删除真实成果失败");
    }
  };

  const handleSaveCandidate = async () => {
    if (!student?.id || !editingCandidate?.candidate_id) {
      setSaveError("缺少候选成果标识，无法保存");
      return;
    }
    if (!candidateForm.title.trim()) {
      setSaveError("候选成果标题不能为空");
      return;
    }

    setCandidateSaving(true);
    setSaveError(null);
    try {
      const payload: StudentPublicationCandidatePatchPayload = {
        title: candidateForm.title.trim(),
        doi: candidateForm.doi.trim() || null,
        arxiv_id: candidateForm.arxiv_id.trim() || null,
        abstract: candidateForm.abstract.trim() || null,
        publication_date: fromInputDatetime(candidateForm.publication_date),
        source: candidateForm.source.trim() || null,
        authors: csvToList(candidateForm.authors_csv),
        affiliations: csvToList(candidateForm.affiliations_csv),
      };
      await updateStudentPublicationCandidate(student.id, editingCandidate.candidate_id, payload);
      setCandidateModalOpen(false);
      setEditingCandidate(null);
      await refreshWorkspace(student.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "候选成果保存失败");
    } finally {
      setCandidateSaving(false);
    }
  };

  const handleSubmitCandidateAction = async () => {
    if (!student?.id || !reviewCandidate?.candidate_id) {
      setSaveError("缺少候选成果标识，无法执行审核");
      return;
    }
    setReviewSaving(true);
    setSaveError(null);
    try {
      const payload: StudentPublicationCandidateDecisionPayload = {
        reviewed_by: "scholars-system",
        note: reviewForm.note.trim() || null,
        affiliation_status: reviewForm.affiliation_status || null,
        compliance_reason: reviewForm.compliance_reason.trim() || null,
        matched_tokens: csvToList(reviewForm.matched_tokens_csv),
        checked_affiliations: csvToList(reviewForm.checked_affiliations_csv),
        compliance_details: {
          affiliation_status: reviewForm.affiliation_status || null,
          compliance_reason: reviewForm.compliance_reason.trim() || null,
          matched_tokens: csvToList(reviewForm.matched_tokens_csv),
          checked_affiliations: csvToList(reviewForm.checked_affiliations_csv),
        },
      };

      if (reviewAction === "confirm") {
        await confirmStudentPublicationCandidate(student.id, reviewCandidate.candidate_id, payload);
      } else if (reviewAction === "reject") {
        await rejectStudentPublicationCandidate(student.id, reviewCandidate.candidate_id, payload);
      } else {
        await reopenStudentPublicationCandidate(student.id, reviewCandidate.candidate_id, payload);
      }
      setReviewModalOpen(false);
      setReviewCandidate(null);
      await refreshWorkspace(student.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "候选成果审核失败");
    } finally {
      setReviewSaving(false);
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
            className="order-1 xl:order-2 space-y-3"
          >
            <section className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">学生成果审核工作台</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    已确认成果与候选审核分层管理；Yes 会沉淀到真实成果表，No 会留在候选层并参与后续排除。
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 whitespace-nowrap">
                  student_publications + publication_candidates
                </span>
              </div>

              <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2.5">
                <StatChip label="已确认成果" value={workspace.counts.confirmed} tone="emerald" />
                <StatChip label="待审核候选" value={workspace.counts.pending_review} tone="amber" />
                <StatChip label="已拒绝候选" value={workspace.counts.rejected} tone="red" />
              </div>
            </section>

            {workspaceError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {workspaceError}
              </div>
            ) : null}

            <Panel
              title="已确认成果"
              actions={
                <button
                  type="button"
                  onClick={openCreatePaper}
                  className="h-8 px-3 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> 新增真实成果
                </button>
              }
            >
              {workspaceLoading ? (
                <EmptyState text="学生成果工作台加载中..." />
              ) : confirmedPublications.length === 0 ? (
                <EmptyState text="当前没有已确认成果，先在候选区审核 Yes，或直接手动新增。" />
              ) : (
                <div className="space-y-3">
                  {confirmedPublications.map((paper, index) => (
                    <PublicationCard
                      key={paper.paper_uid ?? `${paper.title}-${index}`}
                      paper={paper}
                      onEdit={openEditPaper}
                      onDelete={handleDeletePaper}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="待审核候选">
              {workspaceLoading ? (
                <EmptyState text="候选成果加载中..." />
              ) : pendingCandidates.length === 0 ? (
                <EmptyState text="当前没有待审核候选。" />
              ) : (
                <div className="space-y-3">
                  {pendingCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.candidate_id}
                      candidate={candidate}
                      variant="pending"
                      onEdit={openCandidateEditor}
                      onConfirm={(item) => openCandidateReview(item, "confirm")}
                      onReject={(item) => openCandidateReview(item, "reject")}
                      onReopen={(item) => openCandidateReview(item, "reopen")}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="已拒绝候选">
              {workspaceLoading ? (
                <EmptyState text="已拒绝候选加载中..." />
              ) : rejectedCandidates.length === 0 ? (
                <EmptyState text="当前没有已拒绝候选。" />
              ) : (
                <div className="space-y-3">
                  {rejectedCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.candidate_id}
                      candidate={candidate}
                      variant="rejected"
                      onEdit={openCandidateEditor}
                      onConfirm={(item) => openCandidateReview(item, "confirm")}
                      onReject={(item) => openCandidateReview(item, "reject")}
                      onReopen={(item) => openCandidateReview(item, "reopen")}
                    />
                  ))}
                </div>
              )}
            </Panel>
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
                  onClick={(event) => {
                    if (!student.email) event.preventDefault();
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
                  onClick={(event) => {
                    if (!student.phone) event.preventDefault();
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
                onChange={(event) =>
                  setStudentForm((prev) => ({
                    ...prev,
                    [key]: event.target.value,
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
              onChange={(event) =>
                setStudentForm((prev) => ({ ...prev, notes: event.target.value }))
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
        title={editingPaper ? "编辑已确认成果" : "新增真实成果"}
        onClose={() => setPaperModalOpen(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 md:col-span-2">
            成果标题
            <input
              value={paperForm.title}
              onChange={(event) => setPaperForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            DOI
            <input
              value={paperForm.doi}
              onChange={(event) => setPaperForm((prev) => ({ ...prev, doi: event.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            arXiv ID
            <input
              value={paperForm.arxiv_id}
              onChange={(event) => setPaperForm((prev) => ({ ...prev, arxiv_id: event.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            发表时间
            <input
              type="datetime-local"
              value={paperForm.publication_date}
              onChange={(event) =>
                setPaperForm((prev) => ({ ...prev, publication_date: event.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            来源
            <input
              value={paperForm.source}
              onChange={(event) => setPaperForm((prev) => ({ ...prev, source: event.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            作者
            <input
              value={paperForm.authors_csv}
              onChange={(event) =>
                setPaperForm((prev) => ({ ...prev, authors_csv: event.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
              placeholder="用英文逗号分隔"
            />
          </label>
          <label className="text-xs text-gray-500">
            机构
            <input
              value={paperForm.affiliations_csv}
              onChange={(event) =>
                setPaperForm((prev) => ({ ...prev, affiliations_csv: event.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
              placeholder="用英文逗号分隔"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            摘要
            <textarea
              value={paperForm.abstract}
              onChange={(event) => setPaperForm((prev) => ({ ...prev, abstract: event.target.value }))}
              rows={4}
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
            className="h-8 px-3 rounded-md bg-primary-600 text-white text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            {paperSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </Modal>

      <Modal
        open={candidateModalOpen}
        title="编辑候选成果"
        onClose={() => setCandidateModalOpen(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 md:col-span-2">
            候选标题
            <input
              value={candidateForm.title}
              onChange={(event) => setCandidateForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            DOI
            <input
              value={candidateForm.doi}
              onChange={(event) => setCandidateForm((prev) => ({ ...prev, doi: event.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            arXiv ID
            <input
              value={candidateForm.arxiv_id}
              onChange={(event) => setCandidateForm((prev) => ({ ...prev, arxiv_id: event.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            发表时间
            <input
              type="datetime-local"
              value={candidateForm.publication_date}
              onChange={(event) =>
                setCandidateForm((prev) => ({ ...prev, publication_date: event.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            来源
            <input
              value={candidateForm.source}
              onChange={(event) => setCandidateForm((prev) => ({ ...prev, source: event.target.value }))}
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500">
            作者
            <input
              value={candidateForm.authors_csv}
              onChange={(event) =>
                setCandidateForm((prev) => ({ ...prev, authors_csv: event.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
              placeholder="用英文逗号分隔"
            />
          </label>
          <label className="text-xs text-gray-500">
            机构
            <input
              value={candidateForm.affiliations_csv}
              onChange={(event) =>
                setCandidateForm((prev) => ({ ...prev, affiliations_csv: event.target.value }))
              }
              className="mt-1 w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
              placeholder="用英文逗号分隔"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            摘要
            <textarea
              value={candidateForm.abstract}
              onChange={(event) =>
                setCandidateForm((prev) => ({ ...prev, abstract: event.target.value }))
              }
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCandidateModalOpen(false)}
            className="h-8 px-3 rounded-md border border-gray-200 text-xs text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            disabled={candidateSaving}
            onClick={() => void handleSaveCandidate()}
            className="h-8 px-3 rounded-md bg-primary-600 text-white text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            {candidateSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </Modal>

      <Modal
        open={reviewModalOpen}
        title={
          reviewAction === "confirm"
            ? "确认候选成果"
            : reviewAction === "reject"
              ? "拒绝候选成果"
              : "恢复候选到待审核"
        }
        onClose={() => setReviewModalOpen(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-gray-500">
            合规状态
            <select
              value={reviewForm.affiliation_status}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, affiliation_status: event.target.value }))
              }
              className="mt-1 w-full h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            >
              <option value="unknown">未判定</option>
              <option value="compliant">合规</option>
              <option value="review_needed">待复核</option>
              <option value="non_compliant">不合规</option>
            </select>
          </label>
          <label className="text-xs text-gray-500">
            匹配词
            <input
              value={reviewForm.matched_tokens_csv}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, matched_tokens_csv: event.target.value }))
              }
              className="mt-1 w-full h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
              placeholder="用英文逗号分隔"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            已检查机构
            <input
              value={reviewForm.checked_affiliations_csv}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, checked_affiliations_csv: event.target.value }))
              }
              className="mt-1 w-full h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
              placeholder="用英文逗号分隔"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            合规说明
            <textarea
              value={reviewForm.compliance_reason}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, compliance_reason: event.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            审核备注
            <textarea
              value={reviewForm.note}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, note: event.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setReviewModalOpen(false)}
            className="h-8 px-3 rounded-md border border-gray-200 text-xs text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            disabled={reviewSaving}
            onClick={() => void handleSubmitCandidateAction()}
            className={cn(
              "h-8 px-3 rounded-md text-xs inline-flex items-center gap-1.5 disabled:opacity-60",
              reviewAction === "confirm"
                ? "bg-emerald-600 text-white"
                : reviewAction === "reject"
                  ? "bg-red-600 text-white"
                  : "bg-slate-700 text-white",
            )}
          >
            {reviewAction === "confirm" ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : reviewAction === "reject" ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            {reviewSaving
              ? "提交中..."
              : reviewAction === "confirm"
                ? "确认 Yes"
                : reviewAction === "reject"
                  ? "确认 No"
                  : "恢复待审核"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
