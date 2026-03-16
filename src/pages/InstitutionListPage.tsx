import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import { createInstitution } from "@/services/institutionApi";
import type { ExcelColumn } from "@/types/import";
import {
  getInstitutionBusinessGroup,
  getJointSubcategory,
  getOverseasSubcategory,
  JOINT_SUBCATEGORY_ORDER,
  OVERSEAS_SUBCATEGORY_ORDER,
  type JointSubcategory,
  type OverseasSubcategory,
} from "@/utils/institutionClassifier";
import type { InstitutionListItem } from "@/types/institution";

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
  const [searchParams] = useSearchParams();
  const subtab = searchParams.get("subtab");

  const apiFilters = useMemo(() => mapSubtabToFilters(subtab), [subtab]);
  const { institutions, loading, error } = useInstitutions(200, apiFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"priority" | "alpha">("priority");

  const filteredInstitutions = useMemo(() => {
    if (!Array.isArray(institutions)) return [];
    let result = institutions;

    if (subtab) {
      // research_institutes and industry_associations are already filtered by API (org_type),
      // so we skip the ID-based client filter for them. University subtabs still need it
      // for sub-classification grouping.
      const universitySubtabs = new Set([
        "joint_universities",
        "sister_universities",
        "overseas_universities",
        "other_universities",
      ]);
      if (universitySubtabs.has(subtab)) {
        const targetGroup = subtab;
        result = result.filter(
          (inst) => getInstitutionBusinessGroup(inst.id) === targetGroup,
        );
      }
    }

    if (searchQuery) {
      result = result.filter(
        (inst) =>
          inst.name.includes(searchQuery) ||
          inst.org_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return result;
  }, [institutions, subtab, searchQuery]);

  const jointBySubcategory = useMemo(() => {
    if (subtab !== "joint_universities") return null;
    const grouped: Record<JointSubcategory, InstitutionListItem[]> = {
      示范性合作伙伴: [],
      京内高校: [],
      京外C9高校: [],
      综合强校: [],
      工科强校: [],
      特色高校: [],
    };
    if (Array.isArray(filteredInstitutions)) {
      filteredInstitutions.forEach((inst) => {
        const cat = getJointSubcategory(inst.id);
        if (cat) grouped[cat].push(inst);
      });
    }
    return grouped;
  }, [subtab, filteredInstitutions]);

  const overseasBySubcategory = useMemo(() => {
    if (subtab !== "overseas_universities") return null;
    const grouped: Record<OverseasSubcategory, InstitutionListItem[]> = {
      香港高校: [],
      亚太高校: [],
      欧美高校: [],
      其他地区高校: [],
    };
    if (Array.isArray(filteredInstitutions)) {
      filteredInstitutions.forEach((inst) => {
        const cat = getOverseasSubcategory(inst.id);
        grouped[cat].push(inst);
      });
    }
    return grouped;
  }, [subtab, filteredInstitutions]);

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">加载失败</p>
          <p className="text-gray-500 text-sm">{error}</p>
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
                {filteredInstitutions.length}
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
                setSearchQuery(searchInput);
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
              {filteredInstitutions.length}
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
