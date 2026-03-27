import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  Filter,
  Pencil,
  Plus,
  School,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { BaseModal } from "@/components/common/BaseModal";
import { SelectInput } from "@/components/ui/SelectInput";
import { ComboboxInput } from "@/components/ui/ComboboxInput";
import {
  createStudent,
  deleteStudent,
  fetchStudentList,
  fetchStudentOptions,
  patchStudent,
  type StudentCreatePayload,
  type StudentRecord,
  type StudentUpdatePayload,
} from "@/services/studentApi";
import { BatchStudentImportModal } from "@/components/student/BatchStudentImportModal";
import { exportStudentsToExcel } from "@/utils/studentExcel";

const DEFAULT_YEARS = ["2024", "2025", "2026"];
const ALL_MENTOR = "全部导师";
const ALL_UNIVERSITY = "全部高校";
const ALL_STUDENTS_SUBTAB = "student_all";

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

function formatEnrollmentYear(value: string | null | undefined): string {
  const year = parseYear(value);
  return year ? displayGrade(year) : "-";
}

function statusClass(status: string): string {
  if (status === "毕业") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "实习") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [years, setYears] = useState<string[]>(DEFAULT_YEARS);
  const activeSubtab = searchParams.get("subtab");
  const isAllStudents = activeSubtab === ALL_STUDENTS_SUBTAB;
  const yearFromUrl = subtabToYear(activeSubtab);
  const fallbackYear = years[0] ?? DEFAULT_YEARS[0];
  const activeYear = isAllStudents ? null : yearFromUrl ?? fallbackYear;

  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);
  const [mentorOptions, setMentorOptions] = useState<string[]>([]);
  const [universityOptions, setUniversityOptions] = useState<string[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState(ALL_MENTOR);
  const [selectedUniversity, setSelectedUniversity] = useState(ALL_UNIVERSITY);

  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeInput, setGradeInput] = useState("");

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [studentForm, setStudentForm] = useState<StudentForm>(EMPTY_FORM);

  const [showBatchImportModal, setShowBatchImportModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("tab") !== "students") return;
    if (activeSubtab === ALL_STUDENTS_SUBTAB || yearFromUrl) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", "students");
    next.set("subtab", ALL_STUDENTS_SUBTAB);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, activeSubtab, yearFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchKeyword(searchInput.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSelectedMentor(ALL_MENTOR);
    setSelectedUniversity(ALL_UNIVERSITY);
    setSearchInput("");
    setSearchKeyword("");
  }, [activeSubtab]);

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
    setIsLoading(true);
    setError(null);

    fetchStudentList(
      {
        enrollment_year: activeYear ?? undefined,
        mentor_name: selectedMentor === ALL_MENTOR ? undefined : selectedMentor,
        keyword: searchKeyword || undefined,
        page: 1,
        page_size: 500,
      },
      controller.signal,
    )
      .then((res) => {
        setAllStudents(res.items ?? []);
        setIsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "学生数据加载失败");
        setAllStudents([]);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [activeYear, selectedMentor, searchKeyword, reloadSeed]);

  const yearScopedStudents = useMemo(() => {
    if (isAllStudents) return allStudents;
    return allStudents.filter((item) => parseYear(item.enrollment_year) === activeYear);
  }, [allStudents, isAllStudents, activeYear]);

  const universityCounts = useMemo(() => {
    const map = new Map<string, number>();
    yearScopedStudents.forEach((item) => {
      const uni = (item.home_university || "").trim();
      if (!uni) return;
      map.set(uni, (map.get(uni) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [yearScopedStudents]);

  const filteredUniversityCounts = useMemo(() => {
    const keyword = universitySearch.trim().toLowerCase();
    if (!keyword) return universityCounts;
    return universityCounts.filter((item) =>
      item.name.toLowerCase().includes(keyword),
    );
  }, [universityCounts, universitySearch]);

  const studentsForRender = useMemo(() => {
    if (selectedUniversity === ALL_UNIVERSITY) return yearScopedStudents;
    return yearScopedStudents.filter((item) => item.home_university === selectedUniversity);
  }, [yearScopedStudents, selectedUniversity]);

  useEffect(() => {
    if (selectedUniversity === ALL_UNIVERSITY) return;
    const exists = universityCounts.some((u) => u.name === selectedUniversity);
    if (!exists) setSelectedUniversity(ALL_UNIVERSITY);
  }, [selectedUniversity, universityCounts]);

  const mentorsInCurrent = useMemo(() => {
    const set = new Set<string>();
    yearScopedStudents.forEach((item) => {
      const mentor = (item.mentor_name || item.scholar_name || "").trim();
      if (mentor) set.add(mentor);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [yearScopedStudents]);

  const mentorSelectOptions =
    mentorsInCurrent.length > 0 ? mentorsInCurrent : mentorOptions;

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
    setEditingStudent(null);
    setStudentForm({
      ...EMPTY_FORM,
      enrollment_year: activeYear ?? "",
    });
    setShowStudentModal(true);
  };

  const handleOpenEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name || "",
      enrollment_year: parseYear(student.enrollment_year) || "",
      student_no: student.student_no || "",
      home_university: student.home_university || "",
      mentor_name: student.mentor_name || student.scholar_name || "",
      major: student.major || "",
      degree_type: student.degree_type || "",
      expected_graduation_year: student.expected_graduation_year || "",
      email: student.email || "",
      phone: student.phone || "",
      notes: student.notes || "",
      status: student.status || "在读",
    });
    setShowStudentModal(true);
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
      if (editingStudent) {
        await patchStudent(editingStudent.id, {
          ...payloadBase,
          updated_by: "frontend",
        } satisfies StudentUpdatePayload);
      } else {
        await createStudent({
          ...payloadBase,
          added_by: "frontend",
        } satisfies StudentCreatePayload);
      }

      setShowStudentModal(false);
      setEditingStudent(null);
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
      setReloadSeed((v) => v + 1);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "删除学生失败");
    } finally {
      setIsMutating(false);
    }
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

  const yearTabs = useMemo(
    () => sortYears(activeYear ? [...years, activeYear] : years),
    [years, activeYear],
  );

  const scopeLabel = isAllStudents
    ? "全部学生"
    : displayGrade(activeYear || fallbackYear);

  const mentorLabel = selectedMentor === ALL_MENTOR ? "全部导师" : selectedMentor;

  return (
    <div className="h-full overflow-hidden flex bg-gray-50">
      <aside className="w-52 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col overflow-hidden">
        <div className="px-3.5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-1.5">
              <School className="w-4 h-4 text-gray-500" />
              共建高校
            </h3>
            <span className="text-xs text-gray-500">{universityCounts.length} 所</span>
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
            onClick={() => setSelectedUniversity(ALL_UNIVERSITY)}
            className={cn(
              "w-full text-left rounded-lg px-3 py-2 text-sm border transition-colors",
              selectedUniversity === ALL_UNIVERSITY
                ? "bg-primary-50 text-primary-700 border-primary-200"
                : "bg-white text-gray-700 border-transparent hover:bg-gray-50",
            )}
          >
            <div className="flex items-center justify-between">
              <span>{ALL_UNIVERSITY}</span>
              <span className="text-xs text-gray-400">{yearScopedStudents.length}</span>
            </div>
          </button>

          {filteredUniversityCounts.map((uni) => (
            <button
              key={uni.name}
              onClick={() => setSelectedUniversity(uni.name)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-sm border transition-colors text-left",
                selectedUniversity === uni.name
                  ? "bg-primary-50 text-primary-700 border-primary-200"
                  : "bg-white text-gray-700 border-transparent hover:bg-gray-50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{uni.name}</span>
                <span className="text-xs text-gray-400">{uni.count}</span>
              </div>
            </button>
          ))}

          {filteredUniversityCounts.length === 0 && (
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
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">学生管理</h2>
                <p className="text-sm text-gray-500 mt-1">
                  当前范围 <span className="font-semibold text-gray-700">{scopeLabel}</span>，共{" "}
                  <span className="font-semibold text-gray-700">{studentsForRender.length}</span> 人
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
                  onClick={() => exportStudentsToExcel(studentsForRender)}
                  disabled={studentsForRender.length === 0}
                  className={cn(
                    "h-10 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-1.5",
                    studentsForRender.length === 0
                      ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                      : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700",
                  )}
                >
                  <Download className="w-4 h-4" />
                  导出Excel
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

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[280px] max-w-xl">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="搜索学生姓名 / 高校 / 导师 / 专业"
                  className="h-10 w-full pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
                />
              </div>

              <div className="w-full sm:w-72">
                <ComboboxInput
                  value={selectedMentor === ALL_MENTOR ? "" : selectedMentor}
                  onChange={(value) => setSelectedMentor(value || ALL_MENTOR)}
                  options={mentorSelectOptions}
                  placeholder={ALL_MENTOR}
                  clearable
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
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
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1">
                <Filter className="w-3 h-3" />
                导师：{mentorLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1">
                高校：{selectedUniversity}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-gray-100 h-60 flex items-center justify-center text-sm text-gray-400"
              >
                加载中...
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-red-100 h-60 flex flex-col items-center justify-center text-sm text-red-500 px-4"
              >
                <p>{error}</p>
                <button
                  onClick={() => setReloadSeed((v) => v + 1)}
                  className="mt-2 text-primary-600 hover:underline"
                >
                  重试
                </button>
              </motion.div>
            ) : studentsForRender.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-gray-100 h-60 flex items-center justify-center text-sm text-gray-400"
              >
                暂无可展示学生
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
                <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto custom-scrollbar">
                  <table className="min-w-[980px] w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-gray-100">
                        <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80">
                          姓名
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80">
                          年级
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80">
                          共建高校
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80">
                          导师
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80">
                          学号
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80">
                          邮箱
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80">
                          专业
                        </th>
                        <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80 text-right">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {studentsForRender.map((student, index) => (
                        <tr
                          key={student.id}
                          className={cn(
                            "group border-b border-gray-50 last:border-b-0 hover:bg-primary-50/40 transition-colors",
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/25",
                          )}
                        >
                          <td className="px-5 py-3.5 border-l-2 border-transparent group-hover:border-primary-400 transition-colors">
                            <p className="font-semibold text-gray-800">{safeText(student.name)}</p>
                            <span
                              className={cn(
                                "inline-flex mt-1 text-[11px] px-1.5 py-0.5 rounded-full border",
                                statusClass(student.status || "在读"),
                              )}
                            >
                              {student.status || "在读"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {formatEnrollmentYear(student.enrollment_year)}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">{safeText(student.home_university)}</td>
                          <td className="px-4 py-3.5 text-gray-600">{safeText(student.mentor_name)}</td>
                          <td className="px-4 py-3.5 text-gray-600">{safeText(student.student_no)}</td>
                          <td className="px-4 py-3.5 text-gray-600">{safeText(student.email)}</td>
                          <td className="px-4 py-3.5 text-gray-600">{safeText(student.major)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(student)}
                                disabled={isMutating}
                                className="h-8 px-2.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 inline-flex items-center gap-1"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student)}
                                disabled={isMutating}
                                className="h-8 px-2.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
          setEditingStudent(null);
          setStudentForm(EMPTY_FORM);
        }}
        title={editingStudent ? `编辑学生 · ${editingStudent.name}` : "添加学生"}
        maxWidth="2xl"
        footer={
          <>
            <button
              onClick={() => {
                setShowStudentModal(false);
                setEditingStudent(null);
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
              {isMutating ? "保存中..." : editingStudent ? "保存修改" : "创建学生"}
            </button>
          </>
        }
      >
        <StudentFormFields
          form={studentForm}
          setForm={setStudentForm}
          mentorOptions={mentorSelectOptions}
          universityOptions={universityOptions}
        />
      </BaseModal>

      <BatchStudentImportModal
        isOpen={showBatchImportModal}
        onClose={() => setShowBatchImportModal(false)}
        onSuccess={() => setReloadSeed((v) => v + 1)}
        defaultEnrollmentYear={activeYear ?? undefined}
      />
    </div>
  );
}
