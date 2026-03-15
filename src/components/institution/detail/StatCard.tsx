import { motion } from "framer-motion";

const STAT_STYLES = [
  { iconBg: "bg-blue-100", iconColor: "text-blue-600", numColor: "text-blue-700" },
  { iconBg: "bg-violet-100", iconColor: "text-violet-600", numColor: "text-violet-700" },
  { iconBg: "bg-emerald-100", iconColor: "text-emerald-600", numColor: "text-emerald-700" },
  { iconBg: "bg-amber-100", iconColor: "text-amber-600", numColor: "text-amber-700" },
  { iconBg: "bg-rose-100", iconColor: "text-rose-600", numColor: "text-rose-700" },
] as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  styleIdx,
}: {
  label: string;
  value: number | null | undefined;
  icon: React.ElementType;
  styleIdx: number;
}) {
  const s = STAT_STYLES[styleIdx % STAT_STYLES.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: styleIdx * 0.05 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-5 flex flex-col gap-3.5"
    >
      <div
        className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center shrink-0`}
      >
        <Icon className={`w-5 h-5 ${s.iconColor}`} />
      </div>
      <div>
        <p
          className={`text-3xl font-black ${value != null ? s.numColor : "text-slate-300"} leading-none`}
        >
          {value ?? "—"}
        </p>
        <p className="text-xs text-slate-500 font-semibold mt-2">{label}</p>
      </div>
    </motion.div>
  );
}
