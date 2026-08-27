import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Filter, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { ComboboxInput } from "@/components/ui/ComboboxInput";
import { Pagination } from "@/components/common/Pagination";
import { fetchStudentListAll, fetchStudentOptions, type StudentRecord } from "@/services/studentApi";
import { exportStudentsToExcel } from "@/utils/studentExcel";

const YEARS = ["2024", "2025", "2026"];
const ALL_MENTOR = "全部导师";
const ALL_UNIVERSITY = "全部高校";
const ALL_STUDENTS_SUBTAB = "student_all";
const PAGE_SIZE = 20;
type StatusFilter = "all" | "in院" | "out院";

function parseYear(value: string | null | undefined): string | null {
  const match = String(value ?? "").match(/(20\d{2})/);
  return match && YEARS.includes(match[1]) ? match[1] : null;
}
function gradeToSubtab(year: string) { return `student_grade_${year}`; }
function subtabToYear(subtab: string | null): string | null {
  const match = String(subtab ?? "").match(/^student_grade_(20\d{2})$/);
  return match && YEARS.includes(match[1]) ? match[1] : null;
}
function safeText(value: string | null | undefined) { return String(value ?? "").trim() || "-"; }
function formatEnrollmentYear(value: string | null | undefined) { const year = parseYear(value); return year ? `${year}级` : "-"; }
function statusClass(status: string) {
  if (status === "毕业" || status === "离院" || status === "离校") return "bg-slate-100 text-slate-600 border-slate-200";
  if (status === "实习") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}
function matchesStatus(student: StudentRecord, filter: StatusFilter) {
  if (filter === "all") return true;
  const status = String(student.status ?? "").trim();
  const outStatuses = new Set(["离院", "离校", "毕业"]);
  return filter === "out院" ? outStatuses.has(status) : !outStatuses.has(status);
}

