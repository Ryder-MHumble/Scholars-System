/**
 * 这是使用 BaseModal 重构后的示例
 * 展示如何将现有的模态窗口迁移到新的统一组件
 */

import { useState, useEffect } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { BaseModal } from "@/components/common/BaseModal";
import { ComboboxInput } from "@/components/ui/ComboboxInput";
import {
  createInstitution,
  fetchAllInstitutions,
  type InstitutionCreateRequest,
} from "@/services/institutionApi";
import type { InstitutionListItem } from "@/types/institution";

type CreateMode = "institution" | "department";

interface InstitutionForm {
  id: string;
  name: string;
  region: string;
  org_type: string;
  classification: string;
  category: string;
  priority: string;
  departments: string[];
}

interface DepartmentForm {
  parentInstitutionId: string;
  departments: string[];
}

interface InstitutionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InstitutionCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: InstitutionCreateModalProps) {
  const [createMode, setCreateMode] = useState<CreateMode>("institution");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [allInstitutions, setAllInstitutions] = useState<InstitutionListItem[]>(
    [],
  );
  const [loadingAllInst, setLoadingAllInst] = useState(false);

  const [institutionForm, setInstitutionForm] = useState<InstitutionForm>({
    id: "",
    name: "",
    region: "",
    org_type: "",
    classification: "",
    category: "",
    priority: "",
    departments: [],
  });

  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>({
    parentInstitutionId: "",
    departments: [""],
  });

  useEffect(() => {
    if (
      createMode === "department" &&
      allInstitutions.length === 0 &&
      !loadingAllInst
    ) {
      setLoadingAllInst(true);
      fetchAllInstitutions()
        .then(setAllInstitutions)
        .catch(console.error)
        .finally(() => setLoadingAllInst(false));
    }
  }, [createMode, allInstitutions.length, loadingAllInst]);

  const selectedInstitutionName =
    allInstitutions.find((i) => i.id === departmentForm.parentInstitutionId)
      ?.name || "";

  const handleCreate = async () => {
    setIsCreating(true);
    setCreateError(null);

    try {
      if (createMode === "institution") {
        if (!institutionForm.id.trim()) {
          setCreateError("机构ID不能为空");
          setIsCreating(false);
          return;
        }
        if (!institutionForm.name.trim()) {
          setCreateError("机构名称不能为空");
          setIsCreating(false);
          return;
        }

        const instId = institutionForm.id.trim();
        const cleanData: InstitutionCreateRequest = {
          id: instId,
          name: institutionForm.name.trim(),
          type: "university",
        };

        if (institutionForm.region?.trim())
          cleanData.region = institutionForm.region.trim();
        if (institutionForm.org_type?.trim())
          cleanData.org_type = institutionForm.org_type.trim();
        if (institutionForm.classification?.trim())
          cleanData.classification = institutionForm.classification.trim();
        if (institutionForm.category?.trim())
          cleanData.category = institutionForm.category.trim();
        if (institutionForm.priority?.trim())
          cleanData.priority = institutionForm.priority.trim();

        const depts = institutionForm.departments
          .map((d) => d.trim())
          .filter((d) => d.length > 0);
        if (depts.length > 0) {
          const ts = Date.now();
          cleanData.departments = depts.map((name, i) => ({
            id: `${instId}_dept_${ts}_${i}`,
            name,
          }));
        }

        await createInstitution(cleanData);
      } else {
        if (!departmentForm.parentInstitutionId) {
          setCreateError("请选择所属机构");
          setIsCreating(false);
          return;
        }

        const depts = departmentForm.departments
          .map((d) => d.trim())
          .filter((d) => d.length > 0);
        if (depts.length === 0) {
          setCreateError("请输入至少一个院系名称");
          setIsCreating(false);
          return;
        }

        const ts = Date.now();
        for (let i = 0; i < depts.length; i++) {
          await createInstitution({
            id: `${departmentForm.parentInstitutionId}_dept_${ts}_${i}`,
            name: depts[i],
            type: "department",
            parent_id: departmentForm.parentInstitutionId,
          });
        }
      }

      onClose();
      setInstitutionForm({
        id: "",
        name: "",
        region: "",
        org_type: "",
        classification: "",
        category: "",
        priority: "",
        departments: [],
      });
      setDepartmentForm({ parentInstitutionId: "", departments: [""] });
      onSuccess();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  // 使用 BaseModal 的 footer 渲染按钮
  const footer = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
      >
        取消
      </button>
      <button
        onClick={handleCreate}
        disabled={isCreating}
        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
      >
        {isCreating ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        {isCreating ? "创建中..." : "创建"}
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="添加机构或院系"
      maxWidth="2xl"
      maxHeight="85vh"
      closeOnBackdropClick={true}
      footer={footer}
    >
      {/* 模式切换 */}
      <div className="pb-4 mb-6 border-b border-slate-100">
        <div className="flex gap-3">
          <button
            onClick={() => setCreateMode("institution")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              createMode === "institution"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            新增高校
          </button>
          <button
            onClick={() => setCreateMode("department")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              createMode === "department"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            新增院系
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="space-y-4">
        {createMode === "institution" ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                高校名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={institutionForm.name}
                onChange={(e) =>
                  setInstitutionForm((f) => ({
                    ...f,
                    name: e.target.value,
                  }))
                }
                placeholder="例如：北京大学"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                机构 ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={institutionForm.id}
                onChange={(e) =>
                  setInstitutionForm((f) => ({
                    ...f,
                    id: e.target.value.trim(),
                  }))
                }
                placeholder="例如：minzu、central-univ"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all font-mono"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                用于系统内部唯一标识，建议使用英文或拼音（如 minzu、beida）
              </p>
            </div>

            {/* 其他字段省略... */}
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                选择所属高校 <span className="text-red-500">*</span>
              </label>
              <ComboboxInput
                value={selectedInstitutionName}
                onChange={(value) => {
                  const inst = allInstitutions.find((i) => i.name === value);
                  setDepartmentForm((f) => ({
                    ...f,
                    parentInstitutionId: inst?.id || "",
                  }));
                }}
                options={allInstitutions.map((inst) => inst.name)}
                placeholder={
                  loadingAllInst ? "加载中..." : "搜索或选择高校..."
                }
                disabled={loadingAllInst}
                clearable
                error={createError?.includes("所属机构") || undefined}
              />
            </div>

            {/* 院系输入省略... */}
          </>
        )}

        {createError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {createError}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
