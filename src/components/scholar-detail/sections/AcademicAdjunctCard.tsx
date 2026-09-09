import { useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, Edit3, Plus } from "lucide-react";
import type { ManagementRole, ScholarDetail } from "@/services/scholarApi";
import { EditManagementRolesModal } from "@/components/scholar-detail/modals/EditManagementRolesModal";
import { slideInUp } from "@/utils/animations";

interface AcademicAdjunctCardProps {
  scholar: ScholarDetail;
  onSave: (roles: ManagementRole[]) => Promise<void>;
}

export function AcademicAdjunctCard({ scholar, onSave }: AcademicAdjunctCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const roles = scholar.joint_management_roles ?? [];

  return (
    <>
      <motion.section
        variants={slideInUp}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <div className="mb-5 flex items-center gap-2">
          <BriefcaseBusiness className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">学术兼职</h3>
          <span className="text-xs text-gray-400">{roles.length} 项</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-100"
          >
            <Edit3 className="h-3 w-3" />
            编辑/批量导入
          </button>
        </div>
        {roles.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary-200 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50"
          >
            <Plus className="h-3.5 w-3.5" />
            添加学术兼职
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roles.map((item, index) => (
              <span
                key={`${item.role}-${item.organization}-${index}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-sm text-primary-700"
              >
                <span className="truncate">{item.role || "学术兼职"}</span>
                {item.organization && (
                  <span className="max-w-[16rem] truncate text-xs text-primary-500">
                    · {item.organization}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </motion.section>
      {isEditing && (
        <EditManagementRolesModal
          roles={roles}
          onClose={() => setIsEditing(false)}
          onSubmit={async (next) => {
            await onSave(next);
            setIsEditing(false);
          }}
        />
      )}
    </>
  );
}
