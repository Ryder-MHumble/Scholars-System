import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FolderKanban, Users, DollarSign, Calendar, Pencil, Trash2 } from "lucide-react";
import type { ProjectListItem } from "@/types/project";

interface ProjectCardProps {
  project: ProjectListItem;
  index: number;
  onEdit?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
}

const STATUS_COLORS: Record<string, string> = {
  在研: "bg-green-100 text-green-700",
  已结题: "bg-gray-100 text-gray-700",
  已验收: "bg-blue-100 text-blue-700",
  已终止: "bg-red-100 text-red-700",
};

export function ProjectCard({ project, index, onEdit, onDelete }: ProjectCardProps) {
  const statusColor =
    STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative group"
    >
      <Link
        to={`/projects/${project.id}`}
        className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}
                >
                  {project.status}
                </span>
                {project.category && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    {project.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {(onEdit || onDelete) && (
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
              onClick={(e) => e.preventDefault()}
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(project);
                  }}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(project);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Keywords */}
        {project.keywords && project.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.keywords.slice(0, 4).map((kw, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
              >
                {kw}
              </span>
            ))}
            {project.keywords.length > 4 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded">
                +{project.keywords.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">项目负责人</p>
              <p className="font-medium text-gray-900 truncate">{project.pi_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">项目周期</p>
              <p className="font-medium text-gray-900">
                {project.start_year}
                {project.end_year ? `–${project.end_year}` : " 至今"}
              </p>
            </div>
          </div>
        </div>

        {/* Funding */}
        <div className="flex items-center gap-2 text-sm p-3 bg-gray-50 rounded-lg">
          <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{project.funder}</p>
            {project.funding_amount != null && (
              <p className="font-medium text-gray-900">
                {project.funding_amount.toLocaleString()} 万元
              </p>
            )}
          </div>
        </div>

        {/* Members */}
        {project.related_scholars && project.related_scholars.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              项目成员
            </p>
            <div className="flex flex-wrap gap-2">
              {project.related_scholars.slice(0, 4).map((scholar, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs"
                >
                  <span className="font-medium text-gray-700">{scholar.name}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{scholar.role}</span>
                </div>
              ))}
              {project.related_scholars.length > 4 && (
                <div className="inline-flex items-center px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-500">
                  +{project.related_scholars.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
