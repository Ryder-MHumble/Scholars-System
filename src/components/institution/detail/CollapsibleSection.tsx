import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const SECTION_STYLES = [
  { iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  { iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  { iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  { iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  { iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
] as const;

export function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  styleIdx = 0,
  count,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  styleIdx?: number;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const s = SECTION_STYLES[styleIdx % SECTION_STYLES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4.5 hover:bg-slate-50/50 transition-colors group"
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
          >
            <Icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
          </div>
          <span className="text-sm font-bold text-slate-800">{title}</span>
          {count != null && count > 0 && (
            <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
              {count}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 border-t border-slate-50 pt-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
