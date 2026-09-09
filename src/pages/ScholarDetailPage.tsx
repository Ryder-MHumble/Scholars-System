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
    handleAchievementsSave,
    handleResourceBatchSave,
    handleAcademicPositionsSave,
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
            onSubmitResources={handleResourceBatchSave}
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
      <div
        data-testid="scholar-detail-page"
        className="min-h-screen bg-white xl:h-screen xl:overflow-hidden"
      >
        <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-3 py-4 sm:px-4 xl:h-full xl:min-h-0 xl:py-5">
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

          {/* Desktop columns scroll independently while keeping scrollbars visually hidden. */}
          <div
            data-testid="scholar-detail-layout"
            className="flex flex-col gap-4 xl:min-h-0 xl:flex-1 xl:flex-row xl:overflow-hidden"
          >
            <div className="scrollbar-hide w-full xl:w-[400px] xl:shrink-0 xl:overflow-y-auto xl:pl-2 xl:pr-5">
              <DetailLeftSidebar
                scholar={scholar}
                onEditProfile={() => setShowProfileModal(true)}
              />
            </div>

            <motion.main
              className="scrollbar-hide w-full min-w-0 space-y-4 xl:flex-1 xl:overflow-y-auto xl:px-5"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <AchievementsDetailCard
                scholar={scholar}
                onShowAchievementsModal={() => setShowAchievementsModal(true)}
                onSaveManagementRoles={handleManagementRolesSave}
                relationSlot={
                  <ProjectCategorySelector
                    projectTags={scholar.project_tags ?? []}
                    onSave={handleProjectCategorySave}
                    variant="embedded"
                  />
                }
              />
            </motion.main>

            <motion.div
              className="scrollbar-hide w-full xl:w-80 xl:shrink-0 xl:overflow-y-auto xl:pl-5 xl:pr-2"
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
