import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { STATUS_OPTIONS, STATUS_COLORS } from "@/constants/projectConstants";

interface StatusSwitcherProps {
  value: string;
  onChange: (v: string) => void;
}

export function StatusSwitcher({ value, onChange }: StatusSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const colors = STATUS_COLORS[value] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          colors.bg,
          colors.text,
          "hover:ring-2 hover:ring-offset-1 hover:ring-gray-300",
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
        {value}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 min-w-[120px]"
          >
            {STATUS_OPTIONS.map((opt) => {
              const c = STATUS_COLORS[opt]!;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                    opt === value ? "font-medium" : "",
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", c.dot)} />
                  {opt}
                  {opt === value && <Check className="w-3.5 h-3.5 ml-auto text-primary-600" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
