import { lazy, Suspense, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Users,
  Building2,
  FolderKanban,
  Calendar,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ScholarListPage = lazy(() => import("./ScholarListPage"));
const InstitutionListPage = lazy(() => import("./InstitutionListPage"));
const ProjectListPage = lazy(() => import("./ProjectListPage"));
const ActivityListPage = lazy(() => import("./ActivityListPage"));
const VenueListPage = lazy(() => import("./VenueListPage"));

type TabId = "institutions" | "scholars" | "projects" | "activities" | "venues";

interface NavNode {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  tab: TabId;
  subtab?: string;
  children?: NavNode[];
}

const NAV_TREE: NavNode[] = [
  {
    id: "institutions",
    label: "机构-Institution",
    icon: Building2,
    tab: "institutions",
    children: [
      {
        id: "uni_group",
        label: "高校",
        tab: "institutions",
        subtab: "universities",
        children: [
          { id: "joint_uni", label: "共建高校", tab: "institutions", subtab: "joint_universities" },
          { id: "sister_uni", label: "兄弟院校", tab: "institutions", subtab: "sister_universities" },
          { id: "overseas_uni", label: "海外高校", tab: "institutions", subtab: "overseas_universities" },
          { id: "other_uni", label: "其他高校", tab: "institutions", subtab: "other_universities" },
        ],
      },
      { id: "research_inst", label: "科研院所", tab: "institutions", subtab: "research_institutes" },
      { id: "industry_assoc", label: "行业学会", tab: "institutions", subtab: "industry_associations" },
    ],
  },
  {
    id: "scholars",
    label: "学者-Scholar",
    icon: Users,
    tab: "scholars",
    children: [
      {
        id: "domestic",
        label: "国内",
        tab: "scholars",
        subtab: "domestic",
        children: [
          { id: "dom_uni", label: "高校", tab: "scholars", subtab: "domestic_university" },
          { id: "dom_company", label: "企业", tab: "scholars", subtab: "domestic_company" },
          { id: "dom_research", label: "研究机构", tab: "scholars", subtab: "domestic_research" },
          { id: "dom_other", label: "其他", tab: "scholars", subtab: "domestic_other" },
        ],
      },
      {
        id: "international",
        label: "国际",
        tab: "scholars",
        subtab: "international",
        children: [
          { id: "intl_uni", label: "高校", tab: "scholars", subtab: "intl_university" },
          { id: "intl_company", label: "企业", tab: "scholars", subtab: "intl_company" },
          { id: "intl_research", label: "研究机构", tab: "scholars", subtab: "intl_research" },
          { id: "intl_other", label: "其他", tab: "scholars", subtab: "intl_other" },
        ],
      },
    ],
  },
  {
    id: "projects",
    label: "项目-Program",
    icon: FolderKanban,
    tab: "projects",
    children: [
      {
        id: "proj_edu",
        label: "教育培养",
        tab: "projects",
        subtab: "education",
        children: [
          { id: "sci_edu_comm", label: "科技教育委员会", tab: "projects", subtab: "sci_edu_committee" },
          { id: "acad_comm", label: "学术委员会", tab: "projects", subtab: "academic_committee" },
          { id: "teach_comm", label: "教学委员会", tab: "projects", subtab: "teaching_committee" },
          { id: "student_mentor", label: "学院学生高校导师", tab: "projects", subtab: "student_mentor" },
          { id: "parttime_mentor", label: "兼职导师", tab: "projects", subtab: "parttime_mentor" },
        ],
      },
      {
        id: "proj_research",
        label: "科研学术",
        tab: "projects",
        subtab: "research",
        children: [
          { id: "research_proj", label: "科研立项", tab: "projects", subtab: "research_project" },
        ],
      },
      {
        id: "proj_talent",
        label: "人才引育",
        tab: "projects",
        subtab: "talent",
        children: [
          { id: "zhuogong", label: "卓工公派", tab: "projects", subtab: "zhuogong" },
        ],
      },
    ],
  },
  {
    id: "activities",
    label: "活动-Event",
    icon: Calendar,
    tab: "activities",
    children: [
      {
        id: "act_edu",
        label: "教育培养",
        tab: "activities",
        subtab: "education",
        children: [
          { id: "opening", label: "开学典礼", tab: "activities", subtab: "opening_ceremony" },
          { id: "joint_sym", label: "共建高校座谈会", tab: "activities", subtab: "joint_symposium" },
          { id: "comm_meet", label: "委员会会议", tab: "activities", subtab: "committee_meeting" },
        ],
      },
      {
        id: "act_research",
        label: "科研学术",
        tab: "activities",
        subtab: "research",
        children: [
          { id: "ai_summit", label: "国际AI科学家大会", tab: "activities", subtab: "ai_scientist_summit" },
          { id: "xai_forum", label: "XAI智汇讲坛", tab: "activities", subtab: "xai_forum" },
          { id: "acad_conf", label: "学术年会", tab: "activities", subtab: "academic_conference" },
        ],
      },
      {
        id: "act_talent",
        label: "人才引育",
        tab: "activities",
        subtab: "talent",
        children: [
          { id: "youth_forum", label: "青年论坛", tab: "activities", subtab: "youth_forum" },
          { id: "intl_summer", label: "国际暑校", tab: "activities", subtab: "intl_summer_school" },
        ],
      },
    ],
  },
  {
    id: "venues",
    label: "社群-Community",
    icon: BookOpen,
    tab: "venues",
    children: [
      { id: "top_conf", label: "顶会", tab: "venues", subtab: "top_conferences" },
      { id: "journals", label: "期刊", tab: "venues", subtab: "journals" },
    ],
  },
];

function getAncestorIds(tab: TabId, subtab: string | null): string[] {
  function search(nodes: NavNode[], path: string[]): string[] | null {
    for (const node of nodes) {
      const isTarget =
        node.tab === tab &&
        (subtab ? node.subtab === subtab : !node.subtab && !node.children);
      if (isTarget) return path;
      if (node.children) {
        const found = search(node.children, [...path, node.id]);
        if (found !== null) return found;
      }
    }
    return null;
  }
  const topId = NAV_TREE.find((n) => n.tab === tab)?.id;
  const found = search(NAV_TREE, []);
  return found ?? (topId ? [topId] : []);
}

function hasDescendantWithSubtab(nodes: NavNode[], subtab: string): boolean {
  return nodes.some(
    (n) =>
      n.subtab === subtab ||
      (n.children ? hasDescendantWithSubtab(n.children, subtab) : false),
  );
}

interface NavTreeItemProps {
  node: NavNode;
  depth: number;
  activeTab: TabId;
  activeSubTab: string | null;
  onNavigate: (tab: TabId, subtab?: string) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

function NavTreeItem({
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

  // Single click: navigate to this node's route + toggle expand if has children
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
          // Vertical padding and font weight by depth
          depth === 0
            ? "px-3 py-2.5 font-semibold text-[15px]"
            : depth === 1
            ? "px-2.5 py-2 text-sm font-medium"
            : "px-2.5 py-1.5 text-[13px]",
          // Background & text color based on active state
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
        {/* Expand chevron — visible only when node has children */}
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
          // Leaf node: dot indicator instead of spacer
          <span
            className={cn(
              "shrink-0 rounded-full",
              depth === 2 ? "w-1 h-1 ml-1" : "w-1.5 h-1.5",
              isExactActive ? "bg-primary-500" : "bg-gray-300",
            )}
          />
        )}

        {/* Icon — only on top-level nodes */}
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

      {/* Children */}
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

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "institutions";
  const activeSubTab = searchParams.get("subtab");

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(getAncestorIds(activeTab, activeSubTab));
  });

  // Top-level node IDs for accordion logic
  const topLevelIds = NAV_TREE.map((n) => n.id);

  useEffect(() => {
    const ancestors = getAncestorIds(activeTab, activeSubTab);
    setExpandedIds((prev) => {
      // Remove other top-level IDs (accordion: only one top-level open)
      const next = new Set(
        [...prev].filter((id) => !topLevelIds.includes(id)),
      );
      ancestors.forEach((id) => next.add(id));
      return next;
    });
  }, [activeTab, activeSubTab]);

  const handleNavigate = (tab: TabId, subtab?: string) => {
    setSearchParams(subtab ? { tab, subtab } : { tab });
  };

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Accordion: if toggling a top-level item, close other top-level items
        if (topLevelIds.includes(id)) {
          topLevelIds.forEach((tid) => next.delete(tid));
        }
        next.add(id);
      }
      return next;
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "institutions":
        return <InstitutionListPage />;
      case "scholars":
        return <ScholarListPage />;
      case "projects":
        return <ProjectListPage />;
      case "activities":
        return <ActivityListPage />;
      case "venues":
        return <VenueListPage />;
      default:
        return <InstitutionListPage />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-6 pb-5 shrink-0 border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-900 leading-snug">
            学者知识图谱
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Scholar Knowledge Graph
          </p>
        </div>

        {/* Navigation Tree */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">
            核心数据库
          </p>
          <div className="space-y-1">
            {NAV_TREE.map((node) => (
              <NavTreeItem
                key={node.id}
                node={node}
                depth={0}
                activeTab={activeTab}
                activeSubTab={activeSubTab}
                onNavigate={handleNavigate}
                expandedIds={expandedIds}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner />
            </div>
          }
        >
          {renderTabContent()}
        </Suspense>
      </main>
    </div>
  );
}
