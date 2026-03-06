import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Check,
  AlertTriangle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useInstitutions } from "@/hooks/useInstitutions";
import { InstitutionCard } from "@/components/institution/InstitutionCard";
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
  category: string;
  priority: string;
  departments: string[];
}

interface DepartmentForm {
  parentInstitutionId: string;
  departments: string[];
}

export default function InstitutionListPage() {
  const { institutions, pagination, loading, error, loadPage } =
    useInstitutions(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    category: "",
    priority: "",
    departments: [],
  });

  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>({
    parentInstitutionId: "",
    departments: [""],
  });

  // Load all institutions when switching to department mode
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

  // Get selected institution name for display
  const selectedInstitutionName =
    allInstitutions.find((i) => i.id === departmentForm.parentInstitutionId)
      ?.name || "";

  const filtered = institutions.filter(
    (inst) =>
      inst.name.includes(searchQuery) ||
      inst.org_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateInstitution = async () => {
    setIsCreating(true);
    setCreateError(null);

    try {
      if (createMode === "institution") {
        // 场景1 + 场景3：新增高校（可选择性地添加院系）
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

        if (institutionForm.category?.trim()) {
          cleanData.category = institutionForm.category.trim();
        }
        if (institutionForm.priority?.trim()) {
          cleanData.priority = institutionForm.priority.trim();
        }

        // 场景3：如果输入了院系名称，则同时创建（自动生成院系ID）
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
        // 场景2：新增院系到现有高校
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

        // API 场景2 - 逐个创建院系，自动生成ID
        const ts = Date.now();
        for (let i = 0; i < depts.length; i++) {
          const cleanData: InstitutionCreateRequest = {
            id: `${departmentForm.parentInstitutionId}_dept_${ts}_${i}`,
            name: depts[i],
            type: "department",
            parent_id: departmentForm.parentInstitutionId,
          };
          await createInstitution(cleanData);
        }
      }

      setIsCreateModalOpen(false);
      setInstitutionForm({
        id: "",
        name: "",
        category: "",
        priority: "",
        departments: [],
      });
      setDepartmentForm({
        parentInstitutionId: "",
        departments: [""],
      });
      // Reload the list
      loadPage(1);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    setSearchQuery("");
  }, [pagination.page]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="p-6 md:p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">机构库</h2>
            <p className="text-sm text-gray-500 mt-1">
              收录{" "}
              <span className="font-semibold text-gray-700">
                {pagination.total}
              </span>{" "}
              所高校及科研机构
              {error && <span className="text-red-500 ml-2">({error})</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              添加机构
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-2xl mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索机构名称或英文名..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {searchQuery && (
          <p className="text-sm text-gray-500 mb-4">
            找到{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>{" "}
            条结果
          </p>
        )}

        {/* Content */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((institution, index) => (
              <InstitutionCard
                key={institution.id}
                institution={institution}
                index={index}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold">未找到匹配的机构</p>
            <p className="text-slate-400 text-sm mt-1">尝试修改搜索关键词</p>
          </motion.div>
        )}

        {/* ── Pagination ── */}
        {pagination.total_pages > 1 && !searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-10"
          >
            <button
              onClick={() => loadPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.total_pages ||
                    Math.abs(p - pagination.page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-slate-400 text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => loadPage(item as number)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                        item === pagination.page
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
            </div>

            <button
              onClick={() => loadPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Create Modal with Mode Selection */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                <h2 className="text-lg font-bold text-slate-900">
                  添加机构或院系
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Mode Selector */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
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

              {/* Content */}
              <div className="p-6 space-y-4">
                {createMode === "institution" ? (
                  <>
                    {/* New Institution Form */}
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
                        分类
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
                              placeholder={`例如：计算机学院`}
                              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all"
                            />
                            {institutionForm.departments.length > 0 && (
                              <button
                                onClick={() => {
                                  setInstitutionForm((f) => ({
                                    ...f,
                                    departments: f.departments.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  }));
                                }}
                                className="px-2.5 py-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-3">
                        <p className="text-xs text-amber-900 font-medium mb-1">
                          ℹ️ 一次性创建
                        </p>
                        <p className="text-xs text-amber-800">
                          高校和所有院系将在一个请求中创建。跳过此步骤以仅创建高校。
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* New Department Form */}
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
                      <p className="text-xs text-slate-500 mt-2">
                        🔍 输入高校名称快速查找。只能为现有高校添加院系。
                      </p>
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
                              placeholder={`例如：计算机学院`}
                              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all"
                            />
                            {departmentForm.departments.length > 1 && (
                              <button
                                onClick={() => {
                                  setDepartmentForm((f) => ({
                                    ...f,
                                    departments: f.departments.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  }));
                                }}
                                className="px-2.5 py-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs text-blue-900 font-medium mb-1">
                        📝 创建方式说明
                      </p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• 每个院系将独立创建（type = department）</li>
                        <li>• 所有院系都关联到选中的高校</li>
                        <li>• 院系 ID 自动生成（基于高校 ID + 时间戳）</li>
                      </ul>
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

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateInstitution}
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
    </div>
  );
}
