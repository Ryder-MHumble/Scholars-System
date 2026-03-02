/**
 * 学者详情页左侧个人信息栏
 * 包含头像、联系方式、简介、教育经历、研究方向等信息
 * 从 ScholarDetailPage.tsx 的左侧栏 JSX 提取
 */
import { useState } from "react";
import { Mail, GraduationCap, BookOpen, Edit2 } from "lucide-react";
import { ClickToEditField } from "@/components/scholar-detail/shared/ClickToEditField";
import type { FacultyDetail } from "@/services/facultyApi";

interface ProfileSidebarProps {
  faculty: FacultyDetail;
  isEditMode: boolean;
  onUpdate: (data: Partial<FacultyDetail>) => Promise<void>;
}

export function ProfileSidebar({
  faculty,
  isEditMode,
  onUpdate,
}: ProfileSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    bio: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const bioLimit = 200;
  const bioText = faculty.bio ?? "";
  const bioNeedsExpand = bioText.length > bioLimit;
  const displayBio = expandedSections.bio ? bioText : bioText.slice(0, bioLimit);

  return (
    <aside className="w-60 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* 头像和基本信息 */}
      <div className="p-6 border-b border-gray-100 text-center">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white"
          style={{ backgroundColor: "#6366f1" }}
        >
          {faculty.name?.[0]?.toUpperCase() || "?"}
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{faculty.name}</h2>
        {faculty.name_en && (
          <p className="text-xs text-gray-400 mb-2">{faculty.name_en}</p>
        )}
        <p className="text-sm text-primary-600 font-medium">{faculty.position}</p>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* 联系方式 */}
        {(faculty.email || faculty.phone) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Mail className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase">
                联系方式
              </span>
            </div>
            {faculty.email && (
              <div className="text-xs text-gray-600 break-all">
                <span className="font-medium">Email: </span>
                {isEditMode ? (
                  <ClickToEditField
                    value={faculty.email}
                    onSave={(val) => onUpdate({ email: val })}
                    placeholder="邮箱"
                  />
                ) : (
                  faculty.email
                )}
              </div>
            )}
            {faculty.phone && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">Phone: </span>
                {isEditMode ? (
                  <ClickToEditField
                    value={faculty.phone}
                    onSave={(val) => onUpdate({ phone: val })}
                    placeholder="电话"
                  />
                ) : (
                  faculty.phone
                )}
              </div>
            )}
          </div>
        )}

        {/* 简介 */}
        {faculty.bio && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Edit2 className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase">简介</span>
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {isEditMode ? (
                <ClickToEditField
                  value={faculty.bio}
                  onSave={(val) => onUpdate({ bio: val })}
                  multiline
                  placeholder="个人简介"
                />
              ) : (
                <>
                  {displayBio}
                  {bioNeedsExpand && (
                    <>
                      {!expandedSections.bio && "..."}
                      <button
                        onClick={() => toggleSection("bio")}
                        className="ml-1 text-primary-600 hover:text-primary-700 font-medium text-xs"
                      >
                        {expandedSections.bio ? "收起" : "展开"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 教育经历 */}
        {faculty.education && faculty.education.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <GraduationCap className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase">
                教育经历
              </span>
            </div>
            <div className="space-y-2">
              {faculty.education.map((edu, i) => (
                <div key={i} className="text-xs text-gray-600">
                  <p className="font-medium">{edu.degree}</p>
                  <p className="text-gray-400">{edu.institution}</p>
                  {edu.year && <p className="text-gray-400">{edu.year}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 研究方向 */}
        {faculty.research_areas && faculty.research_areas.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase">
                研究方向
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {faculty.research_areas.map((area) => (
                <span
                  key={area}
                  className="inline-block px-2 py-1 text-xs bg-primary-50 text-primary-700 border border-primary-100 rounded-full"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
