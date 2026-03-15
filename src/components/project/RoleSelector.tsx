import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Pencil } from "lucide-react";
import { cn } from "@/utils/cn";
import { ROLE_PRESETS } from "@/constants/projectConstants";

interface RoleSelectorProps {
  value: string;
  onChange: (role: string) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCustom(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const roleColor =
    value === "负责人"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all",
          roleColor,
          "hover:ring-1 hover:ring-offset-1 hover:ring-gray-300",
        )}
      >
        {value || "设置角色"}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1.5 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 min-w-[140px]"
          >
            {ROLE_PRESETS.map((role) => (
              <button
                key={role}
                onClick={() => {
                  onChange(role);
                  setOpen(false);
                  setCustom(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors text-left",
                  role === value ? "font-medium text-primary-700" : "",
                )}
              >
                {role}
                {role === value && <Check className="w-3.5 h-3.5 ml-auto text-primary-600" />}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              {custom ? (
                <div className="px-2 py-1.5">
                  <input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customValue.trim()) {
                        onChange(customValue.trim());
                        setOpen(false);
                        setCustom(false);
                        setCustomValue("");
                      }
                      if (e.key === "Escape") setCustom(false);
                    }}
                    placeholder="自定义角色..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setCustom(true)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  自定义...
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
