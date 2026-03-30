import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, Trash2, X } from "lucide-react";
import { patchInstitution } from "@/services/institutionApi";
import { ComboboxInput } from "@/components/ui/ComboboxInput";
import type {
  DepartmentPatchRequest,
  InstitutionDetail,
  InstitutionPatchRequest,
} from "@/types/institution";

const CLASSIFICATION_SUB_OPTIONS: Record<string, string[]> = {
  共建高校: [
    "示范性合作伙伴",
    "京内高校",
    "京外C9高校",
    "综合强校",
    "工科强校",
    "特色高校",
  ],
  兄弟院校: ["兄弟院校"],
  海外高校: ["香港高校", "亚太高校", "欧美高校", "其他地区高校"],
  其他高校: ["特色专科学校", "北京市属高校", "地方重点高校", "其他"],
  新研机构: ["同行机构", "交叉学科机构", "国家实验室"],
  行业学会: ["行业学会"],
};

const CLASSIFICATION_OPTIONS_BY_ORG_TYPE: Record<string, string[]> = {
  高校: ["共建高校", "兄弟院校", "海外高校", "其他高校"],
  研究机构: ["新研机构"],
  行业学会: ["行业学会"],
};

interface EditInstitutionForm {
  name: string;
  org_name: string;
  avatar: string;
  entity_type: "organization" | "department";
  parent_id: string;
  region: string;
  org_type: string;
  classification: string;
  sub_classification: string;
  priority: string;
  student_count_24?: number;
  student_count_25?: number;
  mentor_count?: number;
  resident_leaders: string[];
  degree_committee: string[];
  teaching_committee: string[];
  key_departments: string[];
  joint_labs: string[];
  training_cooperation: string[];
  academic_cooperation: string[];
  talent_dual_appointment: string[];
  recruitment_events: string[];
  visit_exchanges: string[];
  cooperation_focus: string[];
  departments: DepartmentPatchRequest[];
}

function normalizeLegacyClassification(value?: string | null): string {
  if (!value) return "";
  if (value === "科研院所" || value === "研究机构") return "新研机构";
  return value;
}

function normalizeLegacySubClassification(value?: string | null): string {
  if (!value) return "";
  if (value === "京内高校") return "京内高校";
  if (value === "京外C9") return "京外C9高校";
  if (value === "同行业机构") return "同行机构";
  if (value === "其他高校") return "其他";
  return value;
}

function normalizeNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseTextAreaLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function sanitizeDepartments(rows: DepartmentPatchRequest[]): DepartmentPatchRequest[] {
  return rows
    .map((row) => ({
      id: row.id?.trim() || undefined,
      name: row.name.trim(),
      org_name: row.org_name?.trim() || undefined,
    }))
    .filter((row) => row.name.length > 0);
}

