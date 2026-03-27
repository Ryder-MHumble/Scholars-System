import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type {
  ScholarDetail,
  ScholarDetailPatch,
  EducationRecord,
} from "@/services/scholarApi";
import {
  ensureDepartmentExists,
  ensureOrganizationExists,
} from "@/services/institutionApi";
import { InstitutionAutocomplete } from "@/components/common/InstitutionAutocomplete";
import { DepartmentAutocomplete } from "@/components/common/DepartmentAutocomplete";
import {
  parseEducationFromText,
  parseManagementRolesFromText,
} from "@/utils/textParsers";

interface EditProfileModalProps {
  scholar: ScholarDetail;
  onClose: () => void;
  onSubmit: (patch: ScholarDetailPatch) => Promise<void>;
  onSubmitManagementRoles?: (roles: string[]) => Promise<void>;
}

export function EditProfileModal({
  scholar,
  onClose,
  onSubmit,
  onSubmitManagementRoles,
}: EditProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [photoImgFailed, setPhotoImgFailed] = useState(false);
  const [educationBatchText, setEducationBatchText] = useState("");
  const [rolesBatchText, setRolesBatchText] = useState("");
  const [editedEducation, setEditedEducation] = useState<EducationRecord[]>(
    scholar.education ?? [],
  );
  const [editedManagementRoles, setEditedManagementRoles] = useState<string[]>(
    scholar.joint_management_roles ?? [],
  );

  // Form state
  const [form, setForm] = useState({
    name: scholar.name || "",
    name_en: scholar.name_en || "",
    photo_url: scholar.photo_url || "",
    university: scholar.university || "",
    department: scholar.department || "",
    position: scholar.position || "",
    email: scholar.email || "",
    phone: scholar.phone || "",
    office: scholar.office || "",
    profile_url: scholar.profile_url || "",
    google_scholar_url: scholar.google_scholar_url || "",
    dblp_url: scholar.dblp_url || "",
    lab_url: scholar.lab_url || "",
    orcid: scholar.orcid || "",
    bio: scholar.bio || "",
    bio_en: scholar.bio_en || "",
    research_areas: (scholar.research_areas ?? []).join(", "),
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Build patch: only changed fields
  const buildPatch = (): ScholarDetailPatch => {
    const patch: ScholarDetailPatch = {};
    const check = (
      key: keyof ScholarDetailPatch,
      formVal: string,
      origVal: string | undefined | null,
    ) => {
      if (formVal !== (origVal ?? "")) {
        (patch as Record<string, unknown>)[key] = formVal;
      }
    };

    check("name", form.name, scholar.name);
    check("name_en", form.name_en, scholar.name_en);
    check("photo_url", form.photo_url, scholar.photo_url);
    check("university", form.university, scholar.university);
    check("department", form.department, scholar.department);
    check("position", form.position, scholar.position);
    check("email", form.email, scholar.email);
    check("phone", form.phone, scholar.phone);
    check("office", form.office, scholar.office);
    check("profile_url", form.profile_url, scholar.profile_url);
    check(
      "google_scholar_url",
      form.google_scholar_url,
      scholar.google_scholar_url,
    );
    check("dblp_url", form.dblp_url, scholar.dblp_url);
    check("lab_url", form.lab_url, scholar.lab_url);
    check("orcid", form.orcid, scholar.orcid);
    check("bio", form.bio, scholar.bio);
    check("bio_en", form.bio_en, scholar.bio_en);

    const newAreas = form.research_areas
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const oldAreas = scholar.research_areas ?? [];
    if (JSON.stringify(newAreas) !== JSON.stringify(oldAreas)) {
      patch.research_areas = newAreas;
    }

    if (JSON.stringify(editedEducation) !== JSON.stringify(scholar.education ?? [])) {
      patch.education = editedEducation;
    }

    return patch;
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) {
      return "姓名为必填项";
    }
    if (!form.university.trim()) {
      return "院校为必填项";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const patch = buildPatch();
    const managementRolesChanged =
      JSON.stringify(editedManagementRoles) !==
      JSON.stringify(scholar.joint_management_roles ?? []);

    if (Object.keys(patch).length === 0 && !managementRolesChanged) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      if (Object.keys(patch).length > 0) {
        await onSubmit(patch);
      }
      if (managementRolesChanged && onSubmitManagementRoles) {
        await onSubmitManagementRoles(editedManagementRoles);
      }
      onClose();
    } catch {
      // stay open on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportEducation = () => {
    const parsed = parseEducationFromText(educationBatchText.trim());
    if (parsed.length === 0) return;
    setEditedEducation(parsed);
  };

  const handleImportManagementRoles = () => {
    const parsed = parseManagementRolesFromText(rolesBatchText.trim());
    if (parsed.length === 0) return;
    setEditedManagementRoles(parsed);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">
            编辑学者资料
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Basic Info */}
          <Section title="基本信息">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="姓名"
                value={form.name}
                onChange={(v) => set("name", v)}
                required
              />
              <Field
                label="英文名"
                value={form.name_en}
                onChange={(v) => set("name_en", v)}
                placeholder="English Name"
              />
            </div>
            {/* Avatar preview + URL */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">头像</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {form.photo_url && !photoImgFailed ? (
                    <img
                      src={form.photo_url}
                      alt="头像预览"
                      className="w-full h-full object-cover"
                      onError={() => setPhotoImgFailed(true)}
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {form.name.trim().charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  value={form.photo_url}
                  onChange={(e) => {
                    setPhotoImgFailed(false);
                    set("photo_url", e.target.value);
                  }}
                  placeholder="https://..."
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InstitutionAutocomplete
                label="院校"
                value={form.university}
                onChange={(v) => set("university", v)}
                onCreateNew={async (institutionName) => {
                  const created = await ensureOrganizationExists(institutionName);
                  return created.name;
                }}
                required
                placeholder="输入院校名称搜索..."
              />
              <DepartmentAutocomplete
                label="院系"
                value={form.department}
                onChange={(v) => set("department", v)}
                onCreateNew={async (departmentName, universityName) => {
                  const created = await ensureDepartmentExists(
                    universityName,
                    departmentName,
                  );
                  return created.name;
                }}
                university={form.university}
                placeholder="输入院系名称..."
              />
            </div>
            <Field
              label="职称"
              value={form.position}
              onChange={(v) => set("position", v)}
              placeholder="教授 / 副教授 / ..."
            />
          </Section>

          {/* Contact */}
          <Section title="联系方式">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="邮箱"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="email@example.com"
              />
              <Field
                label="电话"
                value={form.phone}
                onChange={(v) => set("phone", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="办公室"
                value={form.office}
                onChange={(v) => set("office", v)}
              />
              <Field
                label="个人主页"
                value={form.profile_url}
                onChange={(v) => set("profile_url", v)}
                placeholder="https://..."
              />
            </div>
          </Section>

          {/* Academic Links */}
          <Section title="学术链接">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Google Scholar"
                value={form.google_scholar_url}
                onChange={(v) => set("google_scholar_url", v)}
                placeholder="https://..."
              />
              <Field
                label="DBLP"
                value={form.dblp_url}
                onChange={(v) => set("dblp_url", v)}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="实验室网站"
                value={form.lab_url}
                onChange={(v) => set("lab_url", v)}
                placeholder="https://..."
              />
              <Field
                label="ORCID"
                value={form.orcid}
                onChange={(v) => set("orcid", v)}
                placeholder="0000-0000-0000-0000"
              />
            </div>
          </Section>

          {/* Bio */}
          <Section title="个人简介">
            <TextareaField
              label="中文简介"
              value={form.bio}
              onChange={(v) => set("bio", v)}
              rows={4}
            />
            <TextareaField
              label="英文简介"
              value={form.bio_en}
              onChange={(v) => set("bio_en", v)}
              rows={3}
            />
          </Section>

          {/* Research Areas */}
          <Section title="研究方向">
            <Field
              label="研究方向"
              value={form.research_areas}
              onChange={(v) => set("research_areas", v)}
              placeholder="多个方向用英文逗号分隔"
            />
          </Section>

          <Section title="经历批量导入">
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-xs font-medium text-gray-600 mb-2">教育经历</p>
              <textarea
                value={educationBatchText}
                onChange={(e) => setEducationBatchText(e.target.value)}
                rows={3}
                placeholder={"示例：\n2015-2019 清华大学 本科\n2019-2024 北京大学 博士"}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">当前 {editedEducation.length} 条</p>
                <button
                  type="button"
                  onClick={handleImportEducation}
                  className="text-xs px-2.5 py-1 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50"
                >
                  导入教育经历
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-xs font-medium text-gray-600 mb-2">任职经历</p>
              <textarea
                value={rolesBatchText}
                onChange={(e) => setRolesBatchText(e.target.value)}
                rows={3}
                placeholder={"示例：\n顾问委员会委员\n教学委员会委员"}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  当前 {editedManagementRoles.length} 条
                </p>
                <button
                  type="button"
                  onClick={handleImportManagementRoles}
                  className="text-xs px-2.5 py-1 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50"
                >
                  导入任职经历
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors resize-none"
      />
    </div>
  );
}
