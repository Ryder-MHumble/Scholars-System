import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Search,
  Users,
  FileText,
  LayoutGrid,
  List,
  Building2,
  Download,
} from "lucide-react";
import PageTransition from "@/layouts/PageTransition";
import { universities } from "@/data/universities";
import { scholars } from "@/data/scholars";
import { papers } from "@/data/papers";
import { cn } from "@/utils/cn";
import { getAvatarColor, getInitial } from "@/utils/avatar";

function TreeNode({
  university,
  selectedUniId,
  selectedDeptId,
  onSelect,
}: {
  university: (typeof universities)[0];
  selectedUniId?: string;
  selectedDeptId?: string;
  onSelect: (uniId: string, deptId?: string) => void;
}) {
  const [expanded, setExpanded] = useState(selectedUniId === university.id);
  const scholarCount = scholars.filter(
    (s) => s.universityId === university.id,
  ).length;

  return (
    <div>
      <button
        onClick={() => {
          setExpanded(!expanded);
          onSelect(university.id);
        }}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
          selectedUniId === university.id && !selectedDeptId
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
        <span className="truncate flex-1 text-left">
          {university.shortName}
        </span>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {scholarCount}
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
              {university.departments.map((dept) => {
                const deptCount = scholars.filter(
                  (s) => s.departmentId === dept.id,
                ).length;
                return (
                  <button
                    key={dept.id}
                    onClick={() => onSelect(university.id, dept.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                      selectedDeptId === dept.id
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <span className="truncate flex-1 text-left">
                      {dept.name}
                    </span>
                    {deptCount > 0 && (
                      <span className="text-gray-400 shrink-0">
                        {deptCount}
                      </span>
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
  const params = useParams();
  const [selectedUniId, setSelectedUniId] = useState<string | undefined>(
    params.universityId,
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string | undefined>(
    params.departmentId,
  );
  const [treeSearch, setTreeSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleSelect = (uniId: string, deptId?: string) => {
    setSelectedUniId(uniId);
    setSelectedDeptId(deptId);
  };

  const handleExport = () => {
    const selectedUni = universities.find((u) => u.id === selectedUniId);
    const headers = ["姓名", "英文名", "所属院校", "院系", "职称", "研究方向", "学术荣誉", "H-Index", "论文数", "引用数", "邮箱", "个人主页"];
    const rows = filteredScholars.map((s) => {
      const uni = universities.find((u) => u.id === s.universityId);
      const dept = uni?.departments.find((d) => d.id === s.departmentId);
      return [
        s.name,
        s.nameEn ?? "",
        uni?.name ?? "",
        dept?.name ?? "",
        s.title,
        s.researchFields.join("；"),
        s.honors.join("；"),
        s.hIndex ?? "",
        s.paperCount ?? "",
        s.citationCount ?? "",
        s.email ?? "",
        s.homepage ?? "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = selectedDeptId
      ? `${selectedUni?.shortName ?? "院校"}_${universities.find((u) => u.id === selectedUniId)?.departments.find((d) => d.id === selectedDeptId)?.name ?? "院系"}_学者名单.csv`
      : selectedUniId
      ? `${selectedUni?.shortName ?? "院校"}_学者名单.csv`
      : "全部学者名单.csv";
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUniversities = useMemo(() => {
    if (!treeSearch.trim()) return universities;
    const q = treeSearch.toLowerCase();
    return universities.filter(
      (u) =>
        u.name.includes(q) ||
        u.shortName.includes(q) ||
        u.departments.some((d) => d.name.includes(q)),
    );
  }, [treeSearch]);

  const filteredScholars = useMemo(() => {
    let result = scholars;
    if (selectedUniId)
      result = result.filter((s) => s.universityId === selectedUniId);
    if (selectedDeptId)
      result = result.filter((s) => s.departmentId === selectedDeptId);
    return result;
  }, [selectedUniId, selectedDeptId]);

  const selectedUni = universities.find((u) => u.id === selectedUniId);
  const selectedDept = selectedUni?.departments.find(
    (d) => d.id === selectedDeptId,
  );

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
                setSelectedUniId(undefined);
                setSelectedDeptId(undefined);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                !selectedUniId
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <Users className="w-4 h-4 text-gray-400" />
              <span>全部院校</span>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {scholars.length}
              </span>
            </button>
            {filteredUniversities.map((u) => (
              <TreeNode
                key={u.id}
                university={u}
                selectedUniId={selectedUniId}
                selectedDeptId={selectedDeptId}
                onSelect={handleSelect}
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
              {selectedUni && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 mx-1" />
                  <span
                    className={
                      selectedDept
                        ? "text-gray-500"
                        : "text-gray-900 font-medium"
                    }
                  >
                    {selectedUni.shortName}
                  </span>
                </>
              )}
              {selectedDept && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 mx-1" />
                  <span className="text-gray-900 font-medium">
                    {selectedDept.name}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {filteredScholars.length} 位学者
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
            {filteredScholars.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">暂无学者数据</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredScholars.map((s, i) => {
                  const uni = universities.find((u) => u.id === s.universityId);
                  const dept = uni?.departments.find(
                    (d) => d.id === s.departmentId,
                  );
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                    >
                      <Link
                        to={`/scholars/${s.id}`}
                        className="block bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-primary-200 hover:scale-[1.02] transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                            style={{ backgroundColor: getAvatarColor(s.name) }}
                          >
                            {getInitial(s.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">
                              {s.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {uni?.shortName} · {dept?.name}
                            </div>
                          </div>
                          <span className="ml-auto text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                            {s.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {s.researchFields.slice(0, 3).map((f) => (
                            <span
                              key={f}
                              className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full"
                            >
                              {f}
                            </span>
                          ))}
                          {s.researchFields.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{s.researchFields.length - 3}
                            </span>
                          )}
                        </div>
                        {s.honors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {s.honors.slice(0, 2).map((h) => (
                              <span
                                key={h}
                                className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full"
                              >
                                {h.length > 8 ? h.slice(0, 6) + "..." : h}
                              </span>
                            ))}
                          </div>
                        )}
                        {(s.hIndex || s.paperCount) && (
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                            {s.hIndex && (
                              <span>
                                h-index:{" "}
                                <span className="text-gray-600 font-medium">
                                  {s.hIndex}
                                </span>
                              </span>
                            )}
                            {s.paperCount && (
                              <span>
                                <FileText className="w-3 h-3 inline mr-0.5" />
                                {s.paperCount}篇
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500">
                      <th className="text-left py-3 px-4 font-medium">姓名</th>
                      <th className="text-left py-3 px-4 font-medium">院校</th>
                      <th className="text-left py-3 px-4 font-medium">职称</th>
                      <th className="text-left py-3 px-4 font-medium">
                        研究方向
                      </th>
                      <th className="text-right py-3 px-4 font-medium">
                        h-index
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScholars.map((s, i) => {
                      const uni = universities.find(
                        (u) => u.id === s.universityId,
                      );
                      const dept = uni?.departments.find(
                        (d) => d.id === s.departmentId,
                      );
                      return (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <Link
                              to={`/scholars/${s.id}`}
                              className="flex items-center gap-2 group"
                            >
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                                style={{
                                  backgroundColor: getAvatarColor(s.name),
                                }}
                              >
                                {getInitial(s.name)}
                              </div>
                              <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                                {s.name}
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500">
                            {uni?.shortName} · {dept?.name}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500">
                            {s.title}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1 flex-wrap">
                              {s.researchFields.slice(0, 2).map((f) => (
                                <span
                                  key={f}
                                  className="text-xs bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600 text-right font-medium">
                            {s.hIndex ?? "-"}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Department Info */}
        {selectedUni && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm p-5 overflow-auto custom-scrollbar hidden xl:block"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {selectedDept ? selectedDept.name : selectedUni.name}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {selectedDept ? selectedUni.name : selectedUni.location}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-primary-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-primary-700">
                  {filteredScholars.length}
                </div>
                <div className="text-xs text-primary-600">学者数</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-700">
                  {
                    papers.filter((p) =>
                      filteredScholars.some((s) => s.id === p.scholarId),
                    ).length
                  }
                </div>
                <div className="text-xs text-emerald-600">论文数</div>
              </div>
            </div>

            {!selectedDept && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  下属院系
                </h4>
                <div className="space-y-1">
                  {selectedUni.departments.slice(0, 8).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDeptId(d.id)}
                      className="w-full text-left text-xs text-gray-600 hover:text-primary-600 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      {d.name}
                    </button>
                  ))}
                  {selectedUni.departments.length > 8 && (
                    <p className="text-xs text-gray-400 px-2">
                      等 {selectedUni.departments.length} 个院系
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedDept && filteredScholars.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  代表学者
                </h4>
                <div className="space-y-2">
                  {filteredScholars.slice(0, 5).map((s) => (
                    <Link
                      key={s.id}
                      to={`/scholars/${s.id}`}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium"
                        style={{ backgroundColor: getAvatarColor(s.name) }}
                      >
                        {getInitial(s.name)}
                      </div>
                      <span>{s.name}</span>
                      <span className="text-gray-400 ml-auto">{s.title}</span>
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