export function EditInstitutionModal({
  institution,
  onClose,
  onSaved,
}: {
  institution: InstitutionDetail;
  onClose: () => void;
  onSaved: (updated: InstitutionDetail) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  const initialEntityType: "organization" | "department" =
    institution.entity_type === "department" ? "department" : "organization";

  const [form, setForm] = useState<EditInstitutionForm>({
    name: institution.name ?? "",
    org_name: institution.org_name ?? "",
    avatar: institution.avatar ?? "",
    entity_type: initialEntityType,
    parent_id: institution.parent_id ?? "",
    region: institution.region ?? "",
    org_type: institution.org_type ?? "",
    classification: normalizeLegacyClassification(institution.classification),
    sub_classification: normalizeLegacySubClassification(
      institution.sub_classification,
    ),
    priority: institution.priority ?? "",
    student_count_24: institution.student_count_24 ?? undefined,
    student_count_25: institution.student_count_25 ?? undefined,
    mentor_count: institution.mentor_count ?? undefined,
    resident_leaders: institution.resident_leaders ?? [],
    degree_committee: institution.degree_committee ?? [],
    teaching_committee: institution.teaching_committee ?? [],
    key_departments: institution.key_departments ?? [],
    joint_labs: institution.joint_labs ?? [],
    training_cooperation: institution.training_cooperation ?? [],
    academic_cooperation: institution.academic_cooperation ?? [],
    talent_dual_appointment: institution.talent_dual_appointment ?? [],
    recruitment_events: institution.recruitment_events ?? [],
    visit_exchanges: institution.visit_exchanges ?? [],
    cooperation_focus: institution.cooperation_focus ?? [],
    departments: (institution.departments ?? []).map((dept) => ({
      id: dept.id,
      name: dept.name,
      org_name: dept.org_name ?? undefined,
    })),
  });

  const avatarPreviewSrc = form.avatar.trim();
  const avatarFallbackChar = form.name.trim().charAt(0) || "机";

  const availableClassifications = useMemo(() => {
    if (!form.org_type) {
      return Object.keys(CLASSIFICATION_SUB_OPTIONS);
    }
    return (
      CLASSIFICATION_OPTIONS_BY_ORG_TYPE[form.org_type] ??
      Object.keys(CLASSIFICATION_SUB_OPTIONS)
    );
  }, [form.org_type]);

  const availableSubClassifications = useMemo(() => {
    if (!form.classification) return [];
    return CLASSIFICATION_SUB_OPTIONS[form.classification] ?? [];
  }, [form.classification]);

  const updateArrayField = (field: keyof EditInstitutionForm, textValue: string) => {
    setForm((prev) => ({ ...prev, [field]: parseTextAreaLines(textValue) }));
  };

  const setDepartmentField = (
    index: number,
    key: keyof DepartmentPatchRequest,
    value: string,
  ) => {
    setForm((prev) => {
      const next = [...prev.departments];
      const current = next[index] ?? { name: "" };
      next[index] = { ...current, [key]: value };
      return { ...prev, departments: next };
    });
  };

  const addDepartmentRow = () => {
    setForm((prev) => ({
      ...prev,
      departments: [...prev.departments, { name: "", org_name: "" }],
    }));
  };

  const removeDepartmentRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: InstitutionPatchRequest = {
        name: form.name.trim() || undefined,
        org_name: normalizeNullableString(form.org_name),
        avatar: normalizeNullableString(form.avatar),
        entity_type: form.entity_type,
        parent_id:
          form.entity_type === "department"
            ? normalizeNullableString(form.parent_id)
            : null,
        region: normalizeNullableString(form.region),
        org_type: normalizeNullableString(form.org_type),
        classification: normalizeNullableString(form.classification),
        sub_classification: normalizeNullableString(form.sub_classification),
        priority: normalizeNullableString(form.priority),
        student_count_24: form.student_count_24,
        student_count_25: form.student_count_25,
        mentor_count: form.mentor_count,
        resident_leaders: form.resident_leaders,
        degree_committee: form.degree_committee,
        teaching_committee: form.teaching_committee,
        key_departments: form.key_departments,
        joint_labs: form.joint_labs,
        training_cooperation: form.training_cooperation,
        academic_cooperation: form.academic_cooperation,
        talent_dual_appointment: form.talent_dual_appointment,
        recruitment_events: form.recruitment_events,
        visit_exchanges: form.visit_exchanges,
        cooperation_focus: form.cooperation_focus,
      };

      if (form.entity_type === "organization") {
        payload.departments = sanitizeDepartments(form.departments);
      }

      const updated = await patchInstitution(institution.id, payload);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const TextAreaField = ({
    label,
    field,
    value,
  }: {
    label: string;
    field: keyof EditInstitutionForm;
    value: string[];
  }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <textarea
        rows={3}
        value={value.join("\n")}
        onChange={(e) => updateArrayField(field, e.target.value)}
        placeholder="每行一条"
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-slate-50 focus:bg-white transition-all"
      />
    </div>
  );

  const SelectField = ({
    label,
    value,
    options,
    onChange,
    placeholder = "请选择",
    disabled = false,
  }: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (next: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => {
    const labelToValue = new Map(options.map((opt) => [opt.label, opt.value]));
    const valueToLabel = new Map(options.map((opt) => [opt.value, opt.label]));
    const selectedLabel = value ? (valueToLabel.get(value) ?? "") : "";

    return (
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
        <ComboboxInput
          value={selectedLabel}
          onChange={(nextLabel) => onChange(labelToValue.get(nextLabel) ?? "")}
          options={options.map((opt) => opt.label)}
          placeholder={placeholder}
          clearable
          disabled={disabled}
          maxHeight="260px"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">编辑机构信息</h2>
            <p className="text-xs text-slate-400 mt-0.5">{institution.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                机构名称
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                标准机构名（org_name）
              </label>
              <input
                type="text"
                value={form.org_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, org_name: e.target.value }))
                }
                placeholder="如：Tsinghua University"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              机构头像
            </label>
            <input
              type="url"
              value={form.avatar}
              onChange={(e) => {
                setAvatarPreviewError(false);
                setForm((prev) => ({ ...prev, avatar: e.target.value }));
              }}
              placeholder="https://example.com/logo.png"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
            />
            <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                {avatarPreviewSrc && !avatarPreviewError ? (
                  <img
                    src={avatarPreviewSrc}
                    alt="avatar preview"
                    className="w-full h-full object-contain"
                    onError={() => setAvatarPreviewError(true)}
                  />
                ) : (
                  <span className="text-sm font-bold text-slate-500">
                    {avatarFallbackChar}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-600">URL 预览</p>
                <p className="text-xs text-slate-500 truncate">
                  {avatarPreviewSrc
                    ? avatarPreviewError
                      ? "图片地址不可用，将显示默认头像"
                      : avatarPreviewSrc
                    : "未填写头像 URL，将显示默认头像"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <SelectField
              label="实体类型"
              value={form.entity_type}
              options={[
                { value: "organization", label: "一级机构（organization）" },
                { value: "department", label: "二级机构（department）" },
              ]}
              onChange={(next) =>
                setForm((prev) => ({
                  ...prev,
                  entity_type: (next || "organization") as
                    | "organization"
                    | "department",
                }))
              }
            />
            <SelectField
              label="地区"
              value={form.region}
              options={[
                { value: "国内", label: "国内" },
                { value: "国际", label: "国际" },
              ]}
              onChange={(next) => setForm((prev) => ({ ...prev, region: next }))}
            />
            <SelectField
              label="机构类型"
              value={form.org_type}
              options={[
                { value: "高校", label: "高校" },
                { value: "研究机构", label: "研究机构" },
                { value: "行业学会", label: "行业学会" },
                { value: "企业", label: "企业" },
                { value: "其他", label: "其他" },
              ]}
              onChange={(next) =>
                setForm((prev) => {
                  const nextClassificationOptions =
                    CLASSIFICATION_OPTIONS_BY_ORG_TYPE[next] ??
                    Object.keys(CLASSIFICATION_SUB_OPTIONS);
                  const classification = nextClassificationOptions.includes(
                    prev.classification,
                  )
                    ? prev.classification
                    : "";
                  const nextSubOptions = classification
                    ? CLASSIFICATION_SUB_OPTIONS[classification] ?? []
                    : [];
                  const subClassification = nextSubOptions.includes(
                    prev.sub_classification,
                  )
                    ? prev.sub_classification
                    : "";
                  return {
                    ...prev,
                    org_type: next,
                    classification,
                    sub_classification: subClassification,
                  };
                })
              }
            />
          </div>

          {form.entity_type === "department" && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                父机构 ID（parent_id）
              </label>
              <input
                type="text"
                value={form.parent_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, parent_id: e.target.value }))
                }
                placeholder="例如：tsinghua"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <SelectField
              label="一级分类"
              value={form.classification}
              options={availableClassifications.map((value) => ({
                value,
                label: value,
              }))}
              onChange={(next) =>
                setForm((prev) => {
                  const nextSubOptions = CLASSIFICATION_SUB_OPTIONS[next] ?? [];
                  const nextSub = nextSubOptions.includes(prev.sub_classification)
                    ? prev.sub_classification
                    : "";
                  return {
                    ...prev,
                    classification: next,
                    sub_classification: nextSub,
                  };
                })
              }
              placeholder="不设置"
            />
            <SelectField
              label="二级分类"
              value={form.sub_classification}
              options={availableSubClassifications.map((value) => ({
                value,
                label: value,
              }))}
              onChange={(next) =>
                setForm((prev) => ({ ...prev, sub_classification: next }))
              }
              placeholder={form.classification ? "请选择" : "先选择一级分类"}
              disabled={!form.classification}
            />
            <SelectField
              label="优先级"
              value={form.priority}
              options={[
                { value: "P0", label: "P0（最高）" },
                { value: "P1", label: "P1" },
                { value: "P2", label: "P2" },
                { value: "P3", label: "P3" },
              ]}
              onChange={(next) => setForm((prev) => ({ ...prev, priority: next }))}
              placeholder="不设置"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(
              [
                { label: "24 级学生数", field: "student_count_24" },
                { label: "25 级学生数", field: "student_count_25" },
                { label: "导师数", field: "mentor_count" },
              ] as const
            ).map(({ label, field }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <input
                  type="number"
                  value={form[field] ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [field]:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            ))}
          </div>

          {form.entity_type === "organization" && (
            <>
              <hr className="border-slate-100" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">二级机构（departments）</h3>
                  <button
                    type="button"
                    onClick={addDepartmentRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加二级机构
                  </button>
                </div>
                <div className="space-y-2">
                  {form.departments.length === 0 && (
                    <p className="text-xs text-slate-400">暂无二级机构，点击右上角可新增</p>
                  )}
                  {form.departments.map((dept, idx) => (
                    <div
                      key={`${dept.id ?? "new"}-${idx}`}
                      className="grid grid-cols-[1fr_2fr_2fr_auto] gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={dept.id ?? ""}
                        onChange={(e) => setDepartmentField(idx, "id", e.target.value)}
                        placeholder="留空自动分配"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                      />
                      <input
                        type="text"
                        value={dept.name}
                        onChange={(e) => setDepartmentField(idx, "name", e.target.value)}
                        placeholder="二级机构名称"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white"
                      />
                      <input
                        type="text"
                        value={dept.org_name ?? ""}
                        onChange={(e) =>
                          setDepartmentField(idx, "org_name", e.target.value)
                        }
                        placeholder="org_name（可选）"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeDepartmentRow(idx)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="删除该二级机构"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <hr className="border-slate-100" />

          <TextAreaField
            label="驻校负责人"
            field="resident_leaders"
            value={form.resident_leaders}
          />
          <TextAreaField
            label="学位委员会"
            field="degree_committee"
            value={form.degree_committee}
          />
          <TextAreaField
            label="教学委员会"
            field="teaching_committee"
            value={form.teaching_committee}
          />

          <hr className="border-slate-100" />

          <TextAreaField
            label="重点合作院系"
            field="key_departments"
            value={form.key_departments}
          />
          <TextAreaField
            label="联合实验室"
            field="joint_labs"
            value={form.joint_labs}
          />
          <TextAreaField
            label="培养合作"
            field="training_cooperation"
            value={form.training_cooperation}
          />
          <TextAreaField
            label="学术合作"
            field="academic_cooperation"
            value={form.academic_cooperation}
          />
          <TextAreaField
            label="人才双聘"
            field="talent_dual_appointment"
            value={form.talent_dual_appointment}
          />

          <hr className="border-slate-100" />

          <TextAreaField
            label="招募活动"
            field="recruitment_events"
            value={form.recruitment_events}
          />
          <TextAreaField
            label="访问交流"
            field="visit_exchanges"
            value={form.visit_exchanges}
          />
          <TextAreaField
            label="合作重点"
            field="cooperation_focus"
            value={form.cooperation_focus}
          />

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            保存更改
          </button>
        </div>
      </motion.div>
    </div>
  );
}
