import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Globe,
  ExternalLink,
  Award,
  Building2,
  GraduationCap,
  Briefcase,
  User,
  BookOpen,
  Phone,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Link2,
  Edit3,
  Check,
} from "lucide-react";
import type {
  FacultyDetail,
  FacultyDetailPatch,
  EducationRecord,
  ManagementRole,
} from "@/services/facultyApi";
import { ClickToEditField } from "@/components/scholar-detail/shared/ClickToEditField";
import { SideLabel } from "@/components/scholar-detail/shared/SideLabel";
import { ManagementRoleFormModal } from "@/components/scholar-detail/modals/ManagementRoleFormModal";
import { EditEducationModal } from "@/components/scholar-detail/modals/EditEducationModal";
import { EditManagementRolesModal } from "@/components/scholar-detail/modals/EditManagementRolesModal";
import { getInitial } from "@/utils/avatar";
import { staggerContainer, slideInLeft } from "@/utils/animations";

const BIO_LIMIT = 200;

interface DetailLeftSidebarProps {
  faculty: FacultyDetail;
  onFieldSave: (patch: FacultyDetailPatch) => Promise<void>;
  onEducationSave: (records: EducationRecord[]) => Promise<void>;
  onManagementRolesSave: (records: ManagementRole[]) => Promise<void>;
  onManagementRolesInlineSave: (roles: ManagementRole[]) => Promise<void>;
}

