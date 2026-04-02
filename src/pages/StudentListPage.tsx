import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { BaseModal } from "@/components/common/BaseModal";
import { SelectInput } from "@/components/ui/SelectInput";
import { ComboboxInput } from "@/components/ui/ComboboxInput";
import { Pagination } from "@/components/common/Pagination";
import {
  createStudent,
  deleteStudent,
  fetchAcademicStudents,
  fetchStudentList,
  fetchStudentListAll,
  fetchStudentOptions,
  type AcademicStudentSummary,
  type StudentCreatePayload,
  type StudentRecord,
} from "@/services/studentApi";
import { BatchStudentImportModal } from "@/components/student/BatchStudentImportModal";
import { exportStudentsToExcel } from "@/utils/studentExcel";

const DEFAULT_YEARS = ["2024", "2025", "2026"];
const ALL_MENTOR = "全部导师";
const ALL_UNIVERSITY = "全部高校";
const ALL_STUDENTS_SUBTAB = "student_all";
const PAGE_SIZE = 20;

type StudentForm = {
  name: string;
  enrollment_year: string;
  student_no: string;
  home_university: string;
  mentor_name: string;
  major: string;
  degree_type: string;
  expected_graduation_year: string;
  email: string;
  phone: string;
  notes: string;
  status: string;
};

const EMPTY_FORM: StudentForm = {
  name: "",
  enrollment_year: "",
  student_no: "",
  home_university: "",
  mentor_name: "",
  major: "",
  degree_type: "",
  expected_graduation_year: "",
  email: "",
  phone: "",
  notes: "",
  status: "在读",
};

function parseYear(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = String(value).match(/(\d{4})/);
  return match ? match[1] : null;
}

function displayGrade(year: string): string {
  return `${year}级`;
}

function gradeToSubtab(year: string): string {
  return `student_grade_${year}`;
}

function subtabToYear(subtab: string | null): string | null {
  if (!subtab) return null;
  const match = subtab.match(/^student_grade_(\d{4})$/);
  return match ? match[1] : null;
}

function sortYears(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => /^\d{4}$/.test(v)))).sort(
    (a, b) => Number(b) - Number(a),
  );
}

function safeText(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text || "-";
}

function statusClass(status: string): string {
  if (status === "毕业") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "实习") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

function formatEnrollmentYear(value: string | null | undefined): string {
  const year = parseYear(value);
  return year ? displayGrade(year) : "-";
}

function StudentFormFields({
  form,
  setForm,
  mentorOptions,
  universityOptions,
}: {
  form: StudentForm;
  setForm: Dispatch<SetStateAction<StudentForm>>;
  mentorOptions: string[];
  universityOptions: string[];
}) {
  const inputClass =
    "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">学生姓名 *</p>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            placeholder="请输入姓名"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">入学年级</p>
          <input
            value={form.enrollment_year}
            onChange={(e) => setForm((prev) => ({ ...prev, enrollment_year: e.target.value }))}
            className={inputClass}
            placeholder="例如 2025 或 2025级"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">学号</p>
          <input
            value={form.student_no}
            onChange={(e) => setForm((prev) => ({ ...prev, student_no: e.target.value }))}
            className={inputClass}
            placeholder="例如 20250001"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">共建高校</p>
          <ComboboxInput
            value={form.home_university}
            onChange={(value) => setForm((prev) => ({ ...prev, home_university: value }))}
            options={universityOptions}
            placeholder="输入或选择高校"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">指导导师</p>
          <ComboboxInput
            value={form.mentor_name}
            onChange={(value) => setForm((prev) => ({ ...prev, mentor_name: value }))}
            options={mentorOptions}
            placeholder="输入或选择导师"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">专业</p>
          <input
            value={form.major}
            onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))}
            className={inputClass}
            placeholder="例如 人工智能"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">学位类型</p>
          <input
            value={form.degree_type}
            onChange={(e) => setForm((prev) => ({ ...prev, degree_type: e.target.value }))}
            className={inputClass}
            placeholder="例如 硕士 / 博士"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">状态</p>
          <SelectInput
            value={form.status}
            onChange={(v) => setForm((prev) => ({ ...prev, status: v }))}
            className="h-10 py-0"
          >
            <option value="在读">在读</option>
            <option value="实习">实习</option>
            <option value="毕业">毕业</option>
          </SelectInput>
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">邮箱</p>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className={inputClass}
            placeholder="example@domain.com"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">电话</p>
          <input
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            className={inputClass}
            placeholder="选填"
          />
        </label>

        <label className="block">
          <p className="text-xs font-medium text-gray-500 mb-1.5">预计毕业年份</p>
          <input
            value={form.expected_graduation_year}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, expected_graduation_year: e.target.value }))
            }
            className={inputClass}
            placeholder="例如 2028"
          />
        </label>
      </div>

      <label className="block">
        <p className="text-xs font-medium text-gray-500 mb-1.5">备注</p>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 resize-none"
          placeholder="选填"
        />
      </label>
    </div>
  );
}

