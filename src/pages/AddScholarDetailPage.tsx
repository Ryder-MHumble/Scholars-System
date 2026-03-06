import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import type {
  ScholarDetail,
  PublicationRecord,
  PatentRecord,
  AwardRecord,
} from "@/services/scholarApi";
import { createScholar } from "@/services/scholarApi";
import { DetailLeftSidebar } from "@/components/scholar-detail/sections/DetailLeftSidebar";
import { RelationCard } from "@/components/scholar-detail/sections/RelationCard";
import { AchievementsDetailCard } from "@/components/scholar-detail/sections/AchievementsDetailCard";
import { EditAchievementsModal } from "@/components/scholar-detail/modals/EditAchievementsModal";
import { staggerContainer, slideInLeft } from "@/utils/animations";
import { cn } from "@/utils/cn";

type ScholarDetailPatch = Partial<Omit<ScholarDetail, "url_hash">>;

const emptyScholar: ScholarDetail = {
  url_hash: "new",
  name: "",
  name_en: "",
  photo_url: "",
  university: "",
  department: "",
  position: "",
  academic_titles: [],
  is_academician: false,
  research_areas: [],
  email: "",
  profile_url: "",
  source_id: "",
  group: "",
  data_completeness: 0,
  is_potential_recruit: false,
  is_advisor_committee: false,
  is_adjunct_supervisor: false,
  crawled_at: new Date().toISOString(),
  gender: "",
  secondary_departments: [],
  bio: "",
  bio_en: "",
  phone: "",
  office: "",
  lab_url: "",
  google_scholar_url: "",
  dblp_url: "",
  orcid: "",
  phd_institution: "",
  phd_year: "",
  education: [],
  publications_count: 0,
  h_index: 0,
  citations_count: 0,
  metrics_updated_at: "",
  supervised_students: [],
  joint_research_projects: [],
  joint_management_roles: [],
  academic_exchange_records: [],
  institute_relation_notes: "",
  relation_updated_by: "",
  relation_updated_at: "",
  recent_updates: [],
  representative_publications: [],
  patents: [],
  awards: [],
  source_url: "",
  first_seen_at: "",
  last_seen_at: "",
  is_active: true,
};

export default function AddScholarDetailPage() {
  const navigate = useNavigate();

  const [scholar, setScholar] = useState<ScholarDetail>(emptyScholar);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Basic field save handler
  const handleFieldSave = async (patch: ScholarDetailPatch) => {
    try {
      setScholar((prev) => ({ ...prev, ...patch }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    }
  };

  // Education save handler
  const handleEducationSave = async (records: any[]) => {
    try {
      setScholar((prev) => ({ ...prev, education: records }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存教育背景失败");
    }
  };

  // Management roles save handlers
  const handleManagementRolesSave = async (records: any[]) => {
    try {
      setScholar((prev) => ({ ...prev, joint_management_roles: records }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存管理角色失败");
    }
  };

  const handleManagementRolesInlineSave = async (roles: any[]) => {
    try {
      setScholar((prev) => ({ ...prev, joint_management_roles: roles }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存管理角色失败");
    }
  };

  // Achievements save handler
  const handleAchievementsSave = async (data: {
    publications: PublicationRecord[];
    patents: PatentRecord[];
    awards: AwardRecord[];
  }) => {
    try {
      setScholar((prev) => ({
        ...prev,
        representative_publications: data.publications,
        patents: data.patents,
        awards: data.awards,
      }));
      setShowAchievementsModal(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存学术成就失败");
    }
  };

  // Relation handlers (no-op for new scholar)
  const handleRelationToggle = async () => {
    // No relations for new scholar yet
  };

  const handleSaveExchangeRecords = async () => {
    // No exchange records for new scholar yet
  };

  const handleRelationNotesSave = async () => {
    // No relation notes for new scholar yet
  };

  // Save scholar
  const handleSaveScholar = async () => {
    if (!scholar.name.trim()) {
      setError("学者姓名不能为空");
      return;
    }
    if (!scholar.position) {
      setError("职称不能为空");
      return;
    }
    if (!scholar.university) {
      setError("所属院校不能为空");
      return;
    }
    if (!scholar.department) {
      setError("所属部门不能为空");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Prepare data for API
      const submitData = {
        name: scholar.name,
        name_en: scholar.name_en || undefined,
        position: scholar.position,
        university: scholar.university,
        department: scholar.department,
        email: scholar.email || undefined,
        phone: scholar.phone || undefined,
        profile_url: scholar.profile_url || undefined,
        google_scholar_url: scholar.google_scholar_url || undefined,
        dblp_url: scholar.dblp_url || undefined,
        research_areas: scholar.research_areas || [],
        academic_titles: scholar.academic_titles || [],
        bio: scholar.bio || undefined,
        added_by: "user",
      };

      await createScholar(submitData);
      navigate("/?tab=scholars");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存学者失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Modals */}
      <AnimatePresence>
        {showAchievementsModal && (
          <EditAchievementsModal
            publications={scholar.representative_publications || []}
            patents={scholar.patents || []}
            awards={scholar.awards || []}
            onClose={() => setShowAchievementsModal(false)}
            onSubmit={handleAchievementsSave}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-6"
          >
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              返回
            </button>

            <button
              onClick={handleSaveScholar}
              disabled={isSaving}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                isSaving
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700",
              )}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "保存中..." : "保存学者"}
            </button>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* Three Column Layout */}
          <div className="flex gap-5">
            {/* Left Sidebar */}
            <motion.div
              variants={slideInLeft}
              initial="hidden"
              animate="visible"
            >
              <DetailLeftSidebar
                scholar={scholar}
                onFieldSave={handleFieldSave}
                onEducationSave={handleEducationSave}
                onManagementRolesSave={handleManagementRolesSave}
                onManagementRolesInlineSave={handleManagementRolesInlineSave}
              />
            </motion.div>

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

              <AchievementsDetailCard
                scholar={scholar}
                onShowAchievementsModal={() => setShowAchievementsModal(true)}
              />
            </motion.main>
          </div>
        </div>
      </div>
    </>
  );
}
