import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import type { FacultyDetail } from "@/services/facultyApi";
import { slideInUp } from "@/utils/animations";

interface ProjectsCardProps {
  projects: FacultyDetail["joint_research_projects"];
}

export function ProjectsCard({ projects }: ProjectsCardProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <motion.div
      variants={slideInUp}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary-600" />
        <h3 className="text-base font-semibold text-gray-900">联合研究项目</h3>
        <span className="ml-auto text-xs text-gray-400">
          {projects.length} 项
        </span>
      </div>
      <div className="space-y-3">
        {projects.map((proj, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {proj.title || "研究项目"}
                </span>
                {proj.year && (
                  <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    {String(proj.year)}
                  </span>
                )}
              </div>
              {proj.description && (
                <p className="text-xs text-gray-500 leading-relaxed">
                  {proj.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
