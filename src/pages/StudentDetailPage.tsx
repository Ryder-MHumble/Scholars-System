import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Mail, Pencil, Phone, Save } from "lucide-react";
import { BaseModal } from "@/components/common/BaseModal";
import { fetchScholarActivities, type ActivityEvent } from "@/services/activityApi";
import {
  fetchStudentDetail,
  fetchStudentListAll,
  fetchStudentPublicationWorkspace,
  patchStudent,
  type StudentPaperRecord,
  type StudentRecord,
  type StudentUpdatePayload,
} from "@/services/studentApi";
import { cn } from "@/utils/cn";

type StudentDetailLocationState = {
  from?: { pathname?: string; search?: string };
  studentSnapshot?: StudentRecord;
};

function safeText(value: string | null | undefined): string {
  return String(value ?? "").trim() || "-";
}

function formatEnrollmentYear(value: string | null | undefined): string {
  const match = String(value ?? "").match(/(20\d{2})/);
  return match ? `${match[1]}级` : "-";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-CN");
}

function statusClass(status: string): string {
  if (status === "毕业") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "实习") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

function Panel({ title, children, compact = false }: { title: string; children: ReactNode; compact?: boolean }) {
  return <section className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]", compact ? "p-4" : "p-5")}><h2 className="text-sm font-semibold text-slate-900">{title}</h2><div className="mt-3">{children}</div></section>;
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 py-1.5 text-sm"><span className="shrink-0 text-slate-400">{label}</span><span className="min-w-0 text-right text-slate-700 break-words">{value}</span></div>;
}

function PublicationCard({ paper }: { paper: StudentPaperRecord }) {
  const source = String(paper.source ?? "").trim();
  const isLink = /^https?:\/\//i.test(source);
  return <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 text-sm font-semibold leading-6 text-slate-900 break-words">{safeText(paper.title)}</h3>{isLink && <a href={source} target="_blank" rel="noreferrer" title="打开成果来源" className="shrink-0 text-slate-400 hover:text-primary-600"><ExternalLink className="h-4 w-4" /></a>}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{safeText(paper.venue)}</span><span>{formatDate(paper.publication_date)}</span><span>{safeText(paper.compliance_status === "compliant" ? "已确认" : paper.compliance_status)}</span></div>{paper.authors && paper.authors.length > 0 && <p className="mt-2 text-xs leading-5 text-slate-600 break-words">作者：{paper.authors.join("；")}</p>}{paper.abstract && <p className="mt-2 text-xs leading-5 text-slate-500 line-clamp-3">{paper.abstract}</p>}</article>;
}

function ActivityCard({ activity }: { activity: ActivityEvent }) {
  return <article className="rounded-xl border border-violet-100 bg-violet-50/40 p-4"><h3 className="text-sm font-semibold leading-6 text-slate-900 break-words">{safeText(activity.title)}</h3><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{formatDate(activity.event_date)}</span><span>{safeText(activity.event_type)}</span><span>{safeText(activity.location)}</span></div></article>;
}

type StudentForm = Required<Pick<StudentUpdatePayload, "name" | "mentor_name" | "student_no" | "home_university" | "major" | "degree_type" | "enrollment_year" | "status" | "email" | "phone">>;

