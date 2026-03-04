import { useState, useEffect } from "react";
import {
  fetchFacultyDetail,
  patchFacultyRelation,
  patchFacultyDetail,
  postFacultyUpdate,
  deleteFacultyUpdate,
  patchFacultyAchievements,
  type FacultyDetail,
  type FacultyDetailPatch,
  type NewFacultyUpdate,
  type PublicationRecord,
  type PatentRecord,
  type AwardRecord,
  type ExchangeRecord,
  type EducationRecord,
  type ManagementRole,
} from "@/services/facultyApi";

export function useScholarDetail(scholarId: string | undefined) {
  const [faculty, setFaculty] = useState<FacultyDetail | null>(null);
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
    fetchFacultyDetail(scholarId)
      .then((data) => {
        setFaculty(data);
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
  const handleFieldSave = async (patch: FacultyDetailPatch) => {
    if (!faculty) return;
    const updated = await patchFacultyDetail(faculty.url_hash, patch);
    setFaculty(updated);
  };

  // -- Education save --
  const handleEducationSave = async (records: EducationRecord[]) => {
    if (!faculty) return;
    const updated = await patchFacultyDetail(faculty.url_hash, {
      education: records,
    });
    setFaculty(updated);
  };

  // -- Management roles save (modal) --
  const handleManagementRolesSave = async (records: ManagementRole[]) => {
    if (!faculty) return;
    const updated = await patchFacultyRelation(faculty.url_hash, {
      joint_management_roles: records,
    });
    setFaculty(updated);
  };

  // -- Relation toggle --
  const handleRelationToggle = async (
    field:
      | "is_advisor_committee"
      | "is_adjunct_supervisor"
      | "is_potential_recruit",
  ) => {
    if (!faculty) return;
    const updated = await patchFacultyRelation(faculty.url_hash, {
      [field]: !faculty[field],
    });
    setFaculty(updated);
  };

  // -- Add update --
  const handleAddUpdate = async (data: NewFacultyUpdate) => {
    if (!faculty) return;
    const updated = await postFacultyUpdate(faculty.url_hash, data);
    setFaculty(updated);
  };

  // -- Delete update --
  const handleDeleteUpdate = async (index: number) => {
    if (!faculty) return;
    try {
      const updated = await deleteFacultyUpdate(faculty.url_hash, index);
      setFaculty(updated);
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
    if (!faculty) return;
    const updated = await patchFacultyAchievements(faculty.url_hash, {
      representative_publications: data.publications,
      patents: data.patents,
      awards: data.awards,
    });
    setFaculty(updated);
    setEditableAchievements(data);
  };

  // -- Exchange records save --
  const handleSaveExchangeRecords = async (records: ExchangeRecord[]) => {
    if (!faculty) return;
    const updated = await patchFacultyRelation(faculty.url_hash, {
      academic_exchange_records: records,
    });
    setFaculty(updated);
  };

  // -- Management roles inline save --
  const handleSaveManagementRolesInline = async (roles: ManagementRole[]) => {
    if (!faculty) return;
    const updated = await patchFacultyRelation(faculty.url_hash, {
      joint_management_roles: roles,
    });
    setFaculty(updated);
  };

  // -- Relation notes save --
  const handleRelationNotesSave = async (val: string) => {
    if (!faculty) return;
    const updated = await patchFacultyRelation(faculty.url_hash, {
      institute_relation_notes: val,
    });
    setFaculty(updated);
  };

  return {
    faculty,
    setFaculty,
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
  };
}