export default function StudentListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubtab = searchParams.get("subtab");
  const isAllStudents = activeSubtab === ALL_STUDENTS_SUBTAB;
  const activeYear = isAllStudents ? null : subtabToYear(activeSubtab);
  const universityFromUrl = String(searchParams.get("university") ?? "").trim();

  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);
  const [mentorOptions, setMentorOptions] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState(ALL_MENTOR);
  const [selectedUniversity, setSelectedUniversity] = useState(ALL_UNIVERSITY);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    const returnTo = `${location.pathname}${location.search || "?tab=students"}`;
    window.sessionStorage.setItem("student_list_return_to", returnTo);
  }, [location.pathname, location.search]);
  useEffect(() => {
    if (searchParams.get("tab") !== "students") return;
    if (activeSubtab === ALL_STUDENTS_SUBTAB || activeYear) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", "students"); next.set("subtab", ALL_STUDENTS_SUBTAB);
    setSearchParams(next, { replace: true });
  }, [activeSubtab, activeYear, searchParams, setSearchParams]);
  useEffect(() => {
    const timer = window.setTimeout(() => { setSearchKeyword(searchInput.trim()); setPage(1); }, 260);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    setSelectedMentor(ALL_MENTOR); setSelectedUniversity(universityFromUrl || ALL_UNIVERSITY);
    setUniversitySearch(""); setSearchInput(""); setSearchKeyword(""); setStatusFilter("all"); setPage(1);
  }, [activeSubtab, universityFromUrl]);
  useEffect(() => {
    let cancelled = false;
    void fetchStudentOptions().then((options) => {
      if (cancelled) return;
      setMentorOptions(options.mentors ?? []);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [reloadSeed]);

  const scopedStudents = useMemo(() => allStudents.filter((student) => {
    if (activeYear && parseYear(student.enrollment_year) !== activeYear) return false;
    if (selectedMentor !== ALL_MENTOR && (student.mentor_name || student.scholar_name) !== selectedMentor) return false;
    if (searchKeyword) {
      const haystack = [student.name, student.mentor_name, student.scholar_name, student.major, student.home_university].join(" ").toLowerCase();
      if (!haystack.includes(searchKeyword.toLowerCase())) return false;
    }
    return matchesStatus(student, statusFilter);
  }), [activeYear, allStudents, searchKeyword, selectedMentor, statusFilter]);
  const normalizedUniversity = (value: string | null | undefined) => String(value ?? "").trim();
  const visibleStudents = useMemo(() => {
    const filtered = selectedUniversity === ALL_UNIVERSITY ? scopedStudents : scopedStudents.filter((student) => normalizedUniversity(student.home_university) === selectedUniversity);
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [page, scopedStudents, selectedUniversity]);
  const total = selectedUniversity === ALL_UNIVERSITY ? scopedStudents.length : scopedStudents.filter((student) => normalizedUniversity(student.home_university) === selectedUniversity).length;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const universityCounts = useMemo(() => scopedStudents.reduce<Record<string, number>>((counts, student) => {
    const university = normalizedUniversity(student.home_university);
    if (university) counts[university] = (counts[university] ?? 0) + 1;
    return counts;
  }, {}), [scopedStudents]);
  const sidebarUniversities = useMemo(() => {
    const names = Object.keys(universityCounts).sort((a, b) => (universityCounts[b] ?? 0) - (universityCounts[a] ?? 0) || a.localeCompare(b));
    const keyword = universitySearch.trim().toLowerCase();
    return keyword ? names.filter((name) => name.toLowerCase().includes(keyword)) : names;
  }, [universityCounts, universitySearch]);
  const mentorSelectOptions = useMemo(() => Array.from(new Set([...mentorOptions, ...scopedStudents.map((student) => student.mentor_name || student.scholar_name).filter(Boolean)])).sort((a, b) => a.localeCompare(b)), [mentorOptions, scopedStudents]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true); setError(null);
    void fetchStudentListAll({ page_size: 200, enrollment_year: activeYear ?? undefined }, controller.signal).then((items) => {
      if (!controller.signal.aborted) setAllStudents(items);
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "学生数据加载失败");
    }).finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [activeYear, reloadSeed]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const selectSubtab = (subtab: string) => { const next = new URLSearchParams(searchParams); next.set("tab", "students"); next.set("subtab", subtab); setSearchParams(next); };
  const handleOpenDetail = (student: StudentRecord) => navigate(`/students/${student.id}`, { state: { from: location, studentSnapshot: student } });
  const handleExport = () => { setIsExporting(true); try { exportStudentsToExcel(selectedUniversity === ALL_UNIVERSITY ? scopedStudents : scopedStudents.filter((student) => normalizedUniversity(student.home_university) === selectedUniversity)); } finally { setIsExporting(false); } };
  const resetFilters = () => { setSearchInput(""); setSearchKeyword(""); setSelectedMentor(ALL_MENTOR); setSelectedUniversity(ALL_UNIVERSITY); setStatusFilter("all"); setPage(1); };
  const scopeLabel = activeYear ? `${activeYear}级` : "全部学生";
  const statusButtons: Array<[StatusFilter, string]> = [["all", "全部"], ["in院", "在院"], ["out院", "离院"]];

  return <div className="h-full overflow-hidden flex bg-gray-50"><aside className="hidden md:flex w-56 bg-white border-r border-gray-200 shrink-0 flex-col overflow-hidden"><div className="px-3.5 py-3 border-b border-gray-100"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-800">共建高校</h3><span className="text-xs text-gray-500">{sidebarUniversities.length} 所</span></div><p className="text-[11px] text-gray-400 mt-1 truncate">{scopeLabel}</p><div className="relative mt-2.5"><Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" /><input value={universitySearch} onChange={(event) => setUniversitySearch(event.target.value)} placeholder="搜索高校" className="h-8 w-full pl-8 pr-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300" /></div></div><div className="p-2 overflow-y-auto custom-scrollbar space-y-1"><button onClick={() => { setSelectedUniversity(ALL_UNIVERSITY); setPage(1); }} className={cn("w-full text-left rounded-lg px-3 py-2 text-sm border transition-colors", selectedUniversity === ALL_UNIVERSITY ? "bg-primary-50 text-primary-700 border-primary-200" : "bg-white text-gray-700 border-transparent hover:bg-gray-50")}><span className="flex items-center justify-between"><span>{ALL_UNIVERSITY}</span><span className="text-xs text-gray-400">{scopedStudents.length}</span></span></button>{sidebarUniversities.map((university) => <button key={university} onClick={() => { setSelectedUniversity(university); setPage(1); }} className={cn("w-full rounded-lg px-3 py-2 text-sm border transition-colors text-left", selectedUniversity === university ? "bg-primary-50 text-primary-700 border-primary-200" : "bg-white text-gray-700 border-transparent hover:bg-gray-50")}><span className="flex items-center justify-between gap-2"><span className="truncate">{university}</span><span className="text-xs text-gray-400">{universityCounts[university] ?? 0}</span></span></button>)}</div></aside><div className="flex-1 overflow-y-auto custom-scrollbar"><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="p-6 md:p-8"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-bold text-gray-900">学生</h2><p className="text-sm text-gray-500 mt-1">当前范围 <span className="font-semibold text-gray-700">{scopeLabel}</span>，共 <span className="font-semibold text-gray-700">{total}</span> 人</p></div><button onClick={handleExport} disabled={isExporting || total === 0} className="h-10 px-3 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-60"><Download className="w-4 h-4" />导出 Excel</button></div><div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5 mb-4"><div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,1fr)_220px_auto] gap-3 items-center"><div className="relative"><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="搜索学生姓名、导师或专业" className="h-11 w-full pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300" /></div><ComboboxInput value={selectedMentor === ALL_MENTOR ? "" : selectedMentor} onChange={(value) => { setSelectedMentor(value || ALL_MENTOR); setPage(1); }} options={mentorSelectOptions} placeholder={ALL_MENTOR} clearable /><button onClick={resetFilters} className="h-11 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-700">清空条件</button></div><div className="mt-4 flex items-center justify-between gap-3 flex-wrap"><div className="flex items-center gap-2">{statusButtons.map(([value, label]) => <button key={value} onClick={() => { setStatusFilter(value); setPage(1); }} className={cn("h-8 px-3.5 rounded-full border text-sm transition-colors", statusFilter === value ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}>{label}</button>)}</div><div className="flex items-center gap-2 flex-wrap"><button onClick={() => selectSubtab(ALL_STUDENTS_SUBTAB)} className={cn("h-8 px-3.5 rounded-full border text-sm transition-colors", isAllStudents ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}>全部学生</button>{YEARS.map((year) => <button key={year} onClick={() => selectSubtab(gradeToSubtab(year))} className={cn("h-8 px-3.5 rounded-full border text-sm transition-colors", activeYear === year ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}>{year}级</button>)}</div></div><div className="mt-3 flex items-center gap-2 text-xs text-gray-500 flex-wrap"><span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1"><Filter className="w-3 h-3" />导师：{selectedMentor}</span><span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1">范围：{selectedUniversity}</span><span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1">状态：{statusButtons.find(([value]) => value === statusFilter)?.[1]}</span><span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1">共 {total} 人</span></div></div><AnimatePresence mode="wait">{isLoading ? <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 h-72 flex items-center justify-center text-sm text-gray-400">加载中...</motion.div> : error ? <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-red-100 h-72 flex flex-col items-center justify-center text-sm text-red-500 px-4"><p>{error}</p><button onClick={() => setReloadSeed((value) => value + 1)} className="mt-2 text-primary-600 hover:underline">重试</button></motion.div> : visibleStudents.length === 0 ? <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 h-72 flex items-center justify-center text-sm text-gray-400">当前筛选条件下暂无学生</motion.div> : <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"><div className="overflow-x-auto max-h-[calc(100vh-390px)] overflow-y-auto custom-scrollbar"><table className="min-w-[980px] w-full text-left border-collapse"><thead className="sticky top-0 z-10"><tr className="border-b border-gray-100">{["学生", "导师", "共建高校", "年级", "专业", "联系方式"].map((label) => <th key={label} className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/90">{label}</th>)}</tr></thead><tbody className="text-sm">{visibleStudents.map((student, index) => <tr key={student.id} onClick={() => handleOpenDetail(student)} className={cn("group border-b border-gray-50 last:border-b-0 hover:bg-primary-50/40 transition-colors cursor-pointer", index % 2 === 0 ? "bg-white" : "bg-gray-50/20")} title="进入学生详情"><td className="px-5 py-3.5 border-l-2 border-transparent group-hover:border-primary-400"><p className="font-semibold text-gray-800 group-hover:text-primary-700">{safeText(student.name)}</p><div className="mt-1 flex items-center gap-1.5"><span className={cn("inline-flex text-[11px] px-1.5 py-0.5 rounded-full border", statusClass(student.status || "在读"))}>{student.status || "在读"}</span><span className="text-[11px] text-gray-400">学号 {safeText(student.student_no)}</span></div></td><td className="px-4 py-3.5 text-gray-600">{safeText(student.mentor_name || student.scholar_name)}</td><td className="px-4 py-3.5 text-gray-600">{safeText(student.home_university)}</td><td className="px-4 py-3.5 text-gray-600">{formatEnrollmentYear(student.enrollment_year)}</td><td className="px-4 py-3.5 text-gray-600">{safeText(student.major)}</td><td className="px-4 py-3.5 text-gray-600"><p>{safeText(student.email)}</p><p className="text-xs text-gray-400 mt-0.5">{safeText(student.phone)}</p></td></tr>)}</tbody></table></div><Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} /></motion.div>}</AnimatePresence></motion.div></div></div>;
}