export default function StudentListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [years, setYears] = useState<string[]>(DEFAULT_YEARS);
  const activeSubtab = searchParams.get("subtab");
  const universityFromUrl = (searchParams.get("university") ?? "").trim();
  const isAllStudents = activeSubtab === ALL_STUDENTS_SUBTAB;
  const yearFromUrl = subtabToYear(activeSubtab);
  const fallbackYear = years[0] ?? DEFAULT_YEARS[0];
  const activeYear = isAllStudents ? null : yearFromUrl ?? fallbackYear;

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [allUniversitiesTotal, setAllUniversitiesTotal] = useState(0);
  const [universityTotalCounts, setUniversityTotalCounts] = useState<Record<string, number>>(
    {},
  );
  const [problemPaperOnly, setProblemPaperOnly] = useState(false);
  const [problemPaperNameIndex, setProblemPaperNameIndex] = useState<Record<string, true>>({});
  const [problemPaperTargetIndex, setProblemPaperTargetIndex] = useState<Record<string, true>>({});
  const [problemPaperIndexReady, setProblemPaperIndexReady] = useState(false);
  const [problemPaperIndexError, setProblemPaperIndexError] = useState<string | null>(null);

  const [mentorOptions, setMentorOptions] = useState<string[]>([]);
  const [universityOptions, setUniversityOptions] = useState<string[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState(ALL_MENTOR);
  const [selectedUniversity, setSelectedUniversity] = useState(ALL_UNIVERSITY);

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeInput, setGradeInput] = useState("");

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState<StudentForm>(EMPTY_FORM);

  const [showBatchImportModal, setShowBatchImportModal] = useState(false);

  useEffect(() => {
    const returnTo = `${location.pathname}${location.search || "?tab=students"}`;
    window.sessionStorage.setItem("student_list_return_to", returnTo);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (searchParams.get("tab") !== "students") return;
    if (activeSubtab === ALL_STUDENTS_SUBTAB || yearFromUrl) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", "students");
    next.set("subtab", ALL_STUDENTS_SUBTAB);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, activeSubtab, yearFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim());
      setPage(1);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSelectedMentor(ALL_MENTOR);
    setSelectedUniversity(universityFromUrl || ALL_UNIVERSITY);
    setSearchInput("");
    setSearchKeyword("");
    setUniversitySearch("");
    setPage(1);
  }, [activeSubtab, universityFromUrl]);

  useEffect(() => {
    let cancelled = false;
    fetchStudentOptions()
      .then((options) => {
        if (cancelled) return;
        const optionYears = (options.grades ?? [])
          .map((v) => parseYear(v))
          .filter((v): v is string => Boolean(v));
        setYears((prev) => sortYears([...prev, ...optionYears]));
        setMentorOptions(options.mentors ?? []);
        setUniversityOptions(options.universities ?? []);
      })
      .catch(() => {
        if (cancelled) return;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setProblemPaperIndexReady(false);
    setProblemPaperIndexError(null);

    const loadProblemPaperIndex = async () => {
      try {
        const pageSize = 200;
        const firstPage = await fetchAcademicStudents(undefined, 1, pageSize, controller.signal);
        if (controller.signal.aborted) return;

        const allItems: AcademicStudentSummary[] = [...(firstPage.items ?? [])];
        const totalPages = Math.max(firstPage.total_pages ?? 1, 1);
        for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
          if (controller.signal.aborted) return;
          const pageData = await fetchAcademicStudents(
            undefined,
            nextPage,
            pageSize,
            controller.signal,
          );
          allItems.push(...(pageData.items ?? []));
        }

        const byName: Record<string, true> = {};
        const byTarget: Record<string, true> = {};
        allItems.forEach((item) => {
          if (Number(item.non_compliant_count ?? 0) <= 0) return;
          const name = (item.name ?? "").trim();
          const targetKey = (item.target_key ?? "").trim();
          if (name) byName[name] = true;
          if (targetKey) byTarget[targetKey] = true;
        });

        setProblemPaperNameIndex(byName);
        setProblemPaperTargetIndex(byTarget);
      } catch (err) {
        if (controller.signal.aborted) return;
        setProblemPaperNameIndex({});
        setProblemPaperTargetIndex({});
        setProblemPaperIndexError(err instanceof Error ? err.message : "问题论文索引加载失败");
      } finally {
        if (!controller.signal.aborted) {
          setProblemPaperIndexReady(true);
        }
      }
    };

    void loadProblemPaperIndex();
    return () => controller.abort();
  }, [reloadSeed]);

  const hasProblemPaper = (student: StudentRecord): boolean => {
    const studentId = (student.id ?? "").trim();
    if (studentId && problemPaperTargetIndex[studentId]) return true;
    const studentName = (student.name ?? "").trim();
    return Boolean(studentName && problemPaperNameIndex[studentName]);
  };

  useEffect(() => {
    if (problemPaperOnly && !problemPaperIndexReady) {
      setIsLoading(true);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const loadStudents = async () => {
      const commonFilters = {
        enrollment_year: activeYear ?? undefined,
        mentor_name: selectedMentor === ALL_MENTOR ? undefined : selectedMentor,
        home_university:
          selectedUniversity === ALL_UNIVERSITY ? undefined : selectedUniversity,
        keyword: searchKeyword || undefined,
      };

      try {
        if (problemPaperOnly) {
          const allStudents = await fetchStudentListAll(
            {
              ...commonFilters,
              page_size: 500,
            },
            controller.signal,
          );
          if (controller.signal.aborted) return;

          const filtered = allStudents.filter(hasProblemPaper);
          const nextTotal = filtered.length;
          const nextTotalPages = Math.max(Math.ceil(nextTotal / PAGE_SIZE), 1);
          const safePage = Math.min(page, nextTotalPages);
          const start = (safePage - 1) * PAGE_SIZE;

          setStudents(filtered.slice(start, start + PAGE_SIZE));
          setTotal(nextTotal);
          setTotalPages(nextTotalPages);
          if (safePage !== page) {
            setPage(safePage);
          }
          return;
        }

        const res = await fetchStudentList(
          {
            ...commonFilters,
            page,
            page_size: PAGE_SIZE,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setStudents(res.items ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(Math.max(res.total_pages ?? 1, 1));
        if (res.page && res.page !== page) {
          setPage(res.page);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "学生数据加载失败");
        setStudents([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadStudents();
    return () => controller.abort();
  }, [
    activeYear,
    selectedMentor,
    selectedUniversity,
    searchKeyword,
    page,
    reloadSeed,
    problemPaperOnly,
    problemPaperIndexReady,
    problemPaperNameIndex,
    problemPaperTargetIndex,
  ]);

  useEffect(() => {
    if (problemPaperOnly && !problemPaperIndexReady) return undefined;

    const controller = new AbortController();

    fetchStudentListAll(
      {
        enrollment_year: activeYear ?? undefined,
        mentor_name: selectedMentor === ALL_MENTOR ? undefined : selectedMentor,
        keyword: searchKeyword || undefined,
        page_size: 500,
      },
      controller.signal,
    )
      .then((allStudents) => {
        if (controller.signal.aborted) return;
        const sourceStudents = problemPaperOnly
          ? allStudents.filter(hasProblemPaper)
          : allStudents;
        const counts: Record<string, number> = {};
        sourceStudents.forEach((item) => {
          const university = (item.home_university ?? "").trim();
          if (!university) return;
          counts[university] = (counts[university] ?? 0) + 1;
        });
        setUniversityTotalCounts(counts);
        setAllUniversitiesTotal(sourceStudents.length);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setUniversityTotalCounts({});
        setAllUniversitiesTotal(0);
      });

    return () => controller.abort();
  }, [
    activeYear,
    selectedMentor,
    searchKeyword,
    reloadSeed,
    problemPaperOnly,
    problemPaperIndexReady,
    problemPaperNameIndex,
    problemPaperTargetIndex,
  ]);

  const mentorsInCurrentPage = useMemo(() => {
    const set = new Set<string>();
    students.forEach((item) => {
      const mentor = (item.mentor_name || item.scholar_name || "").trim();
      if (mentor) set.add(mentor);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const mentorSelectOptions = useMemo(
    () => Array.from(new Set([...mentorOptions, ...mentorsInCurrentPage])),
    [mentorOptions, mentorsInCurrentPage],
  );

  const universitiesInCurrentPage = useMemo(() => {
    const set = new Set<string>();
    students.forEach((item) => {
      const name = (item.home_university ?? "").trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const universitySelectOptions = useMemo(
    () => Array.from(new Set([...universityOptions, ...universitiesInCurrentPage])),
    [universityOptions, universitiesInCurrentPage],
  );

  const sidebarUniversities = useMemo(() => {
    const list = selectedUniversity !== ALL_UNIVERSITY
      ? Array.from(new Set([...universitySelectOptions, selectedUniversity]))
      : universitySelectOptions;
    const keyword = universitySearch.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((name) => name.toLowerCase().includes(keyword));
  }, [selectedUniversity, universitySelectOptions, universitySearch]);

  const yearTabs = useMemo(
    () => sortYears(activeYear ? [...years, activeYear] : years),
    [years, activeYear],
  );

  const scopeLabel = isAllStudents
    ? "全部学生"
    : displayGrade(activeYear || fallbackYear);

  const mentorLabel = selectedMentor === ALL_MENTOR ? "全部导师" : selectedMentor;
  const universityLabel =
    selectedUniversity === ALL_UNIVERSITY ? "全部高校" : selectedUniversity;

  const handleSelectAllStudents = () => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "students");
    next.set("subtab", ALL_STUDENTS_SUBTAB);
    setSearchParams(next);
  };

  const handleSelectYear = (year: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "students");
    next.set("subtab", gradeToSubtab(year));
    setSearchParams(next);
  };

  const handleOpenCreate = () => {
    setStudentForm({
      ...EMPTY_FORM,
      enrollment_year: activeYear ?? "",
    });
    setShowStudentModal(true);
  };

  const handleOpenDetail = (student: StudentRecord) => {
    navigate(`/students/${student.id}`, {
      state: {
        from: location,
        studentSnapshot: student,
      },
    });
  };

  const handleSubmitStudent = async () => {
    if (!studentForm.name.trim()) {
      window.alert("请填写学生姓名");
      return;
    }

    const resolvedEnrollmentYear =
      parseYear(studentForm.enrollment_year) || activeYear || undefined;

    const payloadBase = {
      name: studentForm.name.trim(),
      enrollment_year: resolvedEnrollmentYear,
      student_no: studentForm.student_no.trim() || undefined,
      home_university: studentForm.home_university.trim() || undefined,
      mentor_name: studentForm.mentor_name.trim() || undefined,
      major: studentForm.major.trim() || undefined,
      degree_type: studentForm.degree_type.trim() || undefined,
      expected_graduation_year:
        parseYear(studentForm.expected_graduation_year) || undefined,
      email: studentForm.email.trim() || undefined,
      phone: studentForm.phone.trim() || undefined,
      notes: studentForm.notes.trim() || undefined,
      status: studentForm.status.trim() || "在读",
    };

    setIsMutating(true);
    try {
      await createStudent({
        ...payloadBase,
        added_by: "frontend",
      } satisfies StudentCreatePayload);
      setPage(1);

      setShowStudentModal(false);
      setStudentForm(EMPTY_FORM);
      setReloadSeed((v) => v + 1);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "保存学生失败");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteStudent = async (student: StudentRecord) => {
    if (!window.confirm(`确认删除学生 ${student.name} 吗？`)) return;
    setIsMutating(true);
    try {
      await deleteStudent(student.id);
      if (students.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
      setReloadSeed((v) => v + 1);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "删除学生失败");
    } finally {
      setIsMutating(false);
    }
  };

  const handleExportFiltered = async () => {
    setIsExporting(true);
    try {
      const all = await fetchStudentListAll({
        enrollment_year: activeYear ?? undefined,
        mentor_name: selectedMentor === ALL_MENTOR ? undefined : selectedMentor,
        home_university:
          selectedUniversity === ALL_UNIVERSITY ? undefined : selectedUniversity,
        keyword: searchKeyword || undefined,
        page_size: 500,
      });

      const exportedStudents = problemPaperOnly
        ? all.filter(hasProblemPaper)
        : all;

      if (exportedStudents.length === 0) {
        window.alert("当前筛选条件下暂无数据可导出");
        return;
      }
      exportStudentsToExcel(exportedStudents);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "导出失败");
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetPrimaryFilters = () => {
    setSearchInput("");
    setSearchKeyword("");
    setSelectedMentor(ALL_MENTOR);
    setSelectedUniversity(ALL_UNIVERSITY);
    setProblemPaperOnly(false);
    setPage(1);
  };

  const handleAddGrade = () => {
    const year = parseYear(gradeInput);
    if (!year) {
      window.alert("年级格式不正确，请输入如 2027 或 2027级");
      return;
    }
    setYears((prev) => sortYears([...prev, year]));
    setShowGradeModal(false);
    setGradeInput("");
    handleSelectYear(year);
  };

  return (
    <div className="h-full overflow-hidden flex bg-gray-50">
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 shrink-0 flex-col overflow-hidden">
        <div className="px-3.5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">共建高校</h3>
            <span className="text-xs text-gray-500">{universitySelectOptions.length} 所</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 truncate">{scopeLabel}</p>
          <div className="relative mt-2.5">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={universitySearch}
              onChange={(e) => setUniversitySearch(e.target.value)}
              placeholder="搜索高校"
              className="h-8 w-full pl-8 pr-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
            />
          </div>
        </div>

        <div className="p-2 overflow-y-auto custom-scrollbar space-y-1">
          <button
            onClick={() => {
              setSelectedUniversity(ALL_UNIVERSITY);
              setPage(1);
            }}
            className={cn(
              "w-full text-left rounded-lg px-3 py-2 text-sm border transition-colors",
              selectedUniversity === ALL_UNIVERSITY
                ? "bg-primary-50 text-primary-700 border-primary-200"
                : "bg-white text-gray-700 border-transparent hover:bg-gray-50",
            )}
          >
            <div className="flex items-center justify-between">
              <span>{ALL_UNIVERSITY}</span>
              <span className="text-xs text-gray-400">{allUniversitiesTotal}</span>
            </div>
          </button>

          {sidebarUniversities.map((uni) => (
            <button
              key={uni}
              onClick={() => {
                setSelectedUniversity(uni);
                setPage(1);
              }}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-sm border transition-colors text-left",
                selectedUniversity === uni
                  ? "bg-primary-50 text-primary-700 border-primary-200"
                  : "bg-white text-gray-700 border-transparent hover:bg-gray-50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{uni}</span>
                <span className="text-xs text-gray-400">
                  {universityTotalCounts[uni] ?? 0}
                </span>
              </div>
            </button>
          ))}

          {sidebarUniversities.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-gray-400">未找到匹配高校</p>
          )}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="p-6 md:p-8"
        >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">学生管理</h2>
            <p className="text-sm text-gray-500 mt-1">
              当前范围 <span className="font-semibold text-gray-700">{scopeLabel}</span>，共{" "}
              <span className="font-semibold text-gray-700">{total}</span> 人
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => setShowBatchImportModal(true)}
              className="h-10 px-3 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              批量添加
            </button>
            <button
              onClick={handleExportFiltered}
              disabled={isExporting}
              className={cn(
                "h-10 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-1.5",
                isExporting
                  ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700",
              )}
            >
              <Download className="w-4 h-4" />
              {isExporting ? "导出中..." : "导出Excel"}
            </button>
            <button
              onClick={() => setShowGradeModal(true)}
              className="h-10 px-3 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              添加年级
            </button>
            <button
              onClick={handleOpenCreate}
              disabled={isMutating}
              className="h-10 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              添加学生
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5 mb-4">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,1fr)_220px_auto] gap-3 items-center">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索学生姓名 / 导师 / 专业"
                className="h-11 w-full pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
              />
            </div>

            <ComboboxInput
              value={selectedMentor === ALL_MENTOR ? "" : selectedMentor}
              onChange={(value) => {
                setSelectedMentor(value || ALL_MENTOR);
                setPage(1);
              }}
              options={mentorSelectOptions}
              placeholder={ALL_MENTOR}
              clearable
            />

            <div className="flex items-center justify-end gap-2 flex-wrap">
              <button
                onClick={() => {
                  setProblemPaperOnly((prev) => !prev);
                  setPage(1);
                }}
                className={cn(
                  "h-11 px-3.5 rounded-xl border text-sm inline-flex items-center gap-1.5 transition-colors",
                  problemPaperOnly
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                问题论文
              </button>
              <button
                onClick={handleResetPrimaryFilters}
                className="h-11 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-700"
              >
                清空条件
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSelectAllStudents}
              className={cn(
                "h-8 px-3.5 rounded-full border text-sm transition-colors",
                isAllStudents
                  ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
              )}
            >
              全部学生
            </button>
            {yearTabs.map((year) => (
              <button
                key={year}
                onClick={() => handleSelectYear(year)}
                className={cn(
                  "h-8 px-3.5 rounded-full border text-sm transition-colors",
                  !isAllStudents && activeYear === year
                    ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                )}
              >
                {displayGrade(year)}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1">
              <Filter className="w-3 h-3" />
              导师：{mentorLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1">
              范围：{universityLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
                problemPaperOnly
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-gray-200 bg-gray-50 text-gray-500",
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              {problemPaperOnly ? "仅问题论文学生" : "全部论文状态"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1">
              共 {total} 人
            </span>
            {problemPaperIndexError && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                问题论文索引不可用
              </span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 h-72 flex items-center justify-center text-sm text-gray-400"
            >
              加载中...
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-red-100 h-72 flex flex-col items-center justify-center text-sm text-red-500 px-4"
            >
              <p>{error}</p>
              <button
                onClick={() => setReloadSeed((v) => v + 1)}
                className="mt-2 text-primary-600 hover:underline"
              >
                重试
              </button>
            </motion.div>
          ) : students.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 h-72 flex items-center justify-center text-sm text-gray-400"
            >
              当前筛选条件下暂无学生
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto max-h-[calc(100vh-360px)] overflow-y-auto custom-scrollbar">
                <table className="min-w-[1100px] w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/90">
                        学生
                      </th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/90">
                        导师
                      </th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/90">
                        共建高校
                      </th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/90">
                        年级
                      </th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/90">
                        专业
                      </th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/90">
                        联系方式
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/90 text-right">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {students.map((student, index) => (
                      <tr
                        key={student.id}
                        onClick={() => handleOpenDetail(student)}
                        className={cn(
                          "group border-b border-gray-50 last:border-b-0 hover:bg-primary-50/40 transition-colors cursor-pointer",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/20",
                        )}
                        title="单击进入学生详情"
                      >
                        <td className="px-5 py-3.5 border-l-2 border-transparent group-hover:border-primary-400 transition-colors">
                          <p className="font-semibold text-gray-800 group-hover:text-primary-700 transition-colors">
                            {safeText(student.name)}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex text-[11px] px-1.5 py-0.5 rounded-full border",
                                statusClass(student.status || "在读"),
                              )}
                            >
                              {student.status || "在读"}
                            </span>
                            <span className="text-[11px] text-gray-400">学号 {safeText(student.student_no)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          {safeText(student.mentor_name || student.scholar_name)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">{safeText(student.home_university)}</td>
                        <td className="px-4 py-3.5 text-gray-600">
                          {formatEnrollmentYear(student.enrollment_year)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">{safeText(student.major)}</td>
                        <td className="px-4 py-3.5 text-gray-600">
                          <p>{safeText(student.email)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{safeText(student.phone)}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteStudent(student);
                            }}
                            disabled={isMutating}
                            title="删除学生"
                            className="h-8 w-8 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={total}
                onPageChange={setPage}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>

      <BaseModal
        isOpen={showGradeModal}
        onClose={() => {
          setShowGradeModal(false);
          setGradeInput("");
        }}
        title="添加年级"
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => {
                setShowGradeModal(false);
                setGradeInput("");
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleAddGrade}
              className="h-9 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
            >
              确认添加
            </button>
          </>
        }
      >
        <label className="block">
          <p className="text-sm text-gray-700 mb-2">年级（支持输入 2027 或 2027级）</p>
          <input
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
            placeholder="例如 2027级"
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
          />
        </label>
      </BaseModal>

      <BaseModal
        isOpen={showStudentModal}
        onClose={() => {
          setShowStudentModal(false);
          setStudentForm(EMPTY_FORM);
        }}
        title="添加学生"
        maxWidth="2xl"
        footer={
          <>
            <button
              onClick={() => {
                setShowStudentModal(false);
                setStudentForm(EMPTY_FORM);
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmitStudent}
              disabled={isMutating}
              className="h-9 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {isMutating ? "保存中..." : "创建学生"}
            </button>
          </>
        }
      >
        <StudentFormFields
          form={studentForm}
          setForm={setStudentForm}
          mentorOptions={mentorSelectOptions}
          universityOptions={universitySelectOptions}
        />
      </BaseModal>

      <BatchStudentImportModal
        isOpen={showBatchImportModal}
        onClose={() => setShowBatchImportModal(false)}
        onSuccess={() => {
          setPage(1);
          setReloadSeed((v) => v + 1);
        }}
        defaultEnrollmentYear={activeYear ?? undefined}
      />
    </div>
  );
}
