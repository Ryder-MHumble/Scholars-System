import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
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

type ProfileTab =
  | "basic"
  | "links"
  | "bio"
  | "research"
  | "education"
  | "roles";

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: "basic", label: "基本信息" },
  { key: "links", label: "学术链接" },
  { key: "bio", label: "个人简介" },
  { key: "research", label: "研究方向" },
  { key: "education", label: "教育经历" },
  { key: "roles", label: "任职经历" },
];

const INPUT_CLASS =
  "w-full h-11 text-sm border border-slate-200 rounded-xl px-3 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors";

const TEXTAREA_CLASS =
  "w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors resize-none";

export function EditProfileModal({
  scholar,
  onClose,
  onSubmit,
  onSubmitManagementRoles,
}: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("basic");
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

  const addEducationItem = () => {
    setEditedEducation((prev) => [
      ...prev,
      { degree: "", institution: "", major: "", year: "", end_year: "" },
    ]);
  };

  const updateEducationItem = (
    index: number,
    key: keyof EducationRecord,
    value: string,
  ) => {
    setEditedEducation((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const removeEducationItem = (index: number) => {
    setEditedEducation((prev) => prev.filter((_, i) => i !== index));
  };

  const addRoleItem = () => {
    setEditedManagementRoles((prev) => [...prev, ""]);
  };

  const updateRoleItem = (index: number, value: string) => {
    setEditedManagementRoles((prev) =>
      prev.map((item, i) => (i === index ? value : item)),
    );
  };

  const removeRoleItem = (index: number) => {
    setEditedManagementRoles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEducationBatchTextChange = (value: string) => {
    setEducationBatchText(value);
    const trimmed = value.trim();
    if (!trimmed) return;
    const parsed = parseEducationFromText(trimmed);
    if (parsed.length > 0) {
      setEditedEducation(parsed);
    }
  };

  const handleRolesBatchTextChange = (value: string) => {
    setRolesBatchText(value);
    const trimmed = value.trim();
    if (!trimmed) return;
    const parsed = parseManagementRolesFromText(trimmed);
    if (parsed.length > 0) {
      setEditedManagementRoles(parsed);
    }
  };

  const buildPatch = (finalEducation: EducationRecord[]): ScholarDetailPatch => {
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

    if (
      JSON.stringify(finalEducation) !== JSON.stringify(scholar.education ?? [])
    ) {
      patch.education = finalEducation;
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

    // Always trust the current edited state. Batch text is parsed on input change,
    // and users may further manually adjust parsed rows before saving.
    const finalEducation = editedEducation;
    const finalManagementRoles = editedManagementRoles;

    const patch = buildPatch(finalEducation);
    const normalizedRoles = finalManagementRoles
      .map((item) => item.trim())
      .filter(Boolean);
    const managementRolesChanged =
      JSON.stringify(normalizedRoles) !==
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
        await onSubmitManagementRoles(normalizedRoles);
      }
      onClose();
    } catch {
      // stay open on error
    } finally {
      setIsSaving(false);
    }
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">编辑学者资料</h3>
              <p className="mt-1 text-xs text-slate-500">
                左右滑动或点击标签可快速切换维度，最后统一保存。
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="shrink-0 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3.5 py-2 text-xs rounded-xl border whitespace-nowrap transition-all",
                  activeTab === tab.key
                    ? "bg-white text-primary-700 border-primary-200 shadow-sm font-semibold"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary-200 hover:text-primary-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 bg-slate-50/35">
          {activeTab === "basic" && (
            <div className="space-y-6">
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
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">头像</label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {form.photo_url && !photoImgFailed ? (
                        <img
                          src={form.photo_url}
                          alt="头像预览"
                          className="w-full h-full object-cover"
                          onError={() => setPhotoImgFailed(true)}
                        />
                      ) : (
                        <span className="text-lg font-bold text-slate-400">
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
                      className={INPUT_CLASS}
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
            </div>
          )}

          {activeTab === "links" && (
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
          )}

          {activeTab === "bio" && (
            <Section title="个人简介">
              <TextareaField
                label="中文简介"
                value={form.bio}
                onChange={(v) => set("bio", v)}
                rows={5}
              />
              <TextareaField
                label="英文简介"
                value={form.bio_en}
                onChange={(v) => set("bio_en", v)}
                rows={4}
              />
            </Section>
          )}

          {activeTab === "research" && (
            <Section title="研究方向">
              <Field
                label="研究方向"
                value={form.research_areas}
                onChange={(v) => set("research_areas", v)}
                placeholder="多个方向用英文逗号分隔"
              />
            </Section>
          )}

          {activeTab === "education" && (
            <Section title="教育经历">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">当前 {editedEducation.length} 条</p>
                <button
                  type="button"
                  onClick={addEducationItem}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加一条
                </button>
              </div>

              <div className="space-y-2">
                {editedEducation.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">暂无教育经历</p>
                ) : (
                  editedEducation.map((item, index) => (
                    <div
                      key={`edu-${index}`}
                      className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <FieldCompact
                          label="学历"
                          value={String(item.degree ?? "")}
                          onChange={(v) => updateEducationItem(index, "degree", v)}
                        />
                        <FieldCompact
                          label="院校"
                          value={String(item.institution ?? "")}
                          onChange={(v) => updateEducationItem(index, "institution", v)}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <FieldCompact
                          label="专业"
                          value={String(item.major ?? "")}
                          onChange={(v) => updateEducationItem(index, "major", v)}
                        />
                        <FieldCompact
                          label="起始年份"
                          value={String(item.year ?? "")}
                          onChange={(v) => updateEducationItem(index, "year", v)}
                        />
                        <FieldCompact
                          label="结束年份"
                          value={String(item.end_year ?? "")}
                          onChange={(v) => updateEducationItem(index, "end_year", v)}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeEducationItem(index)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-600 mb-2">批量粘贴导入（覆盖当前列表）</p>
                <textarea
                  value={educationBatchText}
                  onChange={(e) => handleEducationBatchTextChange(e.target.value)}
                  rows={4}
                  placeholder={"示例：\n2015-2019 清华大学 本科\n2019-2024 北京大学 博士"}
                  className={TEXTAREA_CLASS}
                />
                <div className="mt-2">
                  <p className="text-[11px] text-slate-400">
                    粘贴后会自动识别并预览，保存时会自动提交到教育经历。
                  </p>
                </div>
              </div>
            </Section>
          )}

          {activeTab === "roles" && (
            <Section title="任职经历">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">当前 {editedManagementRoles.length} 条</p>
                <button
                  type="button"
                  onClick={addRoleItem}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加一条
                </button>
              </div>

              <div className="space-y-2">
                {editedManagementRoles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">暂无任职经历</p>
                ) : (
                  editedManagementRoles.map((item, index) => (
                    <div
                      key={`role-${index}`}
                      className="rounded-xl border border-slate-200 bg-white p-2 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateRoleItem(index, e.target.value)}
                        placeholder="输入任职经历"
                        className={INPUT_CLASS}
                      />
                      <button
                        type="button"
                        onClick={() => removeRoleItem(index)}
                        className="p-2 text-red-500 hover:text-red-600"
                        aria-label="删除任职经历"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-600 mb-2">批量粘贴导入（覆盖当前列表）</p>
                <textarea
                  value={rolesBatchText}
                  onChange={(e) => handleRolesBatchTextChange(e.target.value)}
                  rows={4}
                  placeholder={"示例：\n顾问委员会委员\n教学委员会委员"}
                  className={TEXTAREA_CLASS}
                />
                <div className="mt-2">
                  <p className="text-[11px] text-slate-400">
                    粘贴后会自动识别并预览，保存时会自动提交到任职经历。
                  </p>
                </div>
              </div>
            </Section>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-11 px-4 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 h-11 px-4 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <h4 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </section>
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
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function FieldCompact({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 text-sm border border-slate-200 rounded-lg px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
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
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={TEXTAREA_CLASS}
      />
    </div>
  );
}
