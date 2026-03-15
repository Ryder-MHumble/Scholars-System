import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle } from "lucide-react";
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                添加机构或院系
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
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

            <div className="flex-1 overflow-y-auto px-6 py-6">
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
                        用于系统内部唯一标识，建议使用英文或拼音（如
                        minzu、beida）
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        地区
                      </label>
                      <select
                        value={institutionForm.region}
                        onChange={(e) =>
                          setInstitutionForm((f) => ({
                            ...f,
                            region: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 1rem center",
                          paddingRight: "2.5rem",
                        }}
                      >
                        <option value="">请选择地区</option>
                        <option value="国内">国内</option>
                        <option value="国际">国际</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        机构类型
                      </label>
                      <select
                        value={institutionForm.org_type}
                        onChange={(e) =>
                          setInstitutionForm((f) => ({
                            ...f,
                            org_type: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 1rem center",
                          paddingRight: "2.5rem",
                        }}
                      >
                        <option value="">请选择机构类型</option>
                        <option value="高校">高校</option>
                        <option value="研究机构">研究机构</option>
                        <option value="行业学会">行业学会</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        分类
                      </label>
                      <select
                        value={institutionForm.classification}
                        onChange={(e) =>
                          setInstitutionForm((f) => ({
                            ...f,
                            classification: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 1rem center",
                          paddingRight: "2.5rem",
                        }}
                        disabled={institutionForm.org_type !== "高校"}
                      >
                        <option value="">请选择分类</option>
                        {institutionForm.org_type === "高校" && (
                          <>
                            <option value="共建高校">共建高校</option>
                            <option value="兄弟院校">兄弟院校</option>
                            <option value="海外高校">海外高校</option>
                            <option value="其他高校">其他高校</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        标签
                      </label>
                      <input
                        type="text"
                        value={institutionForm.category}
                        onChange={(e) =>
                          setInstitutionForm((f) => ({
                            ...f,
                            category: e.target.value,
                          }))
                        }
                        placeholder="例如：京外C9、985、211"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        优先级
                      </label>
                      <input
                        type="text"
                        value={institutionForm.priority}
                        onChange={(e) =>
                          setInstitutionForm((f) => ({
                            ...f,
                            priority: e.target.value,
                          }))
                        }
                        placeholder="例如：A"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-700">
                          所辖院系（可选）
                        </label>
                        <button
                          onClick={() =>
                            setInstitutionForm((f) => ({
                              ...f,
                              departments: [...f.departments, ""],
                            }))
                          }
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + 添加院系
                        </button>
                      </div>
                      <div className="space-y-2">
                        {institutionForm.departments.map((dept, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={dept}
                              onChange={(e) => {
                                const newDepts = [
                                  ...institutionForm.departments,
                                ];
                                newDepts[idx] = e.target.value;
                                setInstitutionForm((f) => ({
                                  ...f,
                                  departments: newDepts,
                                }));
                              }}
                              placeholder="例如：计算机学院"
                              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all"
                            />
                            <button
                              onClick={() =>
                                setInstitutionForm((f) => ({
                                  ...f,
                                  departments: f.departments.filter(
                                    (_, i) => i !== idx,
                                  ),
                                }))
                              }
                              className="px-2.5 py-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
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
                          const inst = allInstitutions.find(
                            (i) => i.name === value,
                          );
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

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-700">
                          院系名称 <span className="text-red-500">*</span>
                        </label>
                        <button
                          onClick={() =>
                            setDepartmentForm((f) => ({
                              ...f,
                              departments: [...f.departments, ""],
                            }))
                          }
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + 添加院系
                        </button>
                      </div>
                      <div className="space-y-2">
                        {departmentForm.departments.map((dept, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={dept}
                              onChange={(e) => {
                                const newDepts = [
                                  ...departmentForm.departments,
                                ];
                                newDepts[idx] = e.target.value;
                                setDepartmentForm((f) => ({
                                  ...f,
                                  departments: newDepts,
                                }));
                              }}
                              placeholder="例如：计算机学院"
                              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all"
                            />
                            {departmentForm.departments.length > 1 && (
                              <button
                                onClick={() =>
                                  setDepartmentForm((f) => ({
                                    ...f,
                                    departments: f.departments.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  }))
                                }
                                className="px-2.5 py-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {createError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {createError}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 bg-white">
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
