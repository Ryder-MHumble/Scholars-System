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
  ScholarDetail,
  ScholarDetailPatch,
  EducationRecord,
} from "@/services/scholarApi";
import { SideLabel } from "@/components/scholar-detail/shared/SideLabel";
import { ManagementRoleFormModal } from "@/components/scholar-detail/modals/ManagementRoleFormModal";
import { EditEducationModal } from "@/components/scholar-detail/modals/EditEducationModal";
import { EditManagementRolesModal } from "@/components/scholar-detail/modals/EditManagementRolesModal";
import { getInitial } from "@/utils/avatar";
import { staggerContainer, slideInLeft } from "@/utils/animations";

const BIO_LIMIT = 200;

interface DetailLeftSidebarProps {
  scholar: ScholarDetail;
  onFieldSave?: (patch: ScholarDetailPatch) => Promise<void>;
  onEducationSave: (records: EducationRecord[]) => Promise<void>;
  onManagementRolesSave: (records: string[]) => Promise<void>;
  onManagementRolesInlineSave: (roles: string[]) => Promise<void>;
  onEditProfile?: () => void;
}

export function DetailLeftSidebar({
  scholar,
  onFieldSave,
  onEducationSave,
  onManagementRolesSave,
  onManagementRolesInlineSave,
  onEditProfile,
}: DetailLeftSidebarProps) {
  const [bioExpanded, setBioExpanded] = useState(false);

  // Photo URL inline editing
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoUrlDraft, setPhotoUrlDraft] = useState("");

  // Education modal
  const [showEducationModal, setShowEducationModal] = useState(false);

  // Management roles modal (batch import)
  const [showManagementRolesModal, setShowManagementRolesModal] =
    useState(false);

  // Management roles inline editing
  const [isManagementRoleEditMode, setIsManagementRoleEditMode] =
    useState(false);
  const [editedManagementRoles, setEditedManagementRoles] = useState<string[]>(
    [],
  );
  const [showManagementRoleForm, setShowManagementRoleForm] = useState(false);
  const [editingManagementRoleIdx, setEditingManagementRoleIdx] = useState<
    number | null
  >(null);

  // Management roles handlers
  const handleEnterManagementRoleEdit = () => {
    setEditedManagementRoles([...(scholar.joint_management_roles ?? [])]);
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

  const handleManagementRoleSubmit = (role: string) => {
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

  const bioText = scholar.bio ?? "";
  const bioNeedsExpand = bioText.length > BIO_LIMIT;

  const eduItems =
    scholar.education && scholar.education.length > 0
      ? scholar.education
      : scholar.phd_institution
        ? [
            {
              degree: "博士",
              institution: scholar.phd_institution,
              major: "",
              year: scholar.phd_year || "",
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
          education={scholar.education ?? []}
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
          roles={scholar.joint_management_roles ?? []}
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
          <div className="p-6 relative">
            <div className="flex items-center gap-4 mb-5">
              {/* Avatar — click to edit photo URL */}
              <div
                className="flex-shrink-0 relative group cursor-pointer"
                onClick={() => {
                  if (!isEditingPhoto && onFieldSave) {
                    setPhotoUrlDraft(scholar.photo_url || "");
                    setIsEditingPhoto(true);
                  }
                }}
                title={onFieldSave ? "点击修改头像 URL" : undefined}
              >
                {scholar.photo_url ? (
                  <img
                    src={scholar.photo_url}
                    alt={scholar.name}
                    className="w-[120px] h-[120px] rounded-2xl object-cover border border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-[120px] h-[120px] rounded-2xl flex items-center justify-center text-4xl font-bold bg-primary-600 text-white shadow-sm">
                    {getInitial(scholar.name)}
                  </div>
                )}
                {onFieldSave && !isEditingPhoto && (
                  <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                    <Edit3 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
              {isEditingPhoto && onFieldSave && (
                <div className="absolute left-6 top-[140px] z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-[calc(100%-48px)]">
                  <label className="text-xs text-gray-500 mb-1 block">头像 URL</label>
                  <input
                    type="text"
                    value={photoUrlDraft}
                    onChange={(e) => setPhotoUrlDraft(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-end gap-1.5 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditingPhoto(false); }}
                      className="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onFieldSave({ photo_url: photoUrlDraft });
                        setIsEditingPhoto(false);
                      }}
                      className="text-xs px-2.5 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    >
                      确定
                    </button>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
                  {scholar.name}
                </h2>
                {scholar.name_en && (
                  <p className="text-xs text-gray-400">{scholar.name_en}</p>
                )}
                {scholar.university && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{scholar.university}</span>
                  </div>
                )}
                {scholar.department && (
                  <p className="text-xs text-gray-500">{scholar.department}</p>
                )}
                {scholar.position && (
                  <p className="text-sm font-medium text-gray-700">
                    {scholar.position}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Profile Button */}
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                编辑资料
              </button>
            )}

            {/* Academic titles */}
            {scholar.academic_titles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {scholar.academic_titles.slice(0, 3).map((t) => (
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
            {scholar.is_academician && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                  <Award className="w-3 h-3" />
                  院士
                </span>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="px-5 py-4 border-t border-gray-100">
            <SideLabel icon={Mail} title="联系方式" />
            <div className="space-y-2.5">
              {scholar.email && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a
                    href={`mailto:${scholar.email}`}
                    className="hover:text-primary-600 truncate transition-colors text-gray-600"
                  >
                    {scholar.email}
                  </a>
                </div>
              )}
              {scholar.phone && (
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{scholar.phone}</span>
                </div>
              )}
              {scholar.office && (
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{scholar.office}</span>
                </div>
              )}
              {scholar.profile_url && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a
                    href={scholar.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 flex items-center gap-1 transition-colors text-gray-600"
                  >
                    个人主页
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {!scholar.email &&
                !scholar.phone &&
                !scholar.office &&
                !scholar.profile_url && (
                  <p className="text-xs text-gray-300 italic">暂无联系方式</p>
                )}
            </div>
          </div>

          {/* Academic Links */}
          <AcademicLinksSection scholar={scholar} />

          {/* Bio */}
          <div className="px-5 py-4 border-t border-gray-100">
            <SideLabel icon={User} title="个人简介" />
            {bioText ? (
              <>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {bioNeedsExpand && !bioExpanded
                    ? bioText.slice(0, BIO_LIMIT) + "..."
                    : bioText}
                </p>
                {bioNeedsExpand && (
                  <button
                    onClick={() => setBioExpanded((v) => !v)}
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
              <p className="text-xs text-gray-300 italic">暂无个人简介</p>
            )}
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
              <p className="text-xs text-gray-300 italic">暂无教育经历</p>
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
                      <p className="text-sm text-gray-600">
                        {edu.institution || ""}
                      </p>
                      {edu.major && (
                        <p className="text-xs text-gray-400">{edu.major}</p>
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
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <p className="flex-1 text-sm text-gray-800 min-w-0 truncate">
                      {role}
                    </p>
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
            ) : scholar.joint_management_roles &&
              scholar.joint_management_roles.length > 0 ? (
              <div className="space-y-2">
                {scholar.joint_management_roles.map((role, i) => (
                  <div key={i} className="relative pl-5">
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    <p className="text-sm text-gray-700">{role}</p>
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
            {scholar.research_areas && scholar.research_areas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {scholar.research_areas.slice(0, 10).map((area) => (
                  <span
                    key={area}
                    className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100"
                  >
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-300 italic">暂无研究方向</p>
            )}
          </div>
        </motion.div>
      </motion.aside>
    </>
  );
}

/* -- Academic links sub-component -- */
function AcademicLinksSection({ scholar }: { scholar: ScholarDetail }) {
  if (
    !scholar.google_scholar_url &&
    !scholar.dblp_url &&
    !scholar.lab_url &&
    !scholar.orcid
  ) {
    return null;
  }

  const links = [
    { label: "Google Scholar", value: scholar.google_scholar_url },
    { label: "DBLP", value: scholar.dblp_url },
    { label: "实验室网站", value: scholar.lab_url },
  ];

  return (
    <div className="px-5 py-4 border-t border-gray-100">
      <SideLabel icon={Link2} title="学术链接" />
      <div className="space-y-2">
        {links.map(
          (link) =>
            link.value && (
              <div key={link.label} className="text-xs">
                <label className="text-gray-400 block mb-1">{link.label}</label>
                <a
                  href={link.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline truncate block"
                >
                  {link.value}
                </a>
              </div>
            ),
        )}
        {scholar.orcid && (
          <div className="text-xs">
            <label className="text-gray-400 block mb-1">ORCID</label>
            <span className="text-gray-600">{scholar.orcid}</span>
          </div>
        )}
      </div>
    </div>
  );
}
