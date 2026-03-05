import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Users,
  FileText,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Award,
  BookOpen,
} from "lucide-react";
import { fetchProjectDetail, deleteProject } from "@/services/projectApi";
import { ProjectFormModal } from "@/components/project/ProjectFormModal";
import type { Project, ProjectCreateRequest } from "@/types/project";
import { cn } from "@/utils/cn";

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: ProjectCreateRequest) => {
    if (!projectId) return;
    const { patchProject } = await import("@/services/projectApi");
    await patchProject(projectId, data);
    await loadProject();
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      navigate("/projects");
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
            onClick={() => navigate("/projects")}
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
        <div className="max-w-5xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {project.name}
              </h1>
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                <Pencil className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Project Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">项目概览</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">项目负责人</p>
                  <p className="text-sm font-medium text-gray-900">
                    {project.pi_name}
                  </p>
                  {project.pi_institution && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {project.pi_institution}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">资助机构</p>
                  <p className="text-sm font-medium text-gray-900">
                    {project.funder}
                  </p>
                  {project.funding_amount != null && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      资助金额：{project.funding_amount.toLocaleString()} 万元
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">项目周期</p>
                  <p className="text-sm font-medium text-gray-900">
                    {project.start_year} 年
                    {project.end_year ? ` - ${project.end_year} 年` : " 至今"}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {project.end_year
                      ? `共 ${project.end_year - project.start_year} 年`
                      : `已进行 ${new Date().getFullYear() - project.start_year} 年`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">项目类别</p>
                  <p className="text-sm font-medium text-gray-900">
                    {project.category || "未分类"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Description */}
          {project.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">项目简介</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}

          {/* Keywords & Tags */}
          {((project.keywords && project.keywords.length > 0) ||
            (project.tags && project.tags.length > 0)) && (
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
          )}

          {/* Team Members */}
          {project.related_scholars && project.related_scholars.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                团队成员
                <span className="ml-2 text-sm font-normal text-gray-500">
                  共 {project.related_scholars.length} 人
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.related_scholars.map((scholar, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
                      {scholar.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {scholar.name}
                        </p>
                        {scholar.role && (
                          <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                            {scholar.role}
                          </span>
                        )}
                      </div>
                      {scholar.institution && (
                        <p className="text-xs text-gray-600">
                          {scholar.institution}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Project Outputs */}
          {project.outputs && project.outputs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                项目成果
                <span className="ml-2 text-sm font-normal text-gray-500">
                  共 {project.outputs.length} 项
                </span>
              </h2>
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
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Modal */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        initialData={project}
        title="编辑项目"
      />

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