const EMPTY_STUDENT_FORM: StudentForm = {
  name: "",
  mentor_name: "",
  student_no: "",
  home_university: "",
  major: "",
  degree_type: "",
  enrollment_year: "",
  status: "在读",
  email: "",
  phone: "",
};

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const location = useLocation();
  const locationState = (location.state ?? null) as StudentDetailLocationState | null;
  const snapshot = locationState?.studentSnapshot ?? null;
  const [student, setStudent] = useState<StudentRecord | null>(snapshot);
  const [isLoading, setIsLoading] = useState(!snapshot);
  const [error, setError] = useState<string | null>(null);
  const [publications, setPublications] = useState<StudentPaperRecord[]>([]);
  const [publicationsLoading, setPublicationsLoading] = useState(false);
  const [publicationsError, setPublicationsError] = useState<string | null>(null);
  const [xaiActivities, setXaiActivities] = useState<ActivityEvent[]>([]);
  const [xaiLoading, setXaiLoading] = useState(false);
  const [studentEditorOpen, setStudentEditorOpen] = useState(false);
  const [studentForm, setStudentForm] = useState<StudentForm>(EMPTY_STUDENT_FORM);
  const [studentSaving, setStudentSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const backLink = useMemo(() => {
    const previous = locationState?.from;
    if (previous?.pathname) return `${previous.pathname}${previous.search ?? ""}`;
    return window.sessionStorage.getItem("student_list_return_to") ?? "/?tab=students";
  }, [locationState]);

  const openStudentEditor = () => {
    if (!student) return;
    setStudentForm({
      name: student.name ?? "",
      mentor_name: student.mentor_name ?? student.scholar_name ?? "",
      student_no: student.student_no ?? "",
      home_university: student.home_university ?? "",
      major: student.major ?? "",
      degree_type: student.degree_type ?? "",
      enrollment_year: String(student.enrollment_year ?? ""),
      status: student.status || "在读",
      email: student.email ?? "",
      phone: student.phone ?? "",
    });
    setSaveError(null);
    setStudentEditorOpen(true);
  };

  const saveStudent = async () => {
    if (!student?.id || !studentForm.name.trim()) {
      setSaveError("学生姓名不能为空");
      return;
    }
    setStudentSaving(true);
    setSaveError(null);
    try {
      const updated = await patchStudent(student.id, {
        ...studentForm,
        name: studentForm.name.trim(),
        enrollment_year: String(studentForm.enrollment_year).match(/(20\d{2})/)?.[1] ?? studentForm.enrollment_year.trim(),
        updated_by: "scholars-system",
      });
      setStudent(updated);
      setStudentEditorOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "学生信息保存失败");
    } finally {
      setStudentSaving(false);
    }
  };

  useEffect(() => {
    if (!studentId) { setError("缺少学生ID"); setIsLoading(false); return; }
    const controller = new AbortController();
    const hasSnapshot = Boolean(snapshot && snapshot.id === studentId);
    if (!hasSnapshot) setIsLoading(true);
    void fetchStudentDetail(studentId, controller.signal).then(setStudent).catch(async (err: unknown) => {
      if (controller.signal.aborted) return;
      if (hasSnapshot && snapshot) { setStudent(snapshot); return; }
      try {
        const items = await fetchStudentListAll({ page_size: 500 }, controller.signal);
        const matched = items.find((item) => item.id === studentId) ?? null;
        setStudent(matched);
        if (!matched) setError(err instanceof Error ? err.message : "学生详情加载失败");
      } catch { setError(err instanceof Error ? err.message : "学生详情加载失败"); }
    }).finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [snapshot, studentId]);

  useEffect(() => {
    if (!student?.id) return;
    const controller = new AbortController();
    setPublicationsLoading(true);
    setPublicationsError(null);
    void fetchStudentPublicationWorkspace(student.id).then((workspace) => {
      if (!controller.signal.aborted) setPublications(workspace.confirmed_publications ?? []);
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setPublicationsError(err instanceof Error ? err.message : "已确认成果加载失败");
    }).finally(() => { if (!controller.signal.aborted) setPublicationsLoading(false); });
    return () => controller.abort();
  }, [student?.id]);

  useEffect(() => {
    const scholarId = String(student?.scholar_id ?? "").trim();
    if (!scholarId) { setXaiActivities([]); setXaiLoading(false); return; }
    let cancelled = false;
    setXaiLoading(true);
    void fetchScholarActivities(scholarId).then((items) => {
      if (cancelled) return;
      setXaiActivities(items.filter((item) => item.series === "XAI智汇讲坛"));
    }).catch(() => { if (!cancelled) setXaiActivities([]); }).finally(() => { if (!cancelled) setXaiLoading(false); });
    return () => { cancelled = true; };
  }, [student?.scholar_id]);

  if (isLoading && !student) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">学生详情加载中...</div>;
  if (error || !student) return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="bg-white border border-red-100 rounded-2xl p-6 w-full max-w-md text-center"><p className="text-red-500 text-sm">{error ?? "未找到该学生"}</p><Link to={backLink} className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"><ArrowLeft className="w-4 h-4" />返回学生列表</Link></div></div>;

  const mentorName = student.mentor_name || student.scholar_name;
  return <><div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]"><div className="max-w-[1440px] mx-auto px-3 md:px-5 py-4 md:py-6"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3"><Link to={backLink} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary-600"><ArrowLeft className="w-4 h-4" />返回学生列表</Link><div className="inline-flex items-center gap-2 text-xs text-slate-500"><span>{safeText(student.home_university)}</span><span className={cn("inline-flex px-2 py-0.5 rounded-full border", statusClass(student.status || "在读"))}>{student.status || "在读"}</span></div></div>{saveError && <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</div>}
    <div className="mt-4 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start"><motion.aside initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 xl:sticky xl:top-4"><Panel title="基本信息"><div className="flex items-start gap-3"><div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center text-lg font-semibold shrink-0">{safeText(student.name).slice(0, 1)}</div><div className="min-w-0"><h1 className="text-xl font-semibold text-slate-900 break-words">{safeText(student.name)}</h1><p className="text-sm text-slate-500 mt-0.5 break-words">{safeText(student.major)}</p><p className="text-xs text-slate-400 mt-1 break-words">{safeText(student.degree_type)}</p></div></div><div className="mt-3"><LabelValue label="导师" value={safeText(mentorName)} /><LabelValue label="共建高校" value={safeText(student.home_university)} /><LabelValue label="年级" value={formatEnrollmentYear(student.enrollment_year)} /><LabelValue label="学号" value={safeText(student.student_no)} /></div><button type="button" onClick={openStudentEditor} className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary-600"><Pencil className="w-3.5 h-3.5" />编辑基本信息</button></Panel><Panel title="联系方式" compact><LabelValue label="邮箱" value={safeText(student.email)} /><LabelValue label="电话" value={safeText(student.phone)} /><div className="mt-2 flex gap-2">{student.email && <a href={`mailto:${student.email}`} title="发送邮件" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><Mail className="w-3.5 h-3.5" /></a>}{student.phone && <a href={`tel:${student.phone}`} title="拨打电话" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><Phone className="w-3.5 h-3.5" /></a>}</div></Panel></motion.aside>
      <motion.main initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4"><Panel title="已确认学术成果"><div className="flex items-center justify-between gap-3"><p className="text-xs text-slate-500">仅展示已确认的学术成果，候选成果与审核状态不在学生页面展示。</p><span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">{publications.length} 条</span></div>{publicationsError ? <p className="mt-4 text-sm text-red-600">{publicationsError}</p> : publicationsLoading ? <p className="mt-4 text-sm text-slate-400">成果加载中...</p> : publications.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">暂无已确认成果</p> : <div className="mt-4 space-y-3">{publications.map((paper, index) => <PublicationCard key={paper.paper_uid ?? `${paper.title}-${index}`} paper={paper} />)}</div>}</Panel>{(xaiLoading || xaiActivities.length > 0) && <Panel title="导师关联的 XAI 活动"><p className="text-xs text-slate-500">来源于 XAI 智汇讲坛活动库，仅表示导师关联活动，不代表学生本人参加。</p>{xaiLoading ? <p className="mt-4 text-sm text-slate-400">活动加载中...</p> : <div className="mt-4 space-y-3">{xaiActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div>}</Panel>}</motion.main></div>
  </div></div><BaseModal isOpen={studentEditorOpen} onClose={() => setStudentEditorOpen(false)} title="编辑学生基本信息" maxWidth="2xl" footer={<><button type="button" onClick={() => setStudentEditorOpen(false)} className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700">取消</button><button type="button" onClick={() => void saveStudent()} disabled={studentSaving} className="h-9 px-3 rounded-lg bg-primary-600 text-white text-sm inline-flex items-center gap-1.5 disabled:opacity-60"><Save className="w-3.5 h-3.5" />{studentSaving ? "保存中..." : "保存"}</button></>}><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{([["学生姓名", "name"], ["导师", "mentor_name"], ["学号", "student_no"], ["共建高校", "home_university"], ["专业", "major"], ["培养类型", "degree_type"], ["入学年份", "enrollment_year"], ["邮箱", "email"], ["电话", "phone"]] as const).map(([label, key]) => <label key={key} className="text-xs text-gray-500">{label}<input value={studentForm[key]} onChange={(event) => setStudentForm((prev) => ({ ...prev, [key]: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2 text-sm text-gray-700" /></label>)}<label className="text-xs text-gray-500">状态<select value={studentForm.status} onChange={(event) => setStudentForm((prev) => ({ ...prev, status: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2 text-sm text-gray-700"><option value="在读">在读</option><option value="实习">实习</option><option value="离院">离院</option><option value="毕业">毕业</option></select></label></div></BaseModal></>;
}
