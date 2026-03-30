import { useState, useEffect, useCallback } from "react";
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
  type ScholarProjectTag,
  type ScholarEventTag,
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

  const loadScholar = useCallback(async () => {
    if (!scholarId) {
      setScholar(null);
      setEditableAchievements(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchScholarDetail(scholarId);
      setScholar(data);
      setEditableAchievements({
        publications: data.representative_publications ?? [],
        patents: data.patents ?? [],
        awards: data.awards ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [scholarId]);

  useEffect(() => {
    void loadScholar();
  }, [loadScholar]);

  const withScholar = useCallback(
    async (action: (urlHash: string) => Promise<ScholarDetail>) => {
      if (!scholar) return null;
      const updated = await action(scholar.url_hash);
      setScholar(updated);
      return updated;
    },
    [scholar],
  );

  // -- Field save --
  const handleFieldSave = async (patch: ScholarDetailPatch) => {
    await withScholar((urlHash) => patchScholarDetail(urlHash, patch));
  };

  // -- Education save --
  const handleEducationSave = async (records: EducationRecord[]) => {
    await withScholar((urlHash) => patchScholarDetail(urlHash, {
      education: records,
    }));
  };

  // -- Management roles save (modal) --
  const handleManagementRolesSave = async (records: string[]) => {
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      joint_management_roles: records,
    }));
  };

  // -- Relation toggle --
  const handleRelationToggle = async (
    field: "is_advisor_committee" | "is_potential_recruit",
  ) => {
    if (!scholar) return;
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      [field]: !scholar[field],
    }));
  };

  // -- Add update --
  const handleAddUpdate = async (data: NewScholarUpdate) => {
    await withScholar((urlHash) => postScholarUpdate(urlHash, data));
  };

  // -- Delete update --
  const handleDeleteUpdate = async (index: number) => {
    try {
      await withScholar((urlHash) => deleteScholarUpdate(urlHash, index));
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
    await withScholar((urlHash) => patchScholarAchievements(urlHash, {
      representative_publications: data.publications,
      patents: data.patents,
      awards: data.awards,
    }));
    setEditableAchievements(data);
  };

  // -- Exchange records save --
  const handleSaveExchangeRecords = async (records: string[]) => {
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      academic_exchange_records: records,
    }));
  };

  // -- Management roles inline save --
  const handleSaveManagementRolesInline = async (roles: string[]) => {
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      joint_management_roles: roles,
    }));
  };

  // -- Relation notes save --
  const handleRelationNotesSave = async (val: string) => {
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      institute_relation_notes: val,
    }));
  };

  // -- Project category save --
  const handleProjectCategorySave = async (
    projectTags: ScholarProjectTag[],
    eventTags: ScholarEventTag[],
  ) => {
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      project_tags: projectTags,
      event_tags: eventTags,
      is_cobuild_scholar: projectTags.length > 0 || eventTags.length > 0,
    }));
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
