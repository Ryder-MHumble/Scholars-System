import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  X,
  Plus,
  AlertTriangle,
  Upload,
  SortAsc,
  LayoutGrid,
} from "lucide-react";
import { useInstitutions } from "@/hooks/useInstitutions";
import { InstitutionCard } from "@/components/institution/InstitutionCard";
import { InstitutionCreateModal } from "@/components/institution/InstitutionCreateModal";
import { ExcelImportModal } from "@/components/common/ExcelImportModal";
import { createInstitution, fetchInstitutionList } from "@/services/institutionApi";
import type { ExcelColumn } from "@/types/import";
import type { InstitutionListItem } from "@/types/institution";
import { Pagination } from "@/components/common/Pagination";

const MODULE_PAGE_SIZE = 30;

type JointSubcategory =
  | "示范性合作伙伴"
  | "境内高校"
  | "京外C9高校"
  | "综合强校"
  | "工科强校"
  | "特色高校";

type OverseasSubcategory = "香港高校" | "亚太高校" | "欧美高校" | "其他地区高校";

const JOINT_SUBCATEGORY_ORDER: JointSubcategory[] = [
  "示范性合作伙伴",
  "境内高校",
  "京外C9高校",
  "综合强校",
  "工科强校",
  "特色高校",
];

const OVERSEAS_SUBCATEGORY_ORDER: OverseasSubcategory[] = [
  "香港高校",
  "亚太高校",
  "欧美高校",
  "其他地区高校",
];

interface InstitutionListViewState {
  subtab: string | null;
  searchQuery: string;
  searchInput: string;
  viewMode: "priority" | "alpha";
  page: number;
  scrollY: number;
}

const EXCEL_COLUMNS: ExcelColumn[] = [
  {
    key: "id",
    label: "机构ID",
    required: true,
    hint: "唯一英文标识，如 PKU、SJTU、CAS",
  },
  {
    key: "name",
    label: "机构名称",
    required: true,
    hint: "完整中文名称，如 北京大学",
  },
  { key: "region", label: "地区", hint: "填写：国内 或 国际" },
  { key: "org_type", label: "机构类型", hint: "高校 / 研究机构 / 行业学会" },
  {
    key: "classification",
    label: "分类",
    hint: "共建高校 / 兄弟院校 / 海外高校 / 其他高校（仅高校填写）",
  },
  { key: "category", label: "标签", hint: "自定义分类标签，可留空" },
  { key: "priority", label: "优先级", hint: "数字，越小越靠前显示，可留空" },
];

function mapSubtabToFilters(subtab: string | null): {
  region?: string;
  org_type?: string;
  classification?: string;
} {
  const mapping: Record<
    string,
    { region?: string; org_type?: string; classification?: string }
  > = {
    joint_universities: {
      region: "国内",
      org_type: "高校",
      classification: "共建高校",
    },
    sister_universities: {
      region: "国内",
      org_type: "高校",
      classification: "兄弟院校",
    },
    overseas_universities: {
      region: "国际",
      org_type: "高校",
      classification: "海外高校",
    },
    other_universities: {
      region: "国内",
      org_type: "高校",
      classification: "其他高校",
    },
    research_institutes: { org_type: "研究机构" },
    industry_associations: { org_type: "行业学会" },
  };
  return mapping[subtab || ""] || {};
}

