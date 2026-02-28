import { motion } from "framer-motion";
import { GraduationCap, MapPin } from "lucide-react";
import { cn } from "@/utils/cn";

interface AdvisedStudent {
  id: string;
  name: string;
  degree: "博士" | "硕士" | "博士后";
  startYear: number;
  endYear?: number;
  currentPosition?: string;
}

interface StatsData {
  papers: number;
  citations: number;
  hIndex: number;
  gIndex: number;
  sociability: number;
  diversity: number;
  activity: number;
}

interface Props {
  stats: StatsData;
  advisedStudents: AdvisedStudent[];
}

const degreeColor: Record<AdvisedStudent["degree"], string> = {
  博士: "bg-violet-100 text-violet-700 border-violet-200",
  硕士: "bg-blue-100 text-blue-700 border-blue-200",
  博士后: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function StatsSidebar({ stats, advisedStudents }: Props) {
  const radarMetrics = [
    { label: "Citation", value: Math.min(stats.citations / 5000, 1), angle: 0 },
    { label: "H-Index", value: Math.min(stats.hIndex / 150, 1), angle: 60 },
    { label: "Diversity", value: stats.diversity / 10, angle: 120 },
    { label: "Sociability", value: stats.sociability / 10, angle: 180 },
    { label: "Activity", value: stats.activity / 150, angle: 240 },
    { label: "#Papers", value: Math.min(stats.papers / 400, 1), angle: 300 },
  ];

  const centerX = 100;
  const centerY = 100;
  const radius = 80;

  const points = radarMetrics
    .map((metric) => {
      const angle = (metric.angle - 90) * (Math.PI / 180);
      const r = radius * metric.value;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <aside className="w-80 shrink-0 space-y-4">
      {/* Stats Radar Chart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <h3 className="text-base font-semibold text-gray-900 mb-4">作者统计</h3>

        <div className="relative w-full aspect-square mb-6">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {gridLevels.map((level, i) => {
              const gridPoints = radarMetrics
                .map((metric) => {
                  const angle = (metric.angle - 90) * (Math.PI / 180);
                  const r = radius * level;
                  const x = centerX + r * Math.cos(angle);
                  const y = centerY + r * Math.sin(angle);
                  return `${x},${y}`;
                })
                .join(" ");
              return (
                <polygon
                  key={i}
                  points={gridPoints}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );
            })}

            {radarMetrics.map((metric, i) => {
              const angle = (metric.angle - 90) * (Math.PI / 180);
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );
            })}

            <polygon
              points={points}
              fill="rgba(37, 99, 235, 0.2)"
              stroke="#2563eb"
              strokeWidth="2"
            />

            {radarMetrics.map((metric, i) => {
              const angle = (metric.angle - 90) * (Math.PI / 180);
              const r = radius * metric.value;
              const x = centerX + r * Math.cos(angle);
              const y = centerY + r * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" />;
            })}

            {radarMetrics.map((metric, i) => {
              const angle = (metric.angle - 90) * (Math.PI / 180);
              const labelR = radius + 20;
              const x = centerX + labelR * Math.cos(angle);
              const y = centerY + labelR * Math.sin(angle);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-600 font-medium"
                >
                  {metric.label}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">#Papers:</div>
            <div className="font-semibold text-gray-900">{stats.papers}</div>
          </div>
          <div>
            <div className="text-gray-500">#Citation:</div>
            <div className="font-semibold text-gray-900">
              {stats.citations.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-500">H-Index:</div>
            <div className="font-semibold text-gray-900">{stats.hIndex}</div>
          </div>
          <div>
            <div className="text-gray-500">G-Index:</div>
            <div className="font-semibold text-gray-900">{stats.gIndex}</div>
          </div>
          <div>
            <div className="text-gray-500">Sociability:</div>
            <div className="font-semibold text-gray-900">{stats.sociability}</div>
          </div>
          <div>
            <div className="text-gray-500">Diversity:</div>
            <div className="font-semibold text-gray-900">{stats.diversity}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500">Activity:</div>
            <div className="font-semibold text-gray-900">{stats.activity}</div>
          </div>
        </div>
      </motion.div>

      {/* Advised Students */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-900">指导学生</h3>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {advisedStudents.length} 人
          </span>
        </div>

        <div className="px-5 py-3 max-h-[480px] overflow-y-auto custom-scrollbar">
          {advisedStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂无数据</p>
          ) : (
            advisedStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{student.name}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                        degreeColor[student.degree],
                      )}
                    >
                      {student.degree}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {student.endYear
                      ? `${student.startYear}–${student.endYear}`
                      : `${student.startYear}–在读`}
                  </div>
                  {student.currentPosition && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{student.currentPosition}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </aside>
  );
}
