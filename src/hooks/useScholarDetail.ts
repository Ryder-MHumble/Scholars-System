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
  type JointProject,
  type ManagementRole,
  type AcademicPositionRecord,
  type ExchangeRecord,
  createAcademicPosition,
  updateAcademicPosition,
  deleteAcademicPosition,
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

  const loadScholar = useCallback(async (signal?: AbortSignal) => {
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
      const data = await fetchScholarDetail(scholarId, signal);
      setScholar(data);
      setEditableAchievements({
        publications: data.representative_publications ?? [],
        patents: data.patents ?? [],
        awards: data.awards ?? [],
      });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "加载失败");
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [scholarId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadScholar(controller.signal);
    return () => {
      controller.abort();
    };
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
    const {
      h_index,
      citations_count,
      publications_count,
      ...basicPatch
    } = patch;
    const metricsPatch = {
      ...(h_index !== undefined ? { h_index } : {}),
      ...(citations_count !== undefined ? { citations_count } : {}),
      ...(publications_count !== undefined ? { publications_count } : {}),
    };

    await withScholar(async (urlHash) => {
      if (!scholar) {
        throw new Error("Scholar detail is not loaded");
      }
      let updated: ScholarDetail = scholar;
      if (Object.keys(basicPatch).length > 0) {
        updated = await patchScholarDetail(urlHash, basicPatch);
      }
      if (Object.keys(metricsPatch).length > 0) {
        updated = await patchScholarAchievements(urlHash, metricsPatch);
      }
      return updated;
    });
  };

  // -- Education save --
  const handleEducationSave = async (records: EducationRecord[]) => {
    await withScholar((urlHash) => patchScholarDetail(urlHash, {
      education: records,
    }));
  };

  // -- Management roles save (modal) --
  const handleManagementRolesSave = async (records: ManagementRole[]) => {
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      joint_management_roles: records,
    }));
  };

  // Normalized employment history is stored in scholar_academic_positions.
  // Existing rows are updated by id; new rows are created and removed rows are deleted.
  const handleAcademicPositionsSave = async (records: AcademicPositionRecord[]) => {
    if (!scholar) return;
    const current = scholar.academic_positions ?? [];
    const next = records.filter((item) => item.organization?.trim() && item.title?.trim());
    const nextIds = new Set(next.map((item) => item.id).filter(Boolean));

    await Promise.all(
      current
        .filter((item) => item.id && !nextIds.has(item.id))
        .map((item) => deleteAcademicPosition(scholar.url_hash, item.id!)),
    );
    await Promise.all(
      next.map((item) => {
        const payload = {
          organization: item.organization.trim(),
          department: item.department || undefined,
          title: item.title.trim(),
          position_type: item.position_type || undefined,
          start_date: item.start_date || undefined,
          end_date: item.end_date || undefined,
          is_current: Boolean(item.is_current),
          description: item.description || undefined,
          source_url: item.source_url || undefined,
          source_type: item.source_type || "manual",
          added_by: item.added_by || "user",
        };
        return item.id
          ? updateAcademicPosition(scholar.url_hash, item.id, payload)
          : createAcademicPosition(scholar.url_hash, payload);
      }),
    );
    await loadScholar();
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

  // -- Achievements save (publications + patents + awards + projects) --
  const handleAchievementsSave = async (data: {
    publications: PublicationRecord[];
    patents: PatentRecord[];
    awards: AwardRecord[];
    projects: JointProject[];
  }) => {
    await withScholar(async (urlHash) => {
      // Save publications/patents/awards via achievements endpoint
      const updated = await patchScholarAchievements(urlHash, {
        representative_publications: data.publications,
        patents: data.patents,
        awards: data.awards,
      });
      // Save projects via relation endpoint
      const finalUpdated = await patchScholarRelation(urlHash, {
        joint_research_projects: data.projects,
      });
      return finalUpdated || updated;
    });
    setEditableAchievements({
      publications: data.publications,
      patents: data.patents,
      awards: data.awards,
    });
  };

  // -- Exchange records save --
  const handleSaveExchangeRecords = async (records: ExchangeRecord[]) => {
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      academic_exchange_records: records,
    }));
  };

  // -- Management roles inline save --
  const handleSaveManagementRolesInline = async (roles: ManagementRole[]) => {
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
  ) => {
    await withScholar((urlHash) => patchScholarRelation(urlHash, {
      project_tags: projectTags,
      is_cobuild_scholar: projectTags.length > 0,
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
    handleAcademicPositionsSave,
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
