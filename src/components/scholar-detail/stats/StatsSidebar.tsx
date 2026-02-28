import { motion } from "framer-motion";
import { Menu } from "lucide-react";

interface CollaboratorStats {
  id: string;
  name: string;
  nameEn?: string;
  institution: string;
  avatar?: string;
  paperCount: number;
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
  collaborators: CollaboratorStats[];
}

export function StatsSidebar({ stats, collaborators }: Props) {
  // Calculate radar chart polygon points
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
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md p-6 transition-shadow duration-300"
      >
        <h3 className="text-base font-semibold text-gray-900 mb-4">作者统计</h3>

        {/* Radar Chart */}
        <div className="relative w-full aspect-square mb-6">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Grid */}
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

            {/* Axes */}
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

            {/* Data polygon */}
            <polygon
              points={points}
              fill="rgba(37, 99, 235, 0.2)"
              stroke="#2563eb"
              strokeWidth="2"
            />

            {/* Data points */}
            {radarMetrics.map((metric, i) => {
              const angle = (metric.angle - 90) * (Math.PI / 180);
              const r = radius * metric.value;
              const x = centerX + r * Math.cos(angle);
              const y = centerY + r * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" />;
            })}

            {/* Labels */}
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

        {/* Stats Grid */}
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
            <div className="font-semibold text-gray-900">
              {stats.sociability}
            </div>
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

      {/* Collaborators */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md font-medium transition-colors"
            >
              合作学者
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1 text-gray-600 text-sm rounded-md hover:bg-gray-50 transition-colors"
            >
              合作机构
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1 text-gray-600 text-sm rounded-md hover:bg-gray-50 transition-colors"
            >
              D-Core
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Menu className="w-4 h-4 text-gray-500" />
          </motion.button>
        </div>

        <div className="px-6 py-3 max-h-[500px] overflow-y-auto custom-scrollbar">
          {collaborators.map((collab, index) => (
            <motion.div
              key={collab.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4, backgroundColor: "rgba(249, 250, 251, 1)" }}
              className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 rounded-lg px-2 -mx-2 transition-all duration-200 cursor-pointer"
            >
              <div className="flex-shrink-0">
                {collab.avatar ? (
                  <img
                    src={collab.avatar}
                    alt={collab.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {collab.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {collab.name}
                  {collab.nameEn && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({collab.nameEn})
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {collab.institution}
                </div>
              </div>
              <div className="text-sm font-semibold text-primary-600 flex-shrink-0">
                {collab.paperCount}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </aside>
  );
}
