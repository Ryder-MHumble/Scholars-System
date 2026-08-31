import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type {
  ScholarDetail,
  ScholarDetailPatch,
  EducationRecord,
  ManagementRole,
} from "@/services/scholarApi";
import {
  buildLegacyProfileLinkFields,
  resolveProfileLinks,
  type ProfileLinks,
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
import { readProfileFlag } from "@/utils/scholarIdentity";

interface EditProfileModalProps {
  scholar: ScholarDetail;
  onClose: () => void;
  onSubmit: (patch: ScholarDetailPatch) => Promise<void>;
  onSubmitManagementRoles?: (roles: ManagementRole[]) => Promise<void>;
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
  const [editedManagementRoles, setEditedManagementRoles] = useState<ManagementRole[]>(
    scholar.joint_management_roles ?? [],
  );
  const initialProfileLinks = resolveProfileLinks(scholar);
  const initialChineseIdentity = readProfileFlag(scholar.custom_fields, "is_chinese");
  const initialTitles = scholar.academic_titles ?? [];

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
    profile_url: initialProfileLinks.homepage,
    google_scholar_url: initialProfileLinks.google_scholar,
    dblp_url: initialProfileLinks.dblp,
    lab_url: initialProfileLinks.lab,
    orcid: initialProfileLinks.orcid,
    github_url: initialProfileLinks.github,
    linkedin_url: initialProfileLinks.linkedin,
    x_url: initialProfileLinks.x,
    openreview_url: initialProfileLinks.openreview,
    aminer_url: initialProfileLinks.aminer,
    other_profile_links: initialProfileLinks.other.join("\n"),
    bio: scholar.bio || "",
    bio_en: scholar.bio_en || "",
    research_areas: (scholar.research_areas ?? []).join(", "),
    h_index: formatMetricInput(scholar.h_index),
    publications_count: formatMetricInput(scholar.publications_count),
    citations_count: formatMetricInput(scholar.citations_count),
    chinese_identity: initialChineseIdentity === true
      ? "chinese"
      : initialChineseIdentity === false
        ? "non_chinese"
        : "unknown",
    academic_titles: initialTitles.join("\n"),
    is_academician: scholar.is_academician === true,
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addEducationItem = () => {
    setEditedEducation((prev) => [
      ...prev,
      { degree: "", institution: "", department: "", major: "", year: "", end_year: "" },
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
    setEditedManagementRoles((prev) => [...prev, { role: "", organization: "", start_year: "", end_year: "" }]);
  };

  const updateRoleItem = (
    index: number,
    key: keyof ManagementRole,
    value: string,
  ) => {
    setEditedManagementRoles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
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
    const checkMetric = (
      key: "h_index" | "publications_count" | "citations_count",
      formVal: string,
      origVal: number | null | undefined,
    ) => {
      const nextValue = parseMetricInput(formVal);
      const prevValue =
        typeof origVal === "number" && origVal >= 0 ? origVal : -1;
      if (nextValue !== prevValue) {
        patch[key] = nextValue;
      }
    };

    check("name", form.name, scholar.name);
    check("name_en", form.name_en, scholar.name_en);
    check("photo_url", form.photo_url, scholar.photo_url);
    check("university", form.university, scholar.university);
    check("department", form.department, scholar.department);
    check("position", form.position, scholar.position);
    const academicTitles = form.academic_titles
      .split(/\n|,|，/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (JSON.stringify(academicTitles) !== JSON.stringify(initialTitles)) {
      patch.academic_titles = academicTitles;
    }
    if (form.is_academician !== (scholar.is_academician === true)) {
      patch.is_academician = form.is_academician;
    }
    const nextCustomFields = buildProfileCustomFields(
      scholar.custom_fields,
      form.chinese_identity,
    );
    if (JSON.stringify(nextCustomFields) !== JSON.stringify(scholar.custom_fields ?? {})) {
      patch.custom_fields = nextCustomFields;
    }
    checkMetric("h_index", form.h_index, scholar.h_index);
    checkMetric("publications_count", form.publications_count, scholar.publications_count);
    checkMetric("citations_count", form.citations_count, scholar.citations_count);
    check("email", form.email, scholar.email);
    check("phone", form.phone, scholar.phone);
    check("office", form.office, scholar.office);
    const nextProfileLinks: ProfileLinks = {
      homepage: form.profile_url.trim(),
      lab: form.lab_url.trim(),
      github: form.github_url.trim(),
      linkedin: form.linkedin_url.trim(),
      google_scholar: form.google_scholar_url.trim(),
      orcid: form.orcid.trim(),
      dblp: form.dblp_url.trim(),
      x: form.x_url.trim(),
      openreview: form.openreview_url.trim(),
      aminer: form.aminer_url.trim(),
      other: form.other_profile_links
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (JSON.stringify(nextProfileLinks) !== JSON.stringify(initialProfileLinks)) {
      patch.profile_links = nextProfileLinks;
      Object.assign(patch, buildLegacyProfileLinkFields(nextProfileLinks));
    }
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
      .filter((item) => item.role?.trim());
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-3 sm:mx-5 h-[min(820px,92vh)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-8 pt-5 pb-4 shrink-0 bg-white">
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

        <div className="flex min-h-0 flex-1 flex-col bg-slate-50/70 md:flex-row">
          <nav className="shrink-0 bg-slate-50 px-5 py-3 sm:px-8 md:w-44 md:px-3 md:py-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide md:flex-col">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3.5 py-2 text-left text-xs rounded-xl whitespace-nowrap transition-all md:w-full",
                  activeTab === tab.key
                    ? "bg-white text-primary-700 shadow-sm font-semibold"
                    : "text-slate-600 hover:bg-white/70 hover:text-primary-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
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
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ChoiceField
                    label="华人身份"
                    value={form.chinese_identity}
                    onChange={(value) => set("chinese_identity", value)}
                    options={[
                      { value: "unknown", label: "待判定" },
                      { value: "chinese", label: "华人" },
                      { value: "non_chinese", label: "非华人" },
                    ]}
                  />
                  <ToggleField
                    label="院士身份"
                    checked={form.is_academician}
                    onChange={(checked) => setForm((prev) => ({ ...prev, is_academician: checked }))}
                  />
                </div>
                <TextareaField
                  label="学术头衔 / 荣誉"
                  value={form.academic_titles}
                  onChange={(v) => set("academic_titles", v)}
                  rows={3}
                  placeholder="每行一个，例如：ACM Fellow\nIEEE Fellow"
                />
                <div className="grid grid-cols-3 gap-3">
                  <Field
                    label="H-index"
                    value={form.h_index}
                    onChange={(v) => set("h_index", v)}
                    type="number"
                    min={0}
                    step={1}
                    placeholder="未获取"
                  />
                  <Field
                    label="论文数"
                    value={form.publications_count}
                    onChange={(v) => set("publications_count", v)}
                    type="number"
                    min={0}
                    step={1}
                    placeholder="未获取"
                  />
                  <Field
                    label="引用数"
                    value={form.citations_count}
                    onChange={(v) => set("citations_count", v)}
                    type="number"
                    min={0}
                    step={1}
                    placeholder="未获取"
                  />
                </div>
              </Section>

              <Section title="联系方式">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
            <Section title="主页链接">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field
                  label="个人主页"
                  value={form.profile_url}
                  onChange={(v) => set("profile_url", v)}
                  placeholder="https://..."
                />
                <Field
                  label="GitHub"
                  value={form.github_url}
                  onChange={(v) => set("github_url", v)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field
                  label="LinkedIn"
                  value={form.linkedin_url}
                  onChange={(v) => set("linkedin_url", v)}
                  placeholder="https://..."
                />
                <Field
                  label="Google Scholar"
                  value={form.google_scholar_url}
                  onChange={(v) => set("google_scholar_url", v)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field
                  label="ORCID"
                  value={form.orcid}
                  onChange={(v) => set("orcid", v)}
                  placeholder="0000-0000-0000-0000"
                />
                <Field
                  label="DBLP"
                  value={form.dblp_url}
                  onChange={(v) => set("dblp_url", v)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field
                  label="实验室网站"
                  value={form.lab_url}
                  onChange={(v) => set("lab_url", v)}
                  placeholder="https://..."
                />
                <Field
                  label="X (Twitter)"
                  value={form.x_url}
                  onChange={(v) => set("x_url", v)}
                  placeholder="https://x.com/..."
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field
                  label="OpenReview"
                  value={form.openreview_url}
                  onChange={(v) => set("openreview_url", v)}
                  placeholder="https://openreview.net/profile?id=..."
                />
                <Field
                  label="AMiner"
                  value={form.aminer_url}
                  onChange={(v) => set("aminer_url", v)}
                  placeholder="https://www.aminer.cn/profile/..."
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <TextareaField
                  label="其他链接"
                  value={form.other_profile_links}
                  onChange={(v) => set("other_profile_links", v)}
                  rows={3}
                  placeholder="每行一个链接"
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
                      <div className="grid grid-cols-2 gap-2">
                        <FieldCompact
                          label="院系/学院"
                          value={String(item.department ?? "")}
                          onChange={(v) => updateEducationItem(index, "department", v)}
                        />
                        <FieldCompact
                          label="专业"
                          value={String(item.major ?? "")}
                          onChange={(v) => updateEducationItem(index, "major", v)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                  placeholder={"示例：\n2015-2019 清华大学 本科 数学\n2019.9 - 2025.6 清华大学 交叉信息研究院 计算机科学与技术 博士"}
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
                      className="rounded-xl border border-slate-200 bg-white p-2 grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_5rem_5rem_auto] items-center gap-2"
                    >
                      <input
                        type="text"
                        value={item.role || ""}
                        onChange={(e) => updateRoleItem(index, "role", e.target.value)}
                        placeholder="输入任职经历"
                        className={INPUT_CLASS}
                      />
                      <input
                        type="text"
                        value={item.organization || ""}
                        onChange={(e) => updateRoleItem(index, "organization", e.target.value)}
                        placeholder="机构"
                        className={INPUT_CLASS}
                      />
                      <input
                        type="text"
                        value={item.start_year || ""}
                        onChange={(e) => updateRoleItem(index, "start_year", e.target.value)}
                        placeholder="开始"
                        className={INPUT_CLASS}
                      />
                      <input
                        type="text"
                        value={item.end_year || ""}
                        onChange={(e) => updateRoleItem(index, "end_year", e.target.value)}
                        placeholder="结束"
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
        </div>

        <div className="flex gap-3 px-5 sm:px-8 py-4 bg-white shrink-0">
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
    <section className="rounded-2xl bg-white/90 p-4 md:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <h4 className="mb-4 text-sm font-semibold text-slate-800">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function formatMetricInput(value: number | null | undefined): string {
  if (typeof value !== "number" || value < 0) return "";
  return String(value);
}

function parseMetricInput(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return -1;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : -1;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: React.HTMLInputTypeAttribute;
  min?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        min={min}
        step={step}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
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
        placeholder={placeholder}
        className={TEXTAREA_CLASS}
      />
    </div>
  );
}

function ChoiceField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 rounded-lg px-2 text-xs transition-colors",
              value === option.value
                ? "bg-white font-semibold text-primary-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm transition-colors",
          checked ? "bg-primary-50 text-primary-700" : "bg-slate-100 text-slate-500",
        )}
      >
        <span>{checked ? "是，展示院士标识" : "否"}</span>
        <span className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-primary-600" : "bg-slate-300",
        )}>
          <span className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )} />
        </span>
      </button>
    </div>
  );
}

function readCustomFieldGroup(
  customFields: Record<string, unknown> | undefined,
  key: string,
): Record<string, unknown> {
  const value = customFields?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function buildProfileCustomFields(
  customFields: Record<string, unknown> | undefined,
  identity: string,
): Record<string, unknown> {
  const next = { ...(customFields ?? {}) };
  const profileFlags = readCustomFieldGroup(customFields, "profile_flags");
  const metadataProfile = readCustomFieldGroup(customFields, "metadata_profile");

  if (identity === "chinese") {
    profileFlags.is_chinese = true;
    delete metadataProfile.is_chinese;
  } else if (identity === "non_chinese") {
    profileFlags.is_chinese = false;
    delete metadataProfile.is_chinese;
  } else {
    delete profileFlags.is_chinese;
    delete metadataProfile.is_chinese;
  }

  if (Object.keys(profileFlags).length > 0) next.profile_flags = profileFlags;
  else delete next.profile_flags;
  if (Object.keys(metadataProfile).length > 0) next.metadata_profile = metadataProfile;
  else if ("metadata_profile" in next) delete next.metadata_profile;
  return next;
}
