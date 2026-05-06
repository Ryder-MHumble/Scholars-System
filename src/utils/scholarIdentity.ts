export type StudentIdentityFilter = "全部" | "学生" | "非学生";
export type ChineseIdentityFilter = "全部" | "华人" | "非华人" | "待判定";

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return null;
}

function readNestedBoolean(
  customFields: Record<string, unknown> | undefined,
  groupKey: string,
  valueKey: string,
): boolean | null {
  const group = customFields?.[groupKey];
  if (!group || typeof group !== "object") return null;
  const value = (group as Record<string, unknown>)[valueKey];
  return coerceBoolean(value);
}

export function readProfileFlag(
  customFields: Record<string, unknown> | undefined,
  valueKey: "is_chinese" | "is_student",
): boolean | null {
  if (valueKey === "is_student") {
    return (
      readNestedBoolean(customFields, "profile_flags", "is_student") ??
      readNestedBoolean(customFields, "profile_flags", "is_current_student") ??
      readNestedBoolean(customFields, "metadata_profile", "is_student") ??
      readNestedBoolean(customFields, "metadata_profile", "is_current_student")
    );
  }
  return (
    readNestedBoolean(customFields, "profile_flags", valueKey) ??
    readNestedBoolean(customFields, "metadata_profile", valueKey)
  );
}

export function matchesStudentIdentity(
  customFields: Record<string, unknown> | undefined,
  filter: StudentIdentityFilter,
): boolean {
  if (filter === "全部") return true;
  const isStudent = readProfileFlag(customFields, "is_student");
  if (filter === "学生") return isStudent === true;
  return isStudent === false;
}

export function matchesChineseIdentity(
  customFields: Record<string, unknown> | undefined,
  filter: ChineseIdentityFilter,
): boolean {
  if (filter === "全部") return true;
  const isChinese = readProfileFlag(customFields, "is_chinese");
  if (filter === "华人") return isChinese === true;
  if (filter === "非华人") return isChinese === false;
  return isChinese === null;
}
