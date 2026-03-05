import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload } from "lucide-react";
import { useScholarDetail } from "@/hooks/useScholarDetail";
import { StatsSidebar } from "@/components/scholar-detail/stats/StatsSidebar";
import { PageSkeleton } from "@/components/scholar-detail/shared/SkeletonLoader";
import { AddUpdateModal } from "@/components/scholar-detail/modals/AddUpdateModal";
import { EditAchievementsModal } from "@/components/scholar-detail/modals/EditAchievementsModal";
import { ContactModal } from "@/components/scholar-detail/modals/ContactModal";
import { ScholarImportModal } from "@/components/scholar-detail/modals/ScholarImportModal";
import { DetailLeftSidebar } from "@/components/scholar-detail/sections/DetailLeftSidebar";
import { RelationCard } from "@/components/scholar-detail/sections/RelationCard";
import { UpdatesCard } from "@/components/scholar-detail/sections/UpdatesCard";
import { ProjectsCard } from "@/components/scholar-detail/sections/ProjectsCard";
import { AchievementsDetailCard } from "@/components/scholar-detail/sections/AchievementsDetailCard";
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
    handleEducationSave,
    handleManagementRolesSave,
    handleRelationToggle,
    handleAddUpdate,
    handleDeleteUpdate,
    handleAchievementsSave,
    handleSaveExchangeRecords,
    handleSaveManagementRolesInline,
    handleRelationNotesSave,
  } = useScholarDetail(scholarId);

  // Modal visibility states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const getBackLink = () => {
    const prevLocation = location.state?.from;
    if (prevLocation?.search) {
      return prevLocation.pathname + prevLocation.search;
    }
    return "/scholars";
  };

  if (isLoading) return <PageSkeleton />;

  if (error || !scholar) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">{error ?? "未找到该学者"}</p>
        <Link
          to={getBackLink()}
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
        {showAddUpdate && (
          <AddUpdateModal
            onClose={() => setShowAddUpdate(false)}
            onSubmit={handleAddUpdate}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAchievementsModal && editableAchievements && (
          <EditAchievementsModal
            publications={editableAchievements.publications}
            patents={editableAchievements.patents}
            awards={editableAchievements.awards}
            onClose={() => setShowAchievementsModal(false)}
            onSubmit={async (data) => {
              await handleAchievementsSave(data);
              setShowAchievementsModal(false);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showImportModal && (
          <ScholarImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            urlHash={scholar.url_hash}
            scholarName={scholar.name}
            onSuccess={() => {
              setShowImportModal(false);
              // Optionally trigger a refresh of scholar data here
            }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Header with breadcrumb and actions */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-6"
          >
            <Link
              to={getBackLink()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              返回列表
            </Link>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="导入学者数据"
            >
              <Upload className="w-4 h-4" />
              导入数据
            </button>
          </motion.div>

          {/* Three Column Layout */}
          <div className="flex gap-5">
            {/* Left Sidebar */}
            <DetailLeftSidebar
              scholar={scholar}
              onFieldSave={handleFieldSave}
              onEducationSave={handleEducationSave}
              onManagementRolesSave={handleManagementRolesSave}
              onManagementRolesInlineSave={handleSaveManagementRolesInline}
            />

            {/* Center Content */}
            <motion.main
              className="flex-1 min-w-0 space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <RelationCard
                scholar={scholar}
                onRelationToggle={handleRelationToggle}
                onRelationNotesSave={handleRelationNotesSave}
                onSaveExchangeRecords={handleSaveExchangeRecords}
              />

              <UpdatesCard
                scholar={scholar}
                onShowAddUpdate={() => setShowAddUpdate(true)}
                onDeleteUpdate={handleDeleteUpdate}
              />

              <ProjectsCard projects={scholar.joint_research_projects} />

              <AchievementsDetailCard
                scholar={scholar}
                onShowAchievementsModal={() => setShowAchievementsModal(true)}
              />
            </motion.main>

            {/* Right Sidebar */}
            <motion.div
              variants={slideInRight}
              initial="hidden"
              animate="visible"
            >
              <StatsSidebar urlHash={scholar.url_hash} />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