export default function InstitutionListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subtab = searchParams.get("subtab");
  const restoredRef = useRef(false);

  const restoreStateFromLocation =
    (location.state as { restoreInstitutionListState?: InstitutionListViewState })
      ?.restoreInstitutionListState ?? null;
  const restoreState = restoreStateFromLocation;

  const apiFilters = useMemo(() => mapSubtabToFilters(subtab), [subtab]);
  const [searchQuery, setSearchQuery] = useState(
    restoreState?.subtab === subtab ? restoreState.searchQuery : "",
  );
  const [searchInput, setSearchInput] = useState(
    restoreState?.subtab === subtab ? restoreState.searchInput : "",
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"priority" | "alpha">(
    restoreState?.subtab === subtab ? restoreState.viewMode : "priority",
  );
  const [jointModuleData, setJointModuleData] = useState<
    Record<JointSubcategory, InstitutionListItem[]> | null
  >(null);
  const [overseasModuleData, setOverseasModuleData] = useState<
    Record<OverseasSubcategory, InstitutionListItem[]> | null
  >(null);
  const [moduleInstitutions, setModuleInstitutions] = useState<
    InstitutionListItem[]
  >([]);
  const [moduleTotal, setModuleTotal] = useState(0);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  const listFilters = useMemo(
    () => ({
      ...apiFilters,
      keyword: searchQuery.trim() || undefined,
    }),
    [apiFilters, searchQuery],
  );

  const initialPage =
    !restoredRef.current &&
    restoreState?.subtab === subtab &&
    restoreState.page > 0
      ? restoreState.page
      : 1;
  const isModuleSubtab =
    subtab === "joint_universities" || subtab === "overseas_universities";

  const { institutions, pagination, loading, error, loadPage } = useInstitutions(
    50,
    listFilters,
    initialPage,
    !isModuleSubtab,
  );

  useEffect(() => {
    if (!isModuleSubtab) {
      setJointModuleData(null);
      setOverseasModuleData(null);
      setModuleInstitutions([]);
      setModuleTotal(0);
      setModuleError(null);
      setModuleLoading(false);
      return;
    }

    let cancelled = false;
    const loadModuleData = async () => {
      try {
        setModuleLoading(true);
        setModuleError(null);

        if (subtab === "joint_universities") {
          const responses = await Promise.all(
            JOINT_SUBCATEGORY_ORDER.map((subCategory) =>
              fetchInstitutionList(1, MODULE_PAGE_SIZE, {
                ...listFilters,
                sub_classification: subCategory,
                view: "flat",
              }),
            ),
          );

          if (cancelled) return;
          const grouped: Record<JointSubcategory, InstitutionListItem[]> = {
            示范性合作伙伴: responses[0].items,
            境内高校: responses[1].items,
            京外C9高校: responses[2].items,
            综合强校: responses[3].items,
            工科强校: responses[4].items,
            特色高校: responses[5].items,
          };
          setJointModuleData(grouped);
          setOverseasModuleData(null);
          setModuleInstitutions(JOINT_SUBCATEGORY_ORDER.flatMap((k) => grouped[k]));
          setModuleTotal(responses.reduce((sum, resp) => sum + resp.total, 0));
          return;
        }

        if (subtab === "overseas_universities") {
          const responses = await Promise.all(
            OVERSEAS_SUBCATEGORY_ORDER.map((subCategory) =>
              fetchInstitutionList(1, MODULE_PAGE_SIZE, {
                ...listFilters,
                sub_classification: subCategory,
                view: "flat",
              }),
            ),
          );

          if (cancelled) return;
          const grouped: Record<OverseasSubcategory, InstitutionListItem[]> = {
            香港高校: responses[0].items,
            亚太高校: responses[1].items,
            欧美高校: responses[2].items,
            其他地区高校: responses[3].items,
          };
          setOverseasModuleData(grouped);
          setJointModuleData(null);
          setModuleInstitutions(
            OVERSEAS_SUBCATEGORY_ORDER.flatMap((k) => grouped[k]),
          );
          setModuleTotal(responses.reduce((sum, resp) => sum + resp.total, 0));
        }
      } catch (err) {
        if (cancelled) return;
        setModuleError(err instanceof Error ? err.message : "加载失败");
        setJointModuleData(null);
        setOverseasModuleData(null);
        setModuleInstitutions([]);
        setModuleTotal(0);
      } finally {
        if (!cancelled) {
          setModuleLoading(false);
        }
      }
    };

    loadModuleData();
    return () => {
      cancelled = true;
    };
  }, [isModuleSubtab, listFilters, subtab]);

  useEffect(() => {
    if (!restoreState || restoreState.subtab !== subtab || restoredRef.current) {
      return;
    }
    restoredRef.current = true;
    setSearchInput(restoreState.searchInput ?? "");
    setSearchQuery(restoreState.searchQuery ?? "");
    setViewMode(restoreState.viewMode ?? "priority");
  }, [restoreState, subtab]);

  useEffect(() => {
    if (!restoreState || restoreState.subtab !== subtab) {
      return;
    }
    if ((isModuleSubtab && moduleLoading) || (!isModuleSubtab && loading)) {
      return;
    }
    requestAnimationFrame(() => {
      window.scrollTo({
        top: Math.max(restoreState.scrollY ?? 0, 0),
        behavior: "auto",
      });
    });
  }, [isModuleSubtab, loading, moduleLoading, restoreState, subtab]);

  const effectiveTotal = isModuleSubtab ? moduleTotal : pagination.total;
  const currentPageForState = isModuleSubtab ? 1 : pagination.page;
  const effectiveLoading = isModuleSubtab ? moduleLoading : loading;
  const effectiveError = isModuleSubtab ? moduleError : error;

  const buildListState = (): InstitutionListViewState => ({
    subtab,
    searchQuery,
    searchInput,
    viewMode,
    page: currentPageForState,
    scrollY: window.scrollY,
  });

  const filteredInstitutions = useMemo<InstitutionListItem[]>(() => {
    if (isModuleSubtab) return moduleInstitutions;
    if (!Array.isArray(institutions)) return [];
    return institutions;
  }, [isModuleSubtab, institutions, moduleInstitutions]);

  const jointBySubcategory = useMemo(() => {
    if (subtab !== "joint_universities") return null;
    if (jointModuleData) return jointModuleData;
    const grouped: Record<JointSubcategory, InstitutionListItem[]> = {
      示范性合作伙伴: [],
      境内高校: [],
      京外C9高校: [],
      综合强校: [],
      工科强校: [],
      特色高校: [],
    };
    if (Array.isArray(filteredInstitutions)) {
      filteredInstitutions.forEach((inst) => {
        const normalizedSub =
          inst.sub_classification === "京内高校"
            ? "境内高校"
            : inst.sub_classification;
        if (normalizedSub && normalizedSub in grouped) {
          grouped[normalizedSub as JointSubcategory].push(inst);
          return;
        }
        const legacyBucket =
          inst.classification === "共建高校" ? "特色高校" : undefined;
        if (legacyBucket) {
          grouped[legacyBucket].push(inst);
        }
      });
    }
    return grouped;
  }, [jointModuleData, subtab, filteredInstitutions]);

  const overseasBySubcategory = useMemo(() => {
    if (subtab !== "overseas_universities") return null;
    if (overseasModuleData) return overseasModuleData;
    const grouped: Record<OverseasSubcategory, InstitutionListItem[]> = {
      香港高校: [],
      亚太高校: [],
      欧美高校: [],
      其他地区高校: [],
    };
    if (Array.isArray(filteredInstitutions)) {
      filteredInstitutions.forEach((inst) => {
        if (inst.sub_classification && inst.sub_classification in grouped) {
          grouped[inst.sub_classification as OverseasSubcategory].push(inst);
          return;
        }
        grouped["其他地区高校"].push(inst);
      });
    }
    return grouped;
  }, [overseasModuleData, subtab, filteredInstitutions]);

  const alphaByLetter = useMemo(() => {
    if (viewMode !== "alpha") return null;
    const sorted = [...filteredInstitutions].sort((a, b) =>
      a.name.localeCompare(b.name, "zh"),
    );
    const grouped: Record<string, InstitutionListItem[]> = {};
    sorted.forEach((inst) => {
      const firstChar = inst.name.charAt(0).toUpperCase();
      if (!grouped[firstChar]) grouped[firstChar] = [];
      grouped[firstChar].push(inst);
    });
    return grouped;
  }, [viewMode, filteredInstitutions]);

  const handleOpenInstitution = (institution: InstitutionListItem) => {
    const listState = buildListState();
    navigate(`/institutions/${institution.id}`, {
      state: {
        from: location,
        restoreInstitutionListState: listState,
      },
    });
  };

  const handleImport = async (data: Array<Record<string, unknown>>) => {
    for (const row of data) {
      await createInstitution({
        id: String(row.id || ""),
        name: String(row.name || ""),
        type: "university",
        region: row.region ? String(row.region) : undefined,
        org_type: row.org_type ? String(row.org_type) : undefined,
        classification: row.classification
          ? String(row.classification)
          : undefined,
        category: row.category ? String(row.category) : undefined,
        priority: row.priority ? String(row.priority) : undefined,
      });
    }
    window.location.reload();
  };

  if (effectiveLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (effectiveError) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">加载失败</p>
          <p className="text-gray-500 text-sm">{effectiveError}</p>
        </div>
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">机构库</h2>
            <p className="text-sm text-gray-500 mt-1">
              共{" "}
              <span className="font-semibold text-gray-700">
                {effectiveTotal}
              </span>{" "}
              所机构
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setViewMode("priority")}
                title="优先级视图"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === "priority"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                优先级
              </button>
              <button
                onClick={() => setViewMode("alpha")}
                title="字母序视图"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === "alpha"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <SortAsc className="w-3.5 h-3.5" />
                字母序
              </button>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              添加机构
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors shadow-sm border border-gray-200"
            >
              <Upload className="w-4 h-4" />
              批量导入
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-2xl mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchQuery(searchInput.trim());
              }
            }}
            placeholder="搜索机构名称或英文名（按回车搜索）..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
              }}
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
              {effectiveTotal}
            </span>{" "}
            条结果
          </p>
        )}

        {/* Institution grid — grouped or flat */}
        {viewMode === "alpha" && alphaByLetter ? (
          <div className="space-y-8">
            {Object.keys(alphaByLetter)
              .sort((a, b) => a.localeCompare(b, "zh"))
              .map((letter) => {
                const items = alphaByLetter[letter];
                if (!items || items.length === 0) return null;
                return (
                  <div key={letter}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-50 text-primary-700 font-bold text-base border border-primary-100 shrink-0">
                        {letter}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400">
                        {items.length} 所
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                      {items.map((institution, index) => (
                        <InstitutionCard
                          key={institution.id}
                          institution={institution}
                          index={index}
                          onOpen={handleOpenInstitution}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : subtab === "joint_universities" && jointBySubcategory ? (
          <div className="space-y-8">
            {JOINT_SUBCATEGORY_ORDER.map((cat) => {
              const items = jointBySubcategory[cat];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {cat}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {items.map((institution, index) => (
                      <InstitutionCard
                        key={institution.id}
                        institution={institution}
                        index={index}
                        onOpen={handleOpenInstitution}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : subtab === "overseas_universities" && overseasBySubcategory ? (
          <div className="space-y-8">
            {OVERSEAS_SUBCATEGORY_ORDER.map((cat) => {
              const items = overseasBySubcategory[cat];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {cat}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {items.map((institution, index) => (
                      <InstitutionCard
                        key={institution.id}
                        institution={institution}
                        index={index}
                        onOpen={handleOpenInstitution}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : filteredInstitutions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredInstitutions.map((institution, index) => (
              <InstitutionCard
                key={institution.id}
                institution={institution}
                index={index}
                onOpen={handleOpenInstitution}
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
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery ? "尝试修改搜索关键词" : "该分类下暂无机构"}
            </p>
          </motion.div>
        )}

        {!isModuleSubtab && (
          <div className="mt-8">
            <Pagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total}
              onPageChange={loadPage}
              compact
            />
          </div>
        )}
      </motion.div>

      <InstitutionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        columns={EXCEL_COLUMNS}
        title="批量导入机构"
        templateFilename="机构导入模板.xlsx"
        cautionNotes={[
          "地区可选值：国内、国际",
          "机构类型可选值：高校、研究机构、行业学会",
          "分类可选值（仅高校）：共建高校、兄弟院校、海外高校、其他高校",
        ]}
      />
    </div>
  );
}
