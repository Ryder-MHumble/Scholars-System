import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { NavTreeItem } from "@/components/nav/NavTreeItem";
import { NAV_TREE, getAncestorIds } from "@/constants/navTree";
import type { TabId } from "@/constants/navTree";
import { lazyWithRetry } from "@/utils/lazyWithRetry";

const ScholarListPage = lazyWithRetry(
  () => import("./ScholarListPage"),
  "ScholarListPage",
);
const StudentListPage = lazyWithRetry(
  () => import("./StudentListPage"),
  "StudentListPage",
);
const InstitutionListPage = lazyWithRetry(
  () => import("./InstitutionListPage"),
  "InstitutionListPage",
);
const ProjectListPage = lazyWithRetry(
  () => import("./ProjectListPage"),
  "ProjectListPage",
);
const ActivityListPage = lazyWithRetry(
  () => import("./ActivityListPage"),
  "ActivityListPage",
);
const VenueListPage = lazyWithRetry(
  () => import("./VenueListPage"),
  "VenueListPage",
);

const topLevelIds = NAV_TREE.map((n) => n.id);

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "institutions";
  const activeSubTab = searchParams.get("subtab");

  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(() => {
    return new Set(getAncestorIds(activeTab, activeSubTab));
  });

  const expandedIds = useMemo(() => {
    const ancestors = getAncestorIds(activeTab, activeSubTab);
    const next = new Set(
      [...manualExpandedIds].filter((id) => !topLevelIds.includes(id)),
    );
    ancestors.forEach((id) => next.add(id));
    return next;
  }, [activeTab, activeSubTab, manualExpandedIds]);

  const handleNavigate = (tab: TabId, subtab?: string) => {
    setSearchParams(subtab ? { tab, subtab } : { tab });
  };

  const handleToggle = (id: string) => {
    setManualExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (topLevelIds.includes(id))
          topLevelIds.forEach((tid) => next.delete(tid));
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
      case "students":
        return <StudentListPage />;
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
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">
        <div className="px-4 pt-4 pb-3 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img
              src="/ScholarDB.png"
              alt="ScholarDB Logo"
              className="w-10 h-10 rounded object-contain"
            />
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-snug">
                学者知识图谱
              </h1>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Scholar Knowledge Graph
              </p>
            </div>
          </div>
        </div>

        {/* Support Notice */}
        <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
          <p className="text-xs text-blue-700 leading-relaxed">
            💬 如遇到相关问题请咨询孙铭浩
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2.5">
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
