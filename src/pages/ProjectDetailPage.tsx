import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Users,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Award,
  BookOpen,
  Plus,
  X,
  Pencil,
} from "lucide-react";
import { fetchProjectDetail, deleteProject, patchProject } from "@/services/projectApi";
import type { Project, RelatedScholar, ProjectOutput } from "@/types/project";
import { cn } from "@/utils/cn";
import { FieldEditor } from "@/components/common/FieldEditor";
import { ScholarSearchPicker, ScholarAvatar, type ScholarPickResult } from "@/components/common/ScholarSearchPicker";

const STATUS_OPTIONS = ["在研", "已结题", "已验收", "已终止"];
const STATUS_COLORS: Record<string, string> = {
  在研: "bg-blue-100 text-blue-700 border-blue-200",
  已结题: "bg-gray-100 text-gray-700 border-gray-200",
  已验收: "bg-green-100 text-green-700 border-green-200",
  已终止: "bg-red-100 text-red-700 border-red-200",
};

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [showAddField, setShowAddField] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectDetail(projectId);
      setProject(data);
      setCustomFields((data.extra as Record<string, string>) ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const updateField = async (field: keyof Project, value: any) => {
    if (!projectId || !project) return;
    await patchProject(projectId, { [field]: value });
    setProject({ ...project, [field]: value });
  };

  const addCustomField = async () => {
    if (!projectId || !project || !newFieldKey.trim()) return;
    const updated = { ...customFields, [newFieldKey.trim()]: newFieldValue };
    await patchProject(projectId, { extra: updated });
    setCustomFields(updated);
    setProject({ ...project, extra: updated });
    setNewFieldKey("");
    setNewFieldValue("");
    setShowAddField(false);
  };

  const updateCustomField = async (key: string, value: string) => {
    if (!projectId || !project) return;
    const updated = { ...customFields, [key]: value };
    await patchProject(projectId, { extra: updated });
    setCustomFields(updated);
    setProject({ ...project, extra: updated });
  };

  const deleteCustomField = async (key: string) => {
    if (!projectId || !project) return;
    const updated = { ...customFields };
    delete updated[key];
    await patchProject(projectId, { extra: updated });
    setCustomFields(updated);
    setProject({ ...project, extra: updated });
  };

  const addScholarToTeam = async (result: ScholarPickResult) => {
    if (!projectId || !project) return;
    const newScholar: RelatedScholar = {
      scholar_id: result.scholar_id,
      name: result.name,
      institution: result.institution,
      title: result.title,
      department: result.department,
      photo_url: result.photo_url,
      role: "参与者", // Default role
    };
    const updated = [...(project.related_scholars ?? []), newScholar];
    await patchProject(projectId, { related_scholars: updated });
    setProject({ ...project, related_scholars: updated });
  };

  const updateScholarRole = async (index: number, role: string) => {
    if (!projectId || !project) return;
    const updated = [...(project.related_scholars ?? [])];
    updated[index] = { ...updated[index], role };
    await patchProject(projectId, { related_scholars: updated });
    setProject({ ...project, related_scholars: updated });
  };

  const removeScholar = async (index: number) => {
    if (!projectId || !project) return;
    const updated = (project.related_scholars ?? []).filter((_, i) => i !== index);
    await patchProject(projectId, { related_scholars: updated });
    setProject({ ...project, related_scholars: updated });
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      navigate("/?tab=projects");
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || "项目未找到"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {error || "该项目不存在或已被删除"}
          </p>
          <button
            onClick={() => navigate("/?tab=projects")}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            返回项目列表
          </button>
        </div>
      </div>
    );
  }

  const statusColor =
    STATUS_COLORS[project.status] ??
    "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate("/?tab=projects")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <FieldEditor
                value={project.name}
                onSave={(v) => updateField("name", v)}
                label="项目名称"
                className="text-2xl font-bold text-gray-900 mb-2"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-full border",
                    statusColor,
                  )}
                >
                  {project.status}
                </span>
                {project.category && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {project.category}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除项目
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">项目概览</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">项目负责人</p>
                    <FieldEditor
                      value={project.pi_name}
                      onSave={(v) => updateField("pi_name", v)}
                      label="项目负责人"
                      placeholder="请输入负责人姓名"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">负责人单位</p>
                    <FieldEditor
                      value={project.pi_institution}
                      onSave={(v) => updateField("pi_institution", v)}
                      label="负责人单位"
                      placeholder="请输入单位名称"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">资助机构</p>
                    <FieldEditor
                      value={project.funder}
                      onSave={(v) => updateField("funder", v)}
                      label="资助机构"
                      placeholder="请输入资助机构"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">资助金额（万元）</p>
                    <FieldEditor
                      value={project.funding_amount}
                      onSave={(v) => updateField("funding_amount", v ? Number(v) : undefined)}
                      label="资助金额"
                      type="number"
                      placeholder="0"
                      displayFormatter={(v) => v ? `${Number(v).toLocaleString()} 万元` : "未设置"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">开始年份</p>
                    <FieldEditor
                      value={project.start_year}
                      onSave={(v) => updateField("start_year", Number(v))}
                      label="开始年份"
                      type="number"
                      displayFormatter={(v) => `${v} 年`}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">结束年份</p>
                    <FieldEditor
                      value={project.end_year}
                      onSave={(v) => updateField("end_year", v ? Number(v) : undefined)}
                      label="结束年份"
                      type="number"
                      placeholder="进行中"
                      displayFormatter={(v) => v ? `${v} 年` : "进行中"}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">项目类别</p>
                    <FieldEditor
                      value={project.category}
                      onSave={(v) => updateField("category", v)}
                      label="项目类别"
                      placeholder="未分类"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1.5">项目简介</p>
                  <FieldEditor
                    value={project.description}
                    onSave={(v) => updateField("description", v)}
                    label="项目简介"
                    type="textarea"
                    placeholder="请输入项目简介"
                  />
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  团队成员
                  {project.related_scholars && project.related_scholars.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      共 {project.related_scholars.length} 人
                    </span>
                  )}
                </h2>
              </div>

              {/* Scholar Search Picker */}
              <div className="mb-4">
                <ScholarSearchPicker
                  onSelect={addScholarToTeam}
                  placeholder="搜索学者姓名添加到团队..."
                  excludeIds={project.related_scholars?.map(s => s.scholar_id).filter(Boolean) as string[]}
                />
              </div>

              {/* Team Member List */}
              {project.related_scholars && project.related_scholars.length > 0 ? (
                <div className="space-y-3">
                  {project.related_scholars.map((scholar, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors group"
                    >
                      <ScholarAvatar
                        name={scholar.name}
                        photoUrl={scholar.photo_url}
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {scholar.name}
                          </p>
                          {scholar.title && (
                            <span className="text-xs text-gray-500">
                              {scholar.title}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {[scholar.department, scholar.institution]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value={scholar.role}
                          onChange={(e) => updateScholarRole(index, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 w-24"
                          placeholder="角色"
                        />
                        <button
                          onClick={() => removeScholar(index)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  暂无团队成员，使用上方搜索框添加
                </p>
              )}
            </div>

            {/* Project Outputs */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                项目成果
                {project.outputs && project.outputs.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    共 {project.outputs.length} 项
                  </span>
                )}
              </h2>
              {project.outputs && project.outputs.length > 0 ? (
                <div className="space-y-4">
                  {project.outputs.map((output, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {output.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                            {output.type && (
                              <span className="px-2 py-0.5 bg-white rounded border border-gray-200">
                                {output.type}
                              </span>
                            )}
                            {output.year && <span>{output.year} 年</span>}
                            {output.venue && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {output.venue}
                              </span>
                            )}
                          </div>
                          {output.authors && output.authors.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              作者：{output.authors.join(", ")}
                            </p>
                          )}
                          {output.url && (
                            <a
                              href={output.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block"
                            >
                              查看详情 →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">暂无项目成果</p>
              )}
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Keywords & Tags */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                关键词与标签
              </h2>
              <div className="space-y-3">
                {project.keywords && project.keywords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      关键词
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {project.tags && project.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      标签
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cooperation Institutions */}
            {project.cooperation_institutions &&
              project.cooperation_institutions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    合作机构
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {project.cooperation_institutions.map((inst, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm"
                      >
                        <Building2 className="w-4 h-4" />
                        {inst}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Custom Fields */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">自定义字段</h2>
                <button
                  onClick={() => setShowAddField(!showAddField)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加字段
                </button>
              </div>

              {showAddField && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    placeholder="字段名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                  />
                  <input
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="字段值"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addCustomField}
                      className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setShowAddField(false);
                        setNewFieldKey("");
                        setNewFieldValue("");
                      }}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {Object.keys(customFields).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(customFields).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">{key}</p>
                        <FieldEditor
                          value={value}
                          onSave={(v) => updateCustomField(key, v)}
                          label={key}
                          placeholder="未设置"
                        />
                      </div>
                      <button
                        onClick={() => deleteCustomField(key)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  暂无自定义字段
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirm Dialog */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">
              确定要删除项目「{project.name}」吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "删除中..." : "删除"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
