import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  GraduationCap,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageTransition from "@/layouts/PageTransition";
import { universities } from "@/data/universities";
import { scholars } from "@/data/scholars";
import { changelog } from "@/data/changelog";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/format";
import { getAvatarColor, getInitial } from "@/utils/avatar";

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return count;
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  color: string;
  trend?: string;
}) {
  const count = useCountUp(value);
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            color,
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900">
          {count.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const totalScholars = scholars.length;
  const totalUniversities = universities.length;
  const totalDepartments = universities.reduce(
    (acc, u) => acc + u.departments.length,
    0,
  );
  const recentChanges = changelog.filter((c) => {
    const d = new Date(c.timestamp);
    const now = new Date();
    return now.getTime() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const chartData = universities.map((u) => ({
    name: u.shortName,
    学者数: scholars.filter((s) => s.universityId === u.id).length,
  }));

  const allFields = scholars.flatMap((s) => s.researchFields);
  const fieldCounts: Record<string, number> = {};
  for (const f of allFields) fieldCounts[f] = (fieldCounts[f] || 0) + 1;
  const topFields = Object.entries(fieldCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const recentScholars = [...scholars]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  const recentLogs = [...changelog]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 8);

  return (
    <PageTransition>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="学者总数"
            value={totalScholars}
            color="bg-primary-500"
            trend="+12%"
          />
          <StatCard
            icon={Building2}
            label="院校数量"
            value={totalUniversities}
            color="bg-emerald-500"
          />
          <StatCard
            icon={GraduationCap}
            label="院系数量"
            value={totalDepartments}
            color="bg-violet-500"
          />
          <StatCard
            icon={RefreshCw}
            label="本月更新"
            value={recentChanges}
            color="bg-amber-500"
            trend="+8%"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              各院校学者分布
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f0f0f0"
                />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                  cursor={{ fill: "#f3f4f6" }}
                />
                <Bar
                  dataKey="学者数"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Research Field Cloud */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              研究方向分布
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {topFields.map(([field, count], i) => {
                const size =
                  count >= 8
                    ? "text-sm px-3 py-1.5"
                    : count >= 4
                      ? "text-xs px-2.5 py-1"
                      : "text-xs px-2 py-0.5";
                const colors = [
                  "bg-primary-50 text-primary-700 border-primary-200",
                  "bg-emerald-50 text-emerald-700 border-emerald-200",
                  "bg-violet-50 text-violet-700 border-violet-200",
                  "bg-amber-50 text-amber-700 border-amber-200",
                  "bg-rose-50 text-rose-700 border-rose-200",
                  "bg-cyan-50 text-cyan-700 border-cyan-200",
                ];
                return (
                  <motion.span
                    key={field}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "rounded-full border font-medium cursor-default",
                      size,
                      colors[i % colors.length],
                    )}
                  >
                    {field}
                    <span className="ml-1 opacity-60">{count}</span>
                  </motion.span>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Scholars */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                最近更新的学者
              </h3>
              <Link
                to="/scholars"
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
              >
                查看全部 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentScholars.map((s, i) => {
                const uni = universities.find((u) => u.id === s.universityId);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      to={`/scholars/${s.id}`}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                        style={{ backgroundColor: getAvatarColor(s.name) }}
                      >
                        {getInitial(s.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {s.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {uni?.shortName} · {s.title}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">
                        {formatRelativeTime(s.updatedAt)}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Change History */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">变更记录</h3>
              <Link
                to="/changelog"
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
              >
                查看全部 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className={cn(
                      "mt-1 w-2 h-2 rounded-full shrink-0",
                      log.action === "新增"
                        ? "bg-emerald-500"
                        : log.action === "修改"
                          ? "bg-primary-500"
                          : "bg-red-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-700 leading-snug">
                      {log.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(log.timestamp)} · {log.operator}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Link
            to="/institutions"
            className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
          >
            <Building2 className="w-8 h-8 text-primary-500 mb-3" />
            <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
              浏览院校
            </div>
            <div className="text-xs text-gray-500 mt-1">
              按院校和院系浏览学者信息
            </div>
          </Link>
          <Link
            to="/scholars"
            className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
          >
            <Users className="w-8 h-8 text-emerald-500 mb-3" />
            <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
              学者目录
            </div>
            <div className="text-xs text-gray-500 mt-1">搜索和筛选所有学者</div>
          </Link>
          <Link
            to="/export"
            className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
          >
            <RefreshCw className="w-8 h-8 text-violet-500 mb-3" />
            <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
              数据导出
            </div>
            <div className="text-xs text-gray-500 mt-1">
              导出学者数据为多种格式
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
