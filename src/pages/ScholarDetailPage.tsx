import { useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useScholarDetail } from "@/hooks/useScholarDetail";
import { PageSkeleton } from "@/components/scholar-detail/shared/SkeletonLoader";
import { EditAchievementsModal } from "@/components/scholar-detail/modals/EditAchievementsModal";
import { EditProfileModal } from "@/components/scholar-detail/modals/EditProfileModal";
import { ContactModal } from "@/components/scholar-detail/modals/ContactModal";
import { DetailLeftSidebar } from "@/components/scholar-detail/sections/DetailLeftSidebar";
import { ProjectCategorySelector } from "@/components/scholar-detail/sections/ProjectCategorySelector";
import { AchievementsDetailCard } from "@/components/scholar-detail/sections/AchievementsDetailCard";
import { AcademicAdjunctCard } from "@/components/scholar-detail/sections/AcademicAdjunctCard";
import { RightSidebar } from "@/components/scholar-detail/sections/RightSidebar";
import { slideInRight, staggerContainer } from "@/utils/animations";

export default function ScholarDetailPageDemo() {
  const { scholarId } = useParams<{ scholarId: string }>();
  const location = useLocation();

  const {
    scholar,
    isLoading,
    error,
    editableAchievements,
    handleFieldSave,
    handleManagementRolesSave,
    handleAcademicPositionsSave,
    handleAchievementsSave,
    handleProjectCategorySave,
  } = useScholarDetail(scholarId);

  // Modal visibility states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const backLink = useMemo(() => {
    const prevLocation = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    if (prevLocation?.pathname) {
      return `${prevLocation.pathname}${prevLocation.search ?? ""}`;
    }
    const cached = window.sessionStorage.getItem("scholar_list_return_to");
    if (cached) return cached;
    return "/?tab=scholars";
  }, [location.state]);

  if (isLoading) return <PageSkeleton />;

  if (error || !scholar) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">{error ?? "未找到该学者"}</p>
        <Link
          to={backLink}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 返回列表
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      <AnimatePresence>
        {showContactModal && (
          <ContactModal
            email={scholar.email}
            phone={scholar.phone}
            profileUrl={scholar.profile_url}
            onClose={() => setShowContactModal(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAchievementsModal && editableAchievements && (
          <EditAchievementsModal
            publications={editableAchievements.publications}
            patents={editableAchievements.patents}
            awards={editableAchievements.awards}
            projects={scholar.joint_research_projects ?? []}
            onClose={() => setShowAchievementsModal(false)}
            onSubmit={async (data) => {
              await handleAchievementsSave(data);
              setShowAchievementsModal(false);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showProfileModal && (
          <EditProfileModal
            scholar={scholar}
            onClose={() => setShowProfileModal(false)}
            onSubmit={async (patch) => {
              await handleFieldSave(patch);
            }}
            onSubmitAcademicPositions={handleAcademicPositionsSave}
          />
        )}
      </AnimatePresence>
      <div className="h-screen bg-white overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 py-6 h-full flex flex-col">
          {/* Header with breadcrumb and actions */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 shrink-0"
          >
            <Link
              to={backLink}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              返回列表
            </Link>
          </motion.div>

          {/* Three Column Layout — left/right fixed, center scrolls */}
          <div className="flex gap-5 flex-1 min-h-0 overflow-hidden">
            {/* Left Sidebar — fixed */}
            <div className="h-full min-h-0 shrink-0 overflow-y-auto scrollbar-hide" style={{ position: "sticky", top: 0 }}>
            <DetailLeftSidebar
              scholar={scholar}
              onEditProfile={() => setShowProfileModal(true)}
            />
            </div>

            {/* Center Content — scrollable */}
            <motion.main
              className="h-full min-h-0 flex-1 min-w-0 space-y-4 overflow-y-auto scrollbar-hide pr-1"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <ProjectCategorySelector
                projectTags={scholar.project_tags ?? []}
                onSave={handleProjectCategorySave}
              />

              <AcademicAdjunctCard
                scholar={scholar}
                onSave={handleManagementRolesSave}
              />

              <AchievementsDetailCard
                scholar={scholar}
                onShowAchievementsModal={() => setShowAchievementsModal(true)}
              />
            </motion.main>

            {/* Right Sidebar — fixed */}
            <motion.div
              className="h-full min-h-0 shrink-0 overflow-y-auto scrollbar-hide"
              variants={slideInRight}
              initial="hidden"
              animate="visible"
            >
              <RightSidebar
                scholar={scholar}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
