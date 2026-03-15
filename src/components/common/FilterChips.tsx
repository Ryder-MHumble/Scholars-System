import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface FilterChip {
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
}

export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-1.5 flex-wrap"
    >
      {chips.map((chip, index) => (
        <motion.button
          key={chip.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12, delay: index * 0.02 }}
          onClick={chip.onRemove}
          className="group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[13px] font-medium transition-colors"
        >
          <span>{chip.label}</span>
          <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </motion.button>
      ))}
      {chips.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="h-7 px-2.5 text-[13px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          清除全部
        </button>
      )}
    </motion.div>
  );
}
