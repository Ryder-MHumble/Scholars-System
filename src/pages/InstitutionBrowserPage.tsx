import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Search,
  Users,
  LayoutGrid,
  List,
  Building2,
  Download,
} from "lucide-react";
import PageTransition from "@/layouts/PageTransition";
import { fetchFacultyList, type FacultyListItem } from "@/services/facultyApi";
import { universities as staticUniversities } from "@/data/universities";
import { cn } from "@/utils/cn";
import { getAvatarColor, getInitial } from "@/utils/avatar";

interface UniNode {
  name: string;
  departments: string[];
}

function TreeNode({
  uni,
  selectedUniName,
  selectedDeptName,
  onSelect,
  counts,
}: {
  uni: UniNode;
  selectedUniName?: string;
  selectedDeptName?: string;
  onSelect: (uniName: string, deptName?: string) => void;
  counts: Record<string, number>;
}) {
  const [expanded, setExpanded] = useState(selectedUniName === uni.name);

  return (
    <div>
      <button
        onClick={() => {
          setExpanded(!expanded);
          onSelect(uni.name);
        }}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
          selectedUniName === uni.name && !selectedDeptName
            ? "bg-primary-50 text-primary-700 font-medium"
            : "text-gray-700 hover:bg-gray-50",
        )}
      >
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </motion.div>
        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="truncate flex-1 text-left">{uni.name}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {counts[uni.name] ?? 0}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-5 pl-3 border-l border-gray-100 space-y-0.5 py-1">
              {uni.departments.map((dept) => {
                const deptCount = counts[`${uni.name}::${dept}`] ?? 0;
                return (
                  <button
                    key={dept}
                    onClick={() => onSelect(uni.name, dept)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                      selectedDeptName === dept && selectedUniName === uni.name
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <span className="truncate flex-1 text-left">{dept}</span>
                    {deptCount > 0 && (
                      <span className="text-gray-400 shrink-0">{deptCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InstitutionBrowserPage() {
  const [selectedUniName, setSelectedUniName] = useState<string | undefined>();
  const [selectedDeptName, setSelectedDeptName] = useState<string | undefined>();
  const [treeSearch, setTreeSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /* Dynamic counts from API */
  const [counts, setCounts] = useState<Record<string, number>>({});

  /* Filtered items for main panel */
  const [filteredItems, setFilteredItems] = useState<FacultyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* Load API data to get counts for sidebar tree */
  useEffect(() => {
    const loadCountsFromAPI = async () => {
      try {
        let allItems: FacultyListItem[] = [];
        let page = 1;
        let totalPages = 1;

        // Fetch all pages to calculate counts
        while (page <= totalPages) {
          const res = await fetchFacultyList(page, 200);
          allItems = allItems.concat(res.items);
          totalPages = res.total_pages;
          page++;
        }

        // Build counts map
        const countsMap: Record<string, number> = {};
        for (const item of allItems) {
          if (item.university) {
            countsMap[item.university] = (countsMap[item.university] ?? 0) + 1;
          }
          if (item.university && item.department) {
            const key = `${item.university}::${item.department}`;
            countsMap[key] = (countsMap[key] ?? 0) + 1;
          }
        }

        setCounts(countsMap);
      } catch {
        // Fallback: set empty counts, user can still see tree
      }
    };
    loadCountsFromAPI();
  }, []);

  /* Load filtered items */
  useEffect(() => {
    setIsLoading(true);
    fetchFacultyList(1, 100, {
      university: selectedUniName,
      department: selectedDeptName,
    })
      .then((res) => {
        setFilteredItems(res.items);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [selectedUniName, selectedDeptName]);

  const handleSelect = (uniName: string, deptName?: string) => {
    setSelectedUniName(uniName);
    setSelectedDeptName(deptName);
  };

  /* Use static universities for tree structure */
  const uniNodes = useMemo<UniNode[]>(() => {
    return staticUniversities.map((uni) => ({
      name: uni.name,
      departments: uni.departments.map((d) => d.name),
    }));
  }, []);


  const filteredUniNodes = useMemo(() => {
    if (!treeSearch.trim()) return uniNodes;
    const q = treeSearch.toLowerCase();
    return uniNodes.filter(
      (u) =>
        u.name.includes(q) || u.departments.some((d) => d.includes(q)),
    );
  }, [treeSearch, uniNodes]);

  const handleExport = () => {
    const headers = ["姓名", "英文名", "所属院校", "院系", "职称", "研究方向", "院士称号", "邮箱", "个人主页"];
    const rows = filteredItems.map((s) => [
      s.name,
      s.name_en ?? "",
      s.university ?? "",
      s.department ?? "",
      s.position ?? "",
      s.research_areas.join("；"),
      s.academic_titles.join("；"),
      s.email ?? "",
      s.profile_url ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = selectedDeptName
      ? `${selectedUniName}_${selectedDeptName}_师资名单.csv`
      : selectedUniName
      ? `${selectedUniName}_师资名单.csv`
      : "全部师资名单.csv";
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageTransition>
      <div className="flex gap-6 h-[calc(100vh-7.5rem)]">
        {/* Left Panel - Tree */}
        <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                placeholder="搜索院校..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-100"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-0.5 custom-scrollbar">
            <button
              onClick={() => {
                setSelectedUniName(undefined);
                setSelectedDeptName(undefined);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                !selectedUniName
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <Users className="w-4 h-4 text-gray-400" />
              <span>全部院校</span>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {Object.values(counts).reduce((a, b) => a + b, 0) || 0}
              </span>
            </button>
            {filteredUniNodes.map((u) => (
              <TreeNode
                key={u.name}
                uni={u}
                selectedUniName={selectedUniName}
                selectedDeptName={selectedDeptName}
                onSelect={handleSelect}
                counts={counts}
              />
            ))}
          </div>
        </div>

        {/* Center Panel - Scholar List */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Breadcrumb + Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <span>院校浏览</span>
              {selectedUniName && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 mx-1" />
                  <span
                    className={
                      selectedDeptName ? "text-gray-500" : "text-gray-900 font-medium"
                    }
                  >
                    {selectedUniName}
                  </span>
                </>
              )}
              {selectedDeptName && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 mx-1" />
                  <span className="text-gray-900 font-medium">{selectedDeptName}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {isLoading ? "加载中..." : `${filteredItems.length} 位学者`}
              </span>
              <motion.button
                onClick={handleExport}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                导出数据
              </motion.button>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5",
                    viewMode === "grid"
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-400 hover:bg-gray-50",
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5",
                    viewMode === "list"
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-400 hover:bg-gray-50",
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Scholar Grid/List */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">暂无师资数据</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map((s, i) => (
                  <motion.div
                    key={s.url_hash}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <Link
                      to={`/scholars/${s.url_hash}`}
                      className="block bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-primary-200 hover:scale-[1.02] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {s.photo_url ? (
                          <img
                            src={s.photo_url}
                            alt={s.name}
                            className="w-11 h-11 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                            style={{ backgroundColor: getAvatarColor(s.name) }}
                          >
                            {getInitial(s.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {s.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {s.university}
                            {s.department && ` · ${s.department}`}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">
                          {s.position || "—"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {s.research_areas.slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full"
                          >
                            {f}
                          </span>
                        ))}
                        {s.research_areas.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{s.research_areas.length - 3}
                          </span>
                        )}
                      </div>
                      {s.academic_titles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {s.academic_titles.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full"
                            >
                              {t.length > 8 ? t.slice(0, 6) + "..." : t}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500">
                      <th className="text-left py-3 px-4 font-medium">姓名</th>
                      <th className="text-left py-3 px-4 font-medium">院校</th>
                      <th className="text-left py-3 px-4 font-medium">职称</th>
                      <th className="text-left py-3 px-4 font-medium">研究方向</th>
                      <th className="text-left py-3 px-4 font-medium">称号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((s, i) => (
                      <motion.tr
                        key={s.url_hash}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            to={`/scholars/${s.url_hash}`}
                            className="flex items-center gap-2 group"
                          >
                            {s.photo_url ? (
                              <img
                                src={s.photo_url}
                                alt={s.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                                style={{ backgroundColor: getAvatarColor(s.name) }}
                              >
                                {getInitial(s.name)}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                              {s.name}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {s.university}
                          {s.department && ` · ${s.department}`}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {s.position || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {s.research_areas.slice(0, 2).map((f) => (
                              <span
                                key={f}
                                className="text-xs bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {s.academic_titles.slice(0, 1).map((t) => (
                              <span
                                key={t}
                                className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded"
                              >
                                {t.length > 8 ? t.slice(0, 6) + "..." : t}
                              </span>
                            ))}
                            {s.academic_titles.length === 0 && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Info */}
        {selectedUniName && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm p-5 overflow-auto custom-scrollbar hidden xl:block"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {selectedDeptName ?? selectedUniName}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {selectedDeptName ? selectedUniName : ""}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-primary-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-primary-700">
                  {filteredItems.length}
                </div>
                <div className="text-xs text-primary-600">学者数</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-700">
                  {filteredItems.filter((s) => s.is_academician || s.academic_titles.some((t) => t.includes("院士"))).length}
                </div>
                <div className="text-xs text-emerald-600">院士数</div>
              </div>
            </div>

            {!selectedDeptName && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">下属院系</h4>
                <div className="space-y-1">
                  {(uniNodes.find((u) => u.name === selectedUniName)?.departments ?? [])
                    .slice(0, 8)
                    .map((d) => (
                      <button
                        key={d}
                        onClick={() => handleSelect(selectedUniName, d)}
                        className="w-full text-left text-xs text-gray-600 hover:text-primary-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        {d}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {selectedDeptName && filteredItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">代表学者</h4>
                <div className="space-y-2">
                  {filteredItems.slice(0, 5).map((s) => (
                    <Link
                      key={s.url_hash}
                      to={`/scholars/${s.url_hash}`}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      {s.photo_url ? (
                        <img
                          src={s.photo_url}
                          alt={s.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
                          style={{ backgroundColor: getAvatarColor(s.name) }}
                        >
                          {getInitial(s.name)}
                        </div>
                      )}
                      <span>{s.name}</span>
                      <span className="text-gray-400 ml-auto">{s.position || "—"}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
