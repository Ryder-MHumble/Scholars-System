import { useState, useEffect } from "react";
import {
  fetchScholarDetail,
  patchScholarRelation,
  patchScholarDetail,
  postScholarUpdate,
  deleteScholarUpdate,
  patchScholarAchievements,
  type ScholarDetail,
  type ScholarDetailPatch,
  type NewScholarUpdate,
  type PublicationRecord,
  type PatentRecord,
  type AwardRecord,
  type EducationRecord,
} from "@/services/scholarApi";

export function useScholarDetail(scholarId: string | undefined) {
  const [scholar, setScholar] = useState<ScholarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableAchievements, setEditableAchievements] = useState<{
    publications: PublicationRecord[];
    patents: PatentRecord[];
    awards: AwardRecord[];
  } | null>(null);

  useEffect(() => {
    if (!scholarId) return;
    setIsLoading(true);
    setError(null);
    fetchScholarDetail(scholarId)
      .then((data) => {
        setScholar(data);
        setEditableAchievements({
          publications: data.representative_publications ?? [],
          patents: data.patents ?? [],
          awards: data.awards ?? [],
        });
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "加载失败");
        setIsLoading(false);
      });
  }, [scholarId]);

  // -- Field save --
  const handleFieldSave = async (patch: ScholarDetailPatch) => {
    if (!scholar) return;
    const updated = await patchScholarDetail(scholar.url_hash, patch);
    setScholar(updated);
  };

  // -- Education save --
  const handleEducationSave = async (records: EducationRecord[]) => {
    if (!scholar) return;
    const updated = await patchScholarDetail(scholar.url_hash, {
      education: records,
    });
    setScholar(updated);
  };

  // -- Management roles save (modal) --
  const handleManagementRolesSave = async (records: string[]) => {
    if (!scholar) return;
    const updated = await patchScholarRelation(scholar.url_hash, {
      joint_management_roles: records,
    });
    setScholar(updated);
  };

  // -- Relation toggle --
  const handleRelationToggle = async (
    field: "is_advisor_committee" | "is_potential_recruit",
  ) => {
    if (!scholar) return;
    const updated = await patchScholarRelation(scholar.url_hash, {
      [field]: !scholar[field],
    });
    setScholar(updated);
  };

  // -- Add update --
  const handleAddUpdate = async (data: NewScholarUpdate) => {
    if (!scholar) return;
    const updated = await postScholarUpdate(scholar.url_hash, data);
    setScholar(updated);
  };

  // -- Delete update --
  const handleDeleteUpdate = async (index: number) => {
    if (!scholar) return;
    try {
      const updated = await deleteScholarUpdate(scholar.url_hash, index);
      setScholar(updated);
    } catch (error) {
      console.error("Failed to delete update:", error);
    }
  };

  // -- Achievements save --
  const handleAchievementsSave = async (data: {
    publications: PublicationRecord[];
    patents: PatentRecord[];
    awards: AwardRecord[];
  }) => {
    if (!scholar) return;
    const updated = await patchScholarAchievements(scholar.url_hash, {
      representative_publications: data.publications,
      patents: data.patents,
      awards: data.awards,
    });
    setScholar(updated);
    setEditableAchievements(data);
  };

  // -- Exchange records save --
  const handleSaveExchangeRecords = async (records: string[]) => {
    if (!scholar) return;
    const updated = await patchScholarRelation(scholar.url_hash, {
      academic_exchange_records: records,
    });
    setScholar(updated);
  };

  // -- Management roles inline save --
  const handleSaveManagementRolesInline = async (roles: string[]) => {
    if (!scholar) return;
    const updated = await patchScholarRelation(scholar.url_hash, {
      joint_management_roles: roles,
    });
    setScholar(updated);
  };

  // -- Relation notes save --
  const handleRelationNotesSave = async (val: string) => {
    if (!scholar) return;
    const updated = await patchScholarRelation(scholar.url_hash, {
      institute_relation_notes: val,
    });
    setScholar(updated);
  };

  // -- Project category save --
  const handleProjectCategorySave = async (primary: string, sub: string) => {
    if (!scholar) return;
    const projectTags =
      primary || sub
        ? [{ category: primary.trim(), subcategory: sub.trim() }]
        : [];
    const updated = await patchScholarRelation(scholar.url_hash, {
      project_tags: projectTags,
      is_cobuild_scholar: projectTags.length > 0,
    });
    setScholar(updated);
  };

  return {
    scholar,
    setScholar,
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
    handleProjectCategorySave,
  };
}