export function DetailLeftSidebar({
  faculty,
  onFieldSave,
  onEducationSave,
  onManagementRolesSave,
  onManagementRolesInlineSave,
}: DetailLeftSidebarProps) {
  const [bioExpanded, setBioExpanded] = useState(false);

  // Photo editing
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");

  // Education modal
  const [showEducationModal, setShowEducationModal] = useState(false);

  // Management roles modal (batch import)
  const [showManagementRolesModal, setShowManagementRolesModal] =
    useState(false);

  // Management roles inline editing
  const [isManagementRoleEditMode, setIsManagementRoleEditMode] =
    useState(false);
  const [editedManagementRoles, setEditedManagementRoles] = useState<
    ManagementRole[]
  >([]);
  const [showManagementRoleForm, setShowManagementRoleForm] = useState(false);
  const [editingManagementRoleIdx, setEditingManagementRoleIdx] = useState<
    number | null
  >(null);

  // Management roles handlers
  const handleEnterManagementRoleEdit = () => {
    setEditedManagementRoles([...(faculty.joint_management_roles ?? [])]);
    setIsManagementRoleEditMode(true);
  };

  const handleCancelManagementRoleEdit = () => {
    setIsManagementRoleEditMode(false);
    setEditedManagementRoles([]);
    setShowManagementRoleForm(false);
    setEditingManagementRoleIdx(null);
  };

  const handleSaveManagementRoles = async () => {
    await onManagementRolesInlineSave(editedManagementRoles);
    setIsManagementRoleEditMode(false);
    setEditedManagementRoles([]);
    setShowManagementRoleForm(false);
    setEditingManagementRoleIdx(null);
  };

  const handleManagementRoleSubmit = (role: ManagementRole) => {
    if (editingManagementRoleIdx !== null) {
      setEditedManagementRoles((prev) => {
        const updated = [...prev];
        updated[editingManagementRoleIdx] = role;
        return updated;
      });
      setEditingManagementRoleIdx(null);
    } else {
      setEditedManagementRoles((prev) => [...prev, role]);
    }
    setShowManagementRoleForm(false);
  };

  const handleDeleteManagementRole = (idx: number) => {
    setEditedManagementRoles((prev) => prev.filter((_, i) => i !== idx));
  };

  const bioText = faculty.bio ?? "";
  const bioNeedsExpand = bioText.length > BIO_LIMIT;

  const eduItems =
    faculty.education && faculty.education.length > 0
      ? faculty.education
      : faculty.phd_institution
        ? [
            {
              degree: "博士",
              institution: faculty.phd_institution,
              major: "",
              year: faculty.phd_year || "",
              end_year: "",
            },
          ]
        : [];

  return (
    <>
      {/* Management Role Form Modal */}
      {(showManagementRoleForm || editingManagementRoleIdx !== null) && (
        <ManagementRoleFormModal
          role={
            editingManagementRoleIdx !== null
              ? editedManagementRoles[editingManagementRoleIdx]
              : undefined
          }
          onClose={() => {
            setShowManagementRoleForm(false);
            setEditingManagementRoleIdx(null);
          }}
          onSubmit={handleManagementRoleSubmit}
        />
      )}

      {/* Education Modal */}
      {showEducationModal && (
        <EditEducationModal
          education={faculty.education ?? []}
          onClose={() => setShowEducationModal(false)}
          onSubmit={async (records) => {
            await onEducationSave(records);
            setShowEducationModal(false);
          }}
        />
      )}

      {/* Management Roles Batch Modal */}
      {showManagementRolesModal && (
        <EditManagementRolesModal
          roles={faculty.joint_management_roles ?? []}
          onClose={() => setShowManagementRolesModal(false)}
          onSubmit={async (records) => {
            await onManagementRolesSave(records);
            setShowManagementRolesModal(false);
          }}
        />
      )}

      <motion.aside
        className="w-[400px] shrink-0"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={slideInLeft}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Profile Header */}
          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="relative flex-shrink-0 group">
                {isEditingPhoto ? (
                  <PhotoEditor
                    photoUrlInput={photoUrlInput}
                    setPhotoUrlInput={setPhotoUrlInput}
                    onSave={async () => {
                      await onFieldSave({ photo_url: photoUrlInput });
                      setIsEditingPhoto(false);
                    }}
                    onCancel={() => {
                      setIsEditingPhoto(false);
                      setPhotoUrlInput("");
                    }}
                  />
                ) : (
                  <>
                    {faculty.photo_url ? (
                      <img
                        src={faculty.photo_url}
                        alt={faculty.name}
                        className="w-[72px] h-[72px] rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-2xl font-bold bg-primary-600 text-white">
                        {getInitial(faculty.name)}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setPhotoUrlInput(faculty.photo_url || "");
                        setIsEditingPhoto(true);
                      }}
                      className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="修改头像"
                    >
                      <Edit3 className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-lg font-bold text-gray-900 leading-snug">
                  <ClickToEditField
                    value={faculty.name}
                    onSave={async (val) => onFieldSave({ name: val })}
                    className="text-lg font-bold text-gray-900"
                  />
                </h2>
                <div className="text-sm text-gray-500">
                  <ClickToEditField
                    value={faculty.name_en || ""}
                    onSave={async (val) => onFieldSave({ name_en: val })}
                    placeholder="点击添加英文名"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <ClickToEditField
                    value={faculty.position || ""}
                    onSave={async (val) => onFieldSave({ position: val })}
                    placeholder="点击添加职称"
                  />
                </div>
                <div className="text-xs text-gray-400">
                  <ClickToEditField
                    value={faculty.department || ""}
                    onSave={async (val) => onFieldSave({ department: val })}
                    placeholder="点击添加院系"
                  />
                </div>
              </div>
            </div>

            {/* University */}
            {faculty.university && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{faculty.university}</span>
              </div>
            )}

            {/* Academic titles */}
            {faculty.academic_titles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {faculty.academic_titles.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200"
                  >
                    <Award className="w-3 h-3" />
                    {t.length > 12 ? t.slice(0, 12) + "..." : t}
                  </span>
                ))}
              </div>
            )}
            {faculty.is_academician && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                  <Award className="w-3 h-3" />
                  院士
                </span>
              </div>
            )}

            {/* Data completeness */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <span>数据完整度</span>
                <span className="font-medium text-gray-600">
                  {faculty.data_completeness}%
                </span>
              </div>
              <div className="text-gray-400">
                {faculty.crawled_at
                  ? `采集于 ${faculty.crawled_at.slice(0, 10)}`
                  : ""}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="px-5 py-4 border-t border-gray-100">
            <SideLabel icon={Mail} title="联系方式" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <ClickToEditField
                  value={faculty.email || ""}
                  onSave={async (val) => onFieldSave({ email: val })}
                  placeholder="点击添加邮箱"
                  renderValue={
                    faculty.email ? (
                      <a
                        href={`mailto:${faculty.email}`}
                        className="hover:text-primary-600 truncate transition-colors text-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {faculty.email}
                      </a>
                    ) : undefined
                  }
                />
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <ClickToEditField
                  value={faculty.phone || ""}
                  onSave={async (val) => onFieldSave({ phone: val })}
                  placeholder="点击添加电话"
                  className={
                    !faculty.phone ? "text-gray-400" : "text-gray-600"
                  }
                />
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <ClickToEditField
                  value={faculty.office || ""}
                  onSave={async (val) => onFieldSave({ office: val })}
                  placeholder="点击添加办公室"
                  className={
                    !faculty.office ? "text-gray-400" : "text-gray-600"
                  }
                />
              </div>
              {faculty.profile_url && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a
                    href={faculty.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 flex items-center gap-1 transition-colors text-gray-600"
                  >
                    个人主页
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Academic Links */}
          <AcademicLinksSection faculty={faculty} onFieldSave={onFieldSave} />

          {/* Bio */}
          <div className="px-5 py-4 border-t border-gray-100">
            <SideLabel icon={User} title="个人简介" />
            <ClickToEditField
              value={bioText}
              onSave={async (val) => onFieldSave({ bio: val })}
              multiline
              placeholder="点击添加个人简介"
              renderValue={
                bioText ? (
                  <>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {bioNeedsExpand && !bioExpanded
                        ? bioText.slice(0, BIO_LIMIT) + "..."
                        : bioText}
                    </p>
                    {bioNeedsExpand && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBioExpanded((v) => !v);
                        }}
                        className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {bioExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> 收起
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> 展开全文
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-400 italic">未添加</span>
                )
              }
            />
          </div>

          {/* Education */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <SideLabel icon={GraduationCap} title="教育经历" />
              <button
                onClick={() => setShowEducationModal(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors px-2 py-1 rounded hover:bg-primary-50 -mt-3"
              >
                <Edit3 className="w-3 h-3" /> 编辑
              </button>
            </div>
            {eduItems.length === 0 ? (
              <div className="text-sm text-gray-600">
                <ClickToEditField
                  value=""
                  onSave={async (val) =>
                    onFieldSave({ phd_institution: val })
                  }
                  placeholder="点击添加博士培养院校"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {eduItems.map((edu, i) => (
                  <div key={i} className="relative pl-5">
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
                    {i < eduItems.length - 1 && (
                      <div className="absolute left-[4px] top-4 w-0.5 h-full bg-gray-200" />
                    )}
                    <div className="space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {edu.degree || "学历"}
                        </span>
                        {(edu.year || edu.end_year) && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {edu.end_year
                              ? `${edu.year}–${edu.end_year}`
                              : edu.year}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <ClickToEditField
                          value={String(edu.institution || "")}
                          onSave={async (val) =>
                            onFieldSave({ phd_institution: val })
                          }
                          placeholder="点击编辑院校名称"
                        />
                      </div>
                      {edu.major && (
                        <div className="text-xs text-gray-400">{edu.major}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Work Experience (management roles) */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <SideLabel icon={Briefcase} title="任职经历" />
              {!isManagementRoleEditMode ? (
                <button
                  onClick={handleEnterManagementRoleEdit}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors px-2 py-1 rounded hover:bg-primary-50"
                >
                  <Edit3 className="w-3 h-3" /> 编辑
                </button>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={handleSaveManagementRoles}
                    className="flex items-center gap-1 text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 transition-colors"
                  >
                    <Check className="w-3 h-3" /> 保存
                  </button>
                  <button
                    onClick={handleCancelManagementRoleEdit}
                    className="flex items-center gap-1 text-xs border border-gray-200 text-gray-500 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-3 h-3" /> 取消
                  </button>
                </div>
              )}
            </div>

            {isManagementRoleEditMode ? (
              <div className="space-y-2">
                {editedManagementRoles.map((role, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">
                        {role.role?.toString() || "职务"}
                      </div>
                      {role.organization && (
                        <div className="text-xs text-gray-500">
                          {role.organization.toString()}
                        </div>
                      )}
                      {(role.start_year || role.end_year) && (
                        <div className="text-xs text-gray-400">
                          {role.end_year
                            ? `${role.start_year}–${role.end_year}`
                            : `${role.start_year}–至今`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingManagementRoleIdx(i);
                          setShowManagementRoleForm(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 p-0.5"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteManagementRole(i)}
                        className="text-red-500 hover:text-red-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setEditingManagementRoleIdx(null);
                    setShowManagementRoleForm(true);
                  }}
                  className="flex-1 text-xs px-3 py-1.5 border border-dashed border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 逐条添加
                </button>
                <button
                  onClick={() => setShowManagementRolesModal(true)}
                  className="flex-1 text-xs px-3 py-1.5 border border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                >
                  批量导入
                </button>
              </div>
            ) : faculty.joint_management_roles &&
              faculty.joint_management_roles.length > 0 ? (
              <div className="space-y-4">
                {faculty.joint_management_roles.map((role, i) => (
                  <div key={i} className="relative pl-5">
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    <div className="space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {role.role?.toString() || "职务"}
                        </span>
                        {(role.start_year || role.end_year) && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {role.end_year
                              ? `${role.start_year}–${role.end_year}`
                              : `${role.start_year}–至今`}
                          </span>
                        )}
                      </div>
                      {role.organization && (
                        <div className="text-sm text-gray-600">
                          {role.organization.toString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-300 italic">暂无任职经历记录</p>
            )}
          </div>

          {/* Research Areas */}
          <div className="px-5 py-4 border-t border-gray-100">
            <SideLabel icon={BookOpen} title="研究方向" />
            <ClickToEditField
              value={(faculty.research_areas ?? []).join(", ")}
              onSave={async (val) =>
                onFieldSave({
                  research_areas: val
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              multiline
              placeholder="点击添加研究方向（多个方向用逗号分隔）"
              renderValue={
                faculty.research_areas && faculty.research_areas.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {faculty.research_areas.slice(0, 10).map((area) => (
                      <span
                        key={area}
                        className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                ) : undefined
              }
            />
          </div>
        </motion.div>
      </motion.aside>
    </>
  );
}

/* -- Photo editor sub-component -- */
function PhotoEditor({
  photoUrlInput,
  setPhotoUrlInput,
  onSave,
  onCancel,
}: {
  photoUrlInput: string;
  setPhotoUrlInput: (v: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="w-[72px] flex flex-col gap-1">
      {photoUrlInput ? (
        <img
          src={photoUrlInput}
          alt="预览"
          className="w-[72px] h-[72px] rounded-xl object-cover border border-primary-300"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-xs text-gray-400 bg-gray-100 border border-dashed border-gray-300">
          预览
        </div>
      )}
      <input
        autoFocus
        type="text"
        value={photoUrlInput}
        onChange={(e) => setPhotoUrlInput(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
        placeholder="粘贴图片 URL"
      />
      <div className="flex gap-1">
        <button
          onClick={onSave}
          className="flex-1 text-xs bg-primary-600 text-white rounded py-0.5 hover:bg-primary-700 transition-colors"
        >
          <Check className="w-3 h-3 inline" />
        </button>
        <button
          onClick={onCancel}
          className="flex-1 text-xs border border-gray-200 text-gray-500 rounded py-0.5 hover:bg-gray-50 transition-colors"
        >
          <X className="w-3 h-3 inline" />
        </button>
      </div>
    </div>
  );
}

/* -- Academic links sub-component -- */
function AcademicLinksSection({
  faculty,
  onFieldSave,
}: {
  faculty: FacultyDetail;
  onFieldSave: (patch: FacultyDetailPatch) => Promise<void>;
}) {
  if (
    !faculty.google_scholar_url &&
    !faculty.dblp_url &&
    !faculty.lab_url &&
    !faculty.orcid
  ) {
    return null;
  }

  const links = [
    {
      label: "Google Scholar",
      value: faculty.google_scholar_url,
      field: "google_scholar_url" as const,
    },
    { label: "DBLP", value: faculty.dblp_url, field: "dblp_url" as const },
    {
      label: "实验室网站",
      value: faculty.lab_url,
      field: "lab_url" as const,
    },
  ];

  return (
    <div className="px-5 py-4 border-t border-gray-100">
      <SideLabel icon={Link2} title="学术链接" />
      <div className="space-y-2">
        {links.map(
          (link) =>
            link.value && (
              <div key={link.field} className="text-xs">
                <label className="text-gray-400 block mb-1">{link.label}</label>
                <ClickToEditField
                  value={link.value}
                  onSave={async (val) =>
                    onFieldSave({ [link.field]: val })
                  }
                  renderValue={
                    <a
                      href={link.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline truncate block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {link.value}
                    </a>
                  }
                />
              </div>
            ),
        )}
        {faculty.orcid && (
          <div className="text-xs">
            <label className="text-gray-400 block mb-1">ORCID</label>
            <ClickToEditField
              value={faculty.orcid}
              onSave={async (val) => onFieldSave({ orcid: val })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
