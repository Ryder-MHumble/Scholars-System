import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  GraduationCap,
  Mail,
  Phone,
} from "lucide-react";
import {
  fetchStudentDetail,
  fetchStudentListAll,
  fetchStudentPapers,
  type StudentPaperRecord,
  type StudentRecord,
} from "@/services/studentApi";
import { cn } from "@/utils/cn";

type StudentDetailLocationState = {
  from?: { pathname?: string; search?: string };
  studentSnapshot?: StudentRecord;
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

function buildExamplePapers(studentName: string): StudentPaperRecord[] {
  const name = studentName.trim() || "该学生";
  return [
    {
      id: "example-1",
      title: "Cross-Modal Representation Learning for Scientific Document Understanding",
      venue: "AAAI 2026",
      year: "2026",
      compliance_status: "已通过",
      compliance_note: `${name} 为第二作者；作者单位、基金声明、数据来源均完成校验。`,
    },
    {
      id: "example-2",
      title: "Efficient Graph Prompt Tuning in Large-Scale Knowledge Networks",
      venue: "KDD 2025",
      year: "2025",
      compliance_status: "待补材料",
      compliance_note: "伦理审查编号缺失，需补充审批记录后复核。",
    },
    {
      id: "example-3",
      title: "Benchmarking Multimodal Reasoning on Academic Advisor Tasks",
      venue: "arXiv",
      year: "2026",
      compliance_status: "高风险",
      compliance_note: "第三方数据授权证明未提交，暂不允许对外发布。",
    },
  ];
}

function Panel({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-sm",
        compact ? "p-3.5" : "p-4",
      )}
    >
      <h2 className="text-[13px] font-semibold text-gray-800">{title}</h2>
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
    <div className="py-1.5 border-b border-gray-100 last:border-b-0">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-700 break-words">{value}</p>
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
  const [papers, setPapers] = useState<StudentPaperRecord[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersSource, setPapersSource] = useState<"api" | "example" | "empty">("empty");

  const backLink = useMemo(() => {
    const prevLocation = locationState?.from;
    if (prevLocation?.pathname) {
      return `${prevLocation.pathname}${prevLocation.search ?? ""}`;
    }
    return window.sessionStorage.getItem("student_list_return_to") ?? "/?tab=students";
  }, [locationState]);

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
    if (!studentId) return;
    const controller = new AbortController();
    setPapersLoading(true);

    fetchStudentPapers(studentId, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        if (items.length > 0) {
          setPapers(items);
          setPapersSource("api");
        } else {
          const examples = buildExamplePapers(snapshot?.name ?? "");
          setPapers(examples);
          setPapersSource(examples.length > 0 ? "example" : "empty");
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        const examples = buildExamplePapers(snapshot?.name ?? "");
        setPapers(examples);
        setPapersSource(examples.length > 0 ? "example" : "empty");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPapersLoading(false);
        }
      });

    return () => controller.abort();
  }, [snapshot?.name, studentId]);

  const complianceStats = useMemo(() => {
    const initial = { pass: 0, pending: 0, risk: 0, other: 0 };
    papers.forEach((paper) => {
      const status = (paper.compliance_status ?? "").trim() || "未标记";
      const key = classifyCompliance(status);
      initial[key] += 1;
    });
    return initial;
  }, [papers]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1680px] mx-auto px-3 md:px-4 lg:px-5 py-4 md:py-5">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between gap-3"
        >
          <Link
            to={backLink}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4" /> 返回学生列表
          </Link>

          <div className="inline-flex items-center gap-2 text-xs">
            <span className="text-gray-500">{safeText(student.name)}</span>
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

        <div className="mt-3 grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_280px] gap-3 md:gap-4">
          <motion.aside
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="order-2 xl:order-1 space-y-3"
          >
            <Panel title="学生档案">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center text-lg font-semibold shrink-0">
                  {safeText(student.name).slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 break-words">{safeText(student.name)}</h1>
                  <p className="text-sm text-gray-500 mt-0.5 break-words">{safeText(student.major)}</p>
                  <p className="text-xs text-gray-400 mt-1">{safeText(student.degree_type)}</p>
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
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">论文与合规</h2>
                  <p className="text-xs text-gray-400 mt-0.5">中间主工作区：论文发表与合规审查状态</p>
                </div>
                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full border",
                    papersSource === "api"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100",
                  )}
                >
                  {papersSource === "api" ? "真实数据" : "示例数据"}
                </span>
              </div>

              <div className="px-4 py-2.5 border-b border-gray-100 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                  已通过 {complianceStats.pass}
                </span>
                <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                  待补材料 {complianceStats.pending}
                </span>
                <span className="px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-100">
                  风险 {complianceStats.risk}
                </span>
                <span className="px-2 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-200">
                  未标记 {complianceStats.other}
                </span>
              </div>

              {papersLoading ? (
                <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                  论文与合规信息加载中...
                </div>
              ) : papers.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                  暂无论文与合规数据
                </div>
              ) : (
                <div className="overflow-auto max-h-[68vh]">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="sticky top-0 bg-gray-50/95 z-10">
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">论文标题</th>
                        <th className="px-3 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">发表</th>
                        <th className="px-3 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">年份</th>
                        <th className="px-3 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">合规状态</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">合规说明</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {papers.map((paper, idx) => {
                        const compliance = (paper.compliance_status ?? "").trim() || "未标记";
                        return (
                          <tr
                            key={paper.id ?? `${paper.title}-${idx}`}
                            className={cn(
                              "border-b border-gray-50 last:border-b-0",
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50/20",
                            )}
                          >
                            <td className="px-4 py-3 text-gray-800 font-medium leading-6">{safeText(paper.title)}</td>
                            <td className="px-3 py-3 text-gray-600">{safeText(paper.venue)}</td>
                            <td className="px-3 py-3 text-gray-600">{safeText(String(paper.year ?? ""))}</td>
                            <td className="px-3 py-3">
                              <span
                                className={cn(
                                  "inline-flex text-[11px] px-1.5 py-0.5 rounded-full border",
                                  complianceClass(compliance),
                                )}
                              >
                                {compliance}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 leading-6">{safeText(paper.compliance_note)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {papersSource === "example" && (
                <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-amber-600">
                  当前展示为示例数据；接入学生论文接口后会自动切换为真实数据。
                </div>
              )}
            </section>
          </motion.main>

          <motion.aside
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="order-3 space-y-3"
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
    </div>
  );
}
