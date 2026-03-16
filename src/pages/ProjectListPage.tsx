import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectFormModal } from "@/components/project/ProjectFormModal";
import { ExcelImportButton } from "@/components/common/ExcelImportButton";
import { ExcelImportModal } from "@/components/common/ExcelImportModal";
import { useProjects } from "@/hooks/useProjects";
import { fetchProjectDetail } from "@/services/projectApi";
import type { ProjectListItem, ProjectCreateRequest } from "@/types/project";
import type { ExcelColumn } from "@/types/import";

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "name", label: "项目名称", required: true, hint: "完整项目名称" },
  { key: "pi_name", label: "项目负责人", required: true, hint: "负责人姓名" },
  {
    key: "pi_institution",
    label: "负责人单位",
    required: true,
    hint: "所属机构全称",
  },
  {
    key: "funder",
    label: "资助机构",
    required: true,
    hint: "如 国家自然科学基金委、科技部",
  },
  {
    key: "funding_amount",
    label: "资助金额(万元)",
    hint: "纯数字，单位万元，可留空",
  },
  {
    key: "start_year",
    label: "开始年份",
    required: true,
    hint: "4位数字年份，如 2023",
  },
  { key: "end_year", label: "结束年份", hint: "4位数字年份，可留空" },
  {
    key: "status",
    label: "项目状态",
    required: true,
    hint: "在研 / 已结题 / 已验收 / 已终止",
  },
  {
    key: "category",
    label: "项目类别",
    required: true,
    hint: "如 国家重点研发计划、国家自然科学基金",
  },
  { key: "description", label: "项目简介", hint: "简短描述，可留空" },
  {
    key: "keywords",
    label: "关键词(逗号分隔)",
    hint: "多个关键词用中英文逗号分隔",
  },
  {
    key: "tags",
    label: "标签(逗号分隔)",
    hint: "自定义标签，逗号分隔，可留空",
  },
  {
    key: "cooperation_institutions",
    label: "合作机构(逗号分隔)",
    hint: "多个合作机构用逗号分隔，可留空",
  },
];

const STATUS_FILTERS = ["全部", "在研", "已结题", "已验收", "已终止"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function ProjectListPage() {
  const {
    projects,
    total,
    loading,
    error,
    loadProjects,
    addProject,
    updateProject,
    removeProject,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("全部");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<
    import("@/types/project").Project | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const reload = useCallback(
    (search?: string, status?: string) => {
      loadProjects(1, search, status);
    },
    [loadProjects],
  );

  useEffect(() => {
    reload(searchQuery, statusFilter === "全部" ? undefined : statusFilter);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    reload(value, statusFilter === "全部" ? undefined : statusFilter);
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    reload(searchQuery, status === "全部" ? undefined : status);
  };

  const handleCreate = async (data: ProjectCreateRequest) => {
    await addProject(data);
    reload(searchQuery, statusFilter === "全部" ? undefined : statusFilter);
  };

  const handleEditClick = async (project: ProjectListItem) => {
    try {
      const detail = await fetchProjectDetail(project.id);
      setEditingProject(detail);
      setIsFormOpen(true);
    } catch {
      // fallback: open with list data cast
      setEditingProject(project as import("@/types/project").Project);
      setIsFormOpen(true);
    }
  };

  const handleUpdate = async (data: ProjectCreateRequest) => {
    if (!editingProject) return;
    await updateProject(editingProject.id, data);
    reload(searchQuery, statusFilter === "全部" ? undefined : statusFilter);
    setEditingProject(null);
  };

  const handleDeleteClick = (project: ProjectListItem) => {
    setDeleteConfirmId(project.id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    setDeleteConfirmId(null);
    try {
      await removeProject(deleteConfirmId);
      reload(searchQuery, statusFilter === "全部" ? undefined : statusFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const handleImport = async (data: Record<string, unknown>[]) => {
    for (const row of data) {
      const payload: ProjectCreateRequest = {
        name: String(row.name ?? ""),
        pi_name: String(row.pi_name ?? ""),
        pi_institution: String(row.pi_institution ?? ""),
        funder: String(row.funder ?? ""),
        funding_amount: row.funding_amount
          ? Number(row.funding_amount)
          : undefined,
        start_year: Number(row.start_year ?? new Date().getFullYear()),
        end_year: row.end_year ? Number(row.end_year) : undefined,
        status: String(row.status ?? "在研"),
        category: String(row.category ?? ""),
        description: row.description ? String(row.description) : undefined,
        keywords: row.keywords
          ? String(row.keywords)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        tags: row.tags
          ? String(row.tags)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        cooperation_institutions: row.cooperation_institutions
          ? String(row.cooperation_institutions)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        related_scholars: [],
        outputs: [],
      };
      await addProject(payload);
    }
    reload(searchQuery, statusFilter === "全部" ? undefined : statusFilter);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="p-6 md:p-8"
      >
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">项目库</h2>
              <p className="text-sm text-gray-500 mt-1">
                共 <span className="font-semibold text-gray-700">{total}</span>{" "}
                个项目
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  reload(
                    searchQuery,
                    statusFilter === "全部" ? undefined : statusFilter,
                  )
                }
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="刷新"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <ExcelImportButton
                onClick={() => setIsImportModalOpen(true)}
                label="批量导入"
              />
              <button
                onClick={() => {
                  setEditingProject(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                添加项目
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索项目名称或负责人..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 font-medium mb-2">加载失败</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() =>
                reload(
                  searchQuery,
                  statusFilter === "全部" ? undefined : statusFilter,
                )
              }
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
            >
              重试
            </button>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={
                  deletingId === project.id
                    ? "opacity-50 pointer-events-none"
                    : ""
                }
              >
                <ProjectCard
                  project={project}
                  index={index}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">暂无项目数据</p>
          </div>
        )}
      </motion.div>

      {/* Create / Edit Modal */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
        }}
        onSubmit={editingProject ? handleUpdate : handleCreate}
        initialData={editingProject}
        title={editingProject ? "编辑项目" : "添加项目"}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        columns={EXCEL_COLUMNS}
        title="批量导入项目"
        templateFilename="项目导入模板.xlsx"
      />

      {/* Delete Confirm Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">
              确定要删除该项目吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
