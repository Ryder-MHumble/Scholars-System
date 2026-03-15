import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import type { NavNode, TabId } from "@/constants/navTree";
import { hasDescendantWithSubtab } from "@/constants/navTree";

export interface NavTreeItemProps {
  node: NavNode;
  depth: number;
  activeTab: TabId;
  activeSubTab: string | null;
  onNavigate: (tab: TabId, subtab?: string) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function NavTreeItem({
  node,
  depth,
  activeTab,
  activeSubTab,
  onNavigate,
  expandedIds,
  onToggle,
}: NavTreeItemProps) {
  const hasChildren = !!(node.children && node.children.length > 0);
  const isExpanded = expandedIds.has(node.id);
  const Icon = node.icon;

  const isExactActive =
    activeTab === node.tab &&
    (depth === 0 ? !activeSubTab : activeSubTab === node.subtab);

  const hasActiveDescendant =
    hasChildren &&
    activeTab === node.tab &&
    !!activeSubTab &&
    hasDescendantWithSubtab(node.children!, activeSubTab);

  const handleClick = () => {
    onNavigate(node.tab, node.subtab);
    if (hasChildren) onToggle(node.id);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 rounded-xl transition-all duration-150 text-left select-none",
          depth === 0
            ? "px-3 py-2.5 font-semibold text-[15px]"
            : depth === 1
              ? "px-2.5 py-2 text-sm font-medium"
              : "px-2.5 py-1.5 text-[13px]",
          isExactActive
            ? depth === 0
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-primary-50 text-primary-700"
            : hasActiveDescendant
              ? depth === 0
                ? "bg-primary-50 text-primary-700"
                : "text-gray-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
        )}
      >
        {hasChildren ? (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="shrink-0"
          >
            <ChevronRight
              className={cn(
                "transition-colors duration-150",
                depth === 0 ? "w-4 h-4" : "w-3.5 h-3.5",
                isExactActive && depth === 0
                  ? "text-white/60"
                  : isExactActive || hasActiveDescendant
                    ? "text-primary-400"
                    : "text-gray-300",
              )}
            />
          </motion.div>
        ) : (
          <span
            className={cn(
              "shrink-0 rounded-full",
              depth === 2 ? "w-1 h-1 ml-1" : "w-1.5 h-1.5",
              isExactActive ? "bg-primary-500" : "bg-gray-300",
            )}
          />
        )}

        {Icon && (
          <Icon
            className={cn(
              "w-[18px] h-[18px] shrink-0 transition-colors duration-150",
              isExactActive && depth === 0
                ? "text-white/80"
                : hasActiveDescendant
                  ? "text-primary-500"
                  : "text-gray-400",
            )}
          />
        )}

        <span className="truncate leading-snug">{node.label}</span>
      </button>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "space-y-0.5 pt-0.5 pb-1.5",
                depth === 0 ? "ml-4" : "ml-3",
              )}
            >
              {node.children!.map((child) => (
                <NavTreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  activeTab={activeTab}
                  activeSubTab={activeSubTab}
                  onNavigate={onNavigate}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
