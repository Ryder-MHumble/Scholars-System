import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  defaultExpanded = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-primary-600" />}
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4.5 h-4.5 text-gray-500" />
        ) : (
          <ChevronDown className="w-4.5 h-4.5 text-gray-500" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
