import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Users,
  Building2,
  FolderKanban,
  Calendar,
  BookOpen,
} from "lucide-react";

// Lazy load tab components
const ScholarListPage = lazy(() => import("./ScholarListPage"));
const InstitutionListPage = lazy(() => import("./InstitutionListPage"));
const ProjectListPage = lazy(() => import("./ProjectListPage"));
const ActivityListPage = lazy(() => import("./ActivityListPage"));
const VenueListPage = lazy(() => import("./VenueListPage"));

type TabId = "institutions" | "scholars" | "projects" | "activities" | "venues";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: "institutions",
    label: "机构库",
    icon: <Building2 className="w-4 h-4" />,
  },
  { id: "scholars", label: "学者库", icon: <Users className="w-4 h-4" /> },
  {
    id: "projects",
    label: "项目库",
    icon: <FolderKanban className="w-4 h-4" />,
  },
  {
    id: "activities",
    label: "两院活动",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: "venues",
    label: "期刊会议",
    icon: <BookOpen className="w-4 h-4" />,
  },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "institutions";

  const handleTabChange = (tabId: TabId) => {
    setSearchParams({ tab: tabId });
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
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-6 pb-5 shrink-0 border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-900 leading-snug">学者知识图谱</h1>
          <p className="text-xs text-gray-400 mt-0.5">管理系统</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-2">
            数据模块
          </p>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 transition-colors duration-150",
                    isActive ? "text-white/90" : "text-gray-400",
                  )}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
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
