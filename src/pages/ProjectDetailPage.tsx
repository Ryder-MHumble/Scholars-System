import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Trash2,
  Loader2,
  AlertCircle,
  Award,
  BookOpen,
  Plus,
  X,
  Pencil,
  Tag,
  Key,
  Link2,
  Calendar,
  FileText,
  Users,
} from "lucide-react";
import {
  fetchProjectDetail,
  deleteProject,
  patchProject,
} from "@/services/projectApi";
import type { Project, RelatedScholar, ProjectOutput } from "@/types/project";
import { cn } from "@/utils/cn";
import { FieldEditor } from "@/components/common/FieldEditor";
import {
  ScholarSearchPicker,
  ScholarAvatar,
  type ScholarPickResult,
} from "@/components/common/ScholarSearchPicker";
import { StatusSwitcher } from "@/components/project/StatusSwitcher";
import { EditableTagList } from "@/components/project/EditableTagList";
import { RoleSelector } from "@/components/project/RoleSelector";
import { AddOutputModal } from "@/components/project/AddOutputModal";

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  count,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <span className="text-gray-400">{icon}</span>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

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
  const [showAddOutput, setShowAddOutput] = useState(false);

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

  // ─── Field update helpers ───────────────────────────────────────────────

  const updateField = async (field: keyof Project, value: unknown) => {
    if (!projectId || !project) return;
    await patchProject(projectId, { [field]: value } as any);
    setProject({ ...project, [field]: value } as Project);
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

  // ─── Scholar / team helpers ─────────────────────────────────────────────

  const addScholarToTeam = async (result: ScholarPickResult) => {
    if (!projectId || !project) return;
    const newScholar: RelatedScholar = {
      scholar_id: result.scholar_id,
      name: result.name,
      institution: result.institution,
      title: result.title,
      department: result.department,
      photo_url: result.photo_url,
      role: "参与者",
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
    const updated = (project.related_scholars ?? []).filter(
      (_, i) => i !== index,
    );
    await patchProject(projectId, { related_scholars: updated });
    setProject({ ...project, related_scholars: updated });
  };

  // ─── Output helpers ─────────────────────────────────────────────────────

  const addOutput = async (output: ProjectOutput) => {
    if (!projectId || !project) return;
    const updated = [...(project.outputs ?? []), output];
    await patchProject(projectId, { outputs: updated });
    setProject({ ...project, outputs: updated });
    setShowAddOutput(false);
  };

  const removeOutput = async (index: number) => {
    if (!projectId || !project) return;
    const updated = (project.outputs ?? []).filter((_, i) => i !== index);
    await patchProject(projectId, { outputs: updated });
    setProject({ ...project, outputs: updated });
  };

  // ─── Delete ─────────────────────────────────────────────────────────────

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

  // ─── Loading / Error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-gray-500">加载项目详情...</p>
        </div>
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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate("/?tab=projects")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <FieldEditor
                value={project.name}
                onSave={(v) => updateField("name", v)}
                label="项目名称"
                className="text-2xl font-bold text-gray-900 mb-2"
              />
              <div className="flex items-center gap-3 flex-wrap mt-1">
                <StatusSwitcher
                  value={project.status}
                  onChange={(v) => updateField("status", v)}
                />
                {project.category && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    {project.category}
                  </span>
                )}
                {project.start_year && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {project.start_year}
                    {project.end_year ? ` - ${project.end_year}` : " - 至今"}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* ── Left Column (2/3) ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <Section title="项目概览" icon={<FileText className="w-5 h-5" />}>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      项目负责人
                    </p>
                    <FieldEditor
                      value={project.pi_name}
                      onSave={(v) => updateField("pi_name", v)}
                      label="项目负责人"
                      placeholder="请输入负责人姓名"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      负责人单位
                    </p>
                    <FieldEditor
                      value={project.pi_institution}
                      onSave={(v) => updateField("pi_institution", v)}
                      label="负责人单位"
                      placeholder="请输入单位名称"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      资助机构
                    </p>
                    <FieldEditor
                      value={project.funder}
                      onSave={(v) => updateField("funder", v)}
                      label="资助机构"
                      placeholder="请输入资助机构"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      资助金额
                    </p>
                    <FieldEditor
                      value={project.funding_amount}
                      onSave={(v) =>
                        updateField("funding_amount", v ? Number(v) : undefined)
                      }
                      label="资助金额"
                      type="number"
                      placeholder="0"
                      displayFormatter={(v) =>
                        v ? `${Number(v).toLocaleString()} 万元` : "未设置"
                      }
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      开始年份
                    </p>
                    <FieldEditor
                      value={project.start_year}
                      onSave={(v) => updateField("start_year", Number(v))}
                      label="开始年份"
                      type="number"
                      displayFormatter={(v) => (v ? `${v} 年` : "未设置")}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      结束年份
                    </p>
                    <FieldEditor
                      value={project.end_year}
                      onSave={(v) =>
                        updateField("end_year", v ? Number(v) : undefined)
                      }
                      label="结束年份"
                      type="number"
                      placeholder="进行中"
                      displayFormatter={(v) => (v ? `${v} 年` : "进行中")}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      项目类别
                    </p>
                    <FieldEditor
                      value={project.category}
                      onSave={(v) => updateField("category", v)}
                      label="项目类别"
                      placeholder="未分类"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                    项目简介
                  </p>
                  <FieldEditor
                    value={project.description}
                    onSave={(v) => updateField("description", v)}
                    label="项目简介"
                    type="textarea"
                    placeholder="请输入项目简介"
                  />
                </div>
              </div>
            </Section>

            {/* Team Members */}
            <Section
              title="团队成员"
              icon={<Users className="w-5 h-5" />}
              count={project.related_scholars?.length}
            >
              {/* Scholar Search Picker */}
              <div className="mb-5">
                <ScholarSearchPicker
                  onSelect={addScholarToTeam}
                  placeholder="搜索学者姓名添加到团队..."
                  excludeIds={
                    project.related_scholars
                      ?.map((s) => s.scholar_id)
                      .filter(Boolean) as string[]
                  }
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  从学者库中搜索并选择成员，如搜索不到可点击「新增学者到学者库」
                </p>
              </div>

              {/* Team Member List */}
              {project.related_scholars &&
              project.related_scholars.length > 0 ? (
                <div className="space-y-2">
                  {project.related_scholars.map((scholar, index) => (
                    <motion.div
                      key={`${scholar.scholar_id ?? index}`}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
                    >
                      {/* Avatar */}
                      <div
                        className="cursor-pointer"
                        onClick={() => {
                          if (scholar.scholar_id)
                            navigate(`/scholars/${scholar.scholar_id}`);
                        }}
                        title={scholar.scholar_id ? "查看学者详情" : undefined}
                      >
                        <ScholarAvatar
                          name={scholar.name}
                          photoUrl={scholar.photo_url}
                          size={44}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p
                            className={cn(
                              "text-sm font-semibold text-gray-900",
                              scholar.scholar_id &&
                                "hover:text-primary-700 cursor-pointer",
                            )}
                            onClick={() => {
                              if (scholar.scholar_id)
                                navigate(`/scholars/${scholar.scholar_id}`);
                            }}
                          >
                            {scholar.name}
                          </p>
                          {scholar.title && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {scholar.title}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {[scholar.department, scholar.institution]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>

                      {/* Role + Remove */}
                      <div className="flex items-center gap-2 shrink-0">
                        <RoleSelector
                          value={scholar.role}
                          onChange={(role) => updateScholarRole(index, role)}
                        />
                        <button
                          onClick={() => removeScholar(index)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="移除成员"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    暂无团队成员，使用上方搜索框从学者库中添加
                  </p>
                </div>
              )}
            </Section>

            {/* Project Outputs */}
            <Section
              title="项目成果"
              icon={<Award className="w-5 h-5" />}
              count={project.outputs?.length}
              action={
                <button
                  onClick={() => setShowAddOutput(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  添加成果
                </button>
              }
            >
              {project.outputs && project.outputs.length > 0 ? (
                <div className="space-y-3">
                  {project.outputs.map((output, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 group hover:border-gray-300 transition-colors"
                    >
                      <div className="p-2 bg-amber-50 rounded-lg shrink-0">
                        {output.type === "论文" ? (
                          <BookOpen className="w-4 h-4 text-amber-600" />
                        ) : output.type === "专利" ? (
                          <Key className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Award className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 mb-1.5">
                          {output.title}
                        </h3>
                        <div className="flex items-center gap-2.5 text-xs text-gray-500 flex-wrap">
                          {output.type && (
                            <span className="px-2 py-0.5 bg-white rounded border border-gray-200 font-medium">
                              {output.type}
                            </span>
                          )}
                          {output.year > 0 && <span>{output.year} 年</span>}
                          {output.venue && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {output.venue}
                            </span>
                          )}
                        </div>
                        {output.authors && output.authors.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1.5">
                            {output.authors.join(", ")}
                          </p>
                        )}
                        {output.url && (
                          <a
                            href={output.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1.5"
                          >
                            <Link2 className="w-3 h-3" />
                            查看详情
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => removeOutput(index)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="移除成果"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">暂无项目成果</p>
                  <button
                    onClick={() => setShowAddOutput(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    添加第一个成果
                  </button>
                </div>
              )}
            </Section>
          </div>

          {/* ── Right Column (1/3) ────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Keywords */}
            <Section title="关键词" icon={<Tag className="w-5 h-5" />}>
              <EditableTagList
                items={project.keywords ?? []}
                onUpdate={(items) => updateField("keywords", items)}
                color="blue"
                placeholder="输入关键词"
              />
              {(!project.keywords || project.keywords.length === 0) && (
                <p className="text-xs text-gray-400 mt-2">暂无关键词</p>
              )}
            </Section>

            {/* Tags */}
            <Section title="标签" icon={<Tag className="w-5 h-5" />}>
              <EditableTagList
                items={project.tags ?? []}
                onUpdate={(items) => updateField("tags", items)}
                color="purple"
                placeholder="输入标签"
              />
              {(!project.tags || project.tags.length === 0) && (
                <p className="text-xs text-gray-400 mt-2">暂无标签</p>
              )}
            </Section>

            {/* Cooperation Institutions */}
            <Section
              title="合作机构"
              icon={<Building2 className="w-5 h-5" />}
              count={project.cooperation_institutions?.length}
            >
              <EditableTagList
                items={project.cooperation_institutions ?? []}
                onUpdate={(items) =>
                  updateField("cooperation_institutions", items)
                }
                color="emerald"
                icon={<Building2 className="w-3 h-3" />}
                placeholder="输入机构名称"
              />
              {(!project.cooperation_institutions ||
                project.cooperation_institutions.length === 0) && (
                <p className="text-xs text-gray-400 mt-2">暂无合作机构</p>
              )}
            </Section>

            {/* Custom Fields */}
            <Section
              title="自定义字段"
              icon={<Pencil className="w-5 h-5" />}
              count={Object.keys(customFields).length}
              action={
                <button
                  onClick={() => setShowAddField(!showAddField)}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              }
            >
              <AnimatePresence>
                {showAddField && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="p-3 bg-primary-50/50 rounded-lg border border-primary-200">
                      <input
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        placeholder="字段名称"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                        autoFocus
                      />
                      <input
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="字段值"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addCustomField();
                          if (e.key === "Escape") {
                            setShowAddField(false);
                            setNewFieldKey("");
                            setNewFieldValue("");
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={addCustomField}
                          disabled={!newFieldKey.trim()}
                          className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
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
                  </motion.div>
                )}
              </AnimatePresence>

              {Object.keys(customFields).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(customFields).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-400 mb-1">
                          {key}
                        </p>
                        <FieldEditor
                          value={value}
                          onSave={(v) => updateCustomField(key, v)}
                          label={key}
                          placeholder="未设置"
                        />
                      </div>
                      <button
                        onClick={() => deleteCustomField(key)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="删除字段"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                !showAddField && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    暂无自定义字段
                  </p>
                )
              )}
            </Section>
          </div>
        </motion.div>
      </div>

      {/* ── Add Output Modal ────────────────────────────────────────────── */}
      {showAddOutput && (
        <AddOutputModal
          onAdd={addOutput}
          onClose={() => setShowAddOutput(false)}
        />
      )}

      {/* ── Delete Confirm Dialog ───────────────────────────────────────── */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">确认删除</h3>
            </div>
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
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
