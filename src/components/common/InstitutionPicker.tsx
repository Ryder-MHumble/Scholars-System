import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Building2, Search, X } from "lucide-react";
import { fetchInstitutionList } from "@/services/institutionApi";
import type { InstitutionListItem } from "@/types/institution";
import { cn } from "@/utils/cn";

export interface InstitutionPickResult {
  institution_id: string;
  institution_name: string;
  department_name?: string;
}

interface InstitutionPickerProps {
  onSelect: (result: InstitutionPickResult) => void;
  className?: string;
}

type OrgType = "国内" | "国际";
type CategoryType = "高校" | "企业" | "研究机构" | "其他";

export function InstitutionPicker({
  onSelect,
  className,
}: InstitutionPickerProps) {
  const [selectedOrg, setSelectedOrg] = useState<OrgType | null>("国内");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryType | null>("高校");
  const [institutions, setInstitutions] = useState<InstitutionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedInstitutions, setExpandedInstitutions] = useState<
    Set<string>
  >(new Set());

  // Load institutions when filters change
  useEffect(() => {
    if (!selectedOrg || !selectedCategory) return;

    const loadInstitutions = async () => {
      setLoading(true);
      try {
        const res = await fetchInstitutionList(1, 100);
        // Filter by org_name and category
        const filtered = res.items.filter((inst) => {
          const matchesOrg = inst.org_name === selectedOrg;
          // For now, we'll need to add category filtering when backend supports it
          return matchesOrg;
        });
        setInstitutions(filtered);
      } catch (error) {
        console.error("Failed to load institutions:", error);
        setInstitutions([]);
      } finally {
        setLoading(false);
      }
    };

    loadInstitutions();
  }, [selectedOrg, selectedCategory]);

  const toggleInstitution = (id: string) => {
    setExpandedInstitutions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectInstitution = (inst: InstitutionListItem) => {
    onSelect({
      institution_id: inst.id,
      institution_name: inst.name,
    });
  };

  const handleSelectDepartment = (
    inst: InstitutionListItem,
    deptName: string,
  ) => {
    onSelect({
      institution_id: inst.id,
      institution_name: inst.name,
      department_name: deptName,
    });
  };

  // Filter institutions by search query
  const filteredInstitutions = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className={cn("flex h-full", className)}>
      {/* Left Sidebar - Filters */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Org Type Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                学者-Scholar
              </h3>
            </div>

            {/* 国内/国际 */}
            <div className="space-y-1">
              {(["国内", "国际"] as OrgType[]).map((org) => (
                <div key={org}>
                  <button
                    onClick={() =>
                      setSelectedOrg(selectedOrg === org ? null : org)
                    }
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedOrg === org
                        ? "bg-white text-primary-600 font-medium shadow-sm"
                        : "text-gray-600 hover:bg-white/50",
                    )}
                  >
                    {selectedOrg === org ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    {org}
                  </button>

                  {/* Categories under selected org */}
                  {selectedOrg === org && (
                    <div className="ml-6 mt-1 space-y-1">
                      {(
                        ["高校", "企业", "研究机构", "其他"] as CategoryType[]
                      ).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                            selectedCategory === cat
                              ? "bg-primary-100 text-primary-700 font-medium"
                              : "text-gray-600 hover:bg-white/50",
                          )}
                        >
                          • {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Institution List */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索机构名称..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Institution List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">加载中...</div>
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-400">暂无数据</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInstitutions.map((inst) => (
                <div
                  key={inst.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-primary-300 transition-colors"
                >
                  {/* Institution Header */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50">
                    <button
                      onClick={() => toggleInstitution(inst.id)}
                      className="text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      {expandedInstitutions.has(inst.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSelectInstitution(inst)}
                      className="flex-1 text-left hover:text-primary-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {inst.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {inst.scholar_count} 位学者
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Departments */}
                  {expandedInstitutions.has(inst.id) &&
                    inst.departments.length > 0 && (
                      <div className="bg-white">
                        {inst.departments.map((dept, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              handleSelectDepartment(inst, dept.name)
                            }
                            className="w-full flex items-center justify-between px-10 py-2 hover:bg-primary-50 transition-colors text-left border-t border-gray-100"
                          >
                            <span className="text-sm text-gray-700">
                              {dept.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {dept.scholar_count} 位学者
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
