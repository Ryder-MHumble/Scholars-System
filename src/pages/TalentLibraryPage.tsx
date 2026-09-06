import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  buildTalentLibraryRecords,
  maskTalentName,
  recordMatchesTag,
  type TalentLibraryRecord,
  type TalentScope,
} from "@/utils/talentLibrary";
import {
  deleteScholar,
  fetchAllScholars,
  invalidateScholarListCache,
  type ScholarListItem,
} from "@/services/scholarApi";
import {
  fetchStudentListAll,
  type StudentRecord,
} from "@/services/studentApi";
import { exportScholarsToExcel } from "@/utils/scholarExporter";
import { exportStudentsToExcel } from "@/utils/studentExcel";
import { BatchScholarImportModal } from "@/components/scholar/BatchScholarImportModal";
import { BatchStudentImportModal } from "@/components/student/BatchStudentImportModal";
import { Pagination } from "@/components/common/Pagination";
import { PortraitAssessmentModal } from "@/components/talent/PortraitAssessmentModal";
import { PortraitRadarChart } from "@/components/talent/PortraitRadarChart";
import {
  fetchLatestPortrait,
  fetchPortraitAssessment,
  PortraitApiError,
  startPortraitAssessment,
  type PortraitAssessment,
  type PortraitTraitsPayload,
} from "@/services/portraitApi";

const PAGE_SIZE = 20;
const SCOPES: Array<"全部" | TalentScope> = ["全部", "国内", "国际"];
type FilterGroup = "全部标签" | TalentScope | "研究方向" | "当前机构" | "职称";
type PortraitCacheEntry =
  | { status: "loading" }
  | { status: "ready"; assessment: PortraitAssessment }
  | { status: "missing" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

function safe(value: unknown): string {
  return String(value ?? "").trim() || "—";
}

function displayTags(record: TalentLibraryRecord): string[] {
  return record.tags.slice(0, 3);
}

function isScholar(record: TalentLibraryRecord): record is TalentLibraryRecord & { source: "scholar"; sourceRecord: ScholarListItem } {
  return record.source === "scholar";
}

function portraitRecordId(record: TalentLibraryRecord): string {
  return isScholar(record) ? record.sourceRecord.url_hash : (record.sourceRecord as StudentRecord).id;
}

function portraitRequestError(error: unknown): string {
  return error instanceof Error ? error.message : "画像识别结果获取失败";
}

export default function TalentLibraryPage() {
  const location = useLocation();
  const [scholars, setScholars] = useState<ScholarListItem[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"全部" | TalentScope>("全部");
  const [selectedTag, setSelectedTag] = useState("全部标签");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fullInfo, setFullInfo] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>("全部标签");
  const [filterSearch, setFilterSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"chooser" | "scholars" | "students" | null>(null);
  const [portraitRecord, setPortraitRecord] = useState<TalentLibraryRecord | null>(null);
  const [portraitAssessment, setPortraitAssessment] = useState<PortraitAssessment | null>(null);
  const [portraitStarting, setPortraitStarting] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [portraitCache, setPortraitCache] = useState<Record<string, PortraitCacheEntry>>({});
  const [portraitLoadingLatest, setPortraitLoadingLatest] = useState(false);
  const portraitCacheRef = useRef(portraitCache);
  const portraitPrefetchRef = useRef(new Map<string, symbol>());
  portraitCacheRef.current = portraitCache;

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null;
        setIsLoading(true);
        setError(null);
        return Promise.all([
          fetchAllScholars(undefined, { signal: controller.signal }),
          fetchStudentListAll({ page_size: 200 }, controller.signal),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [nextScholars, nextStudents] = result;
        if (controller.signal.aborted) return;
        setScholars(nextScholars);
        setStudents(nextStudents);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "人才数据加载失败");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadSeed]);

  const records = useMemo(() => buildTalentLibraryRecords(scholars, students), [scholars, students]);
  const institutions = useMemo(() => Array.from(new Set(records.map((record) => record.institution).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [records]);
  const directions = useMemo(() => Array.from(new Set(records.flatMap((record) => record.directions))).sort((a, b) => a.localeCompare(b)), [records]);
  const titles = useMemo(() => Array.from(new Set(records.map((record) => record.title))).sort((a, b) => a.localeCompare(b)), [records]);
  const allTags = useMemo(() => Array.from(new Set(records.flatMap((record) => record.tags))).sort((a, b) => a.localeCompare(b)), [records]);

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return records.filter((record) => {
      if (scope !== "全部" && record.scope !== scope) return false;
      if (keyword && !record.searchableText.includes(keyword)) return false;
      if (!recordMatchesTag(record, selectedTag)) return false;
      if (selectedInstitution && record.institution !== selectedInstitution) return false;
      if (selectedDirection && !record.directions.includes(selectedDirection)) return false;
      if (selectedTitle && record.title !== selectedTitle) return false;
      return true;
    });
  }, [query, records, scope, selectedDirection, selectedInstitution, selectedTag, selectedTitle]);

  useEffect(() => {
    const reset = window.setTimeout(() => {
      setPage(1);
      setSelectedIds(new Set());
    }, 0);
    return () => window.clearTimeout(reset);
  }, [query, scope, selectedDirection, selectedInstitution, selectedTag, selectedTitle]);

  const totalPages = Math.max(Math.ceil(filteredRecords.length / PAGE_SIZE), 1);
  const visibleRecords = useMemo(
    () => filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRecords, page],
  );
  const visibleSelectedCount = visibleRecords.filter((record) => selectedIds.has(record.id)).length;
  const allVisibleSelected = visibleRecords.length > 0 && visibleSelectedCount === visibleRecords.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  useEffect(() => {
    const controller = new AbortController();
    const requestToken = Symbol("portrait-prefetch");
    const prefetches = portraitPrefetchRef.current;
    const cache = portraitCacheRef.current;
    const unsupported = visibleRecords.filter((record) => isScholar(record) && record.scope === "院内");
    const unsupportedToMark = unsupported.filter((record) => cache[record.id]?.status !== "unsupported");
    if (unsupportedToMark.length) {
      setPortraitCache((current) => {
        const next = { ...current };
        unsupportedToMark.forEach((record) => { next[record.id] = { status: "unsupported" }; });
        return next;
      });
    }
    const pending = visibleRecords.filter((record) => {
      if (unsupported.includes(record)) return false;
      const entry = cache[record.id];
      return !entry || (entry.status === "loading" && !prefetches.has(record.id));
    });
    if (!pending.length) return () => controller.abort();

    pending.forEach((record) => prefetches.set(record.id, requestToken));

    setPortraitCache((current) => {
      const next = { ...current };
      pending.forEach((record) => { next[record.id] = { status: "loading" }; });
      return next;
    });

    void Promise.all(pending.map(async (record) => {
      try {
        const assessment = await fetchLatestPortrait(record.source, portraitRecordId(record), controller.signal);
        return [record.id, { status: "ready", assessment } satisfies PortraitCacheEntry] as const;
      } catch (error) {
        if (controller.signal.aborted) return null;
        if (error instanceof PortraitApiError && error.status === 404) {
          return [record.id, { status: "missing" } satisfies PortraitCacheEntry] as const;
        }
        return [record.id, { status: "error", message: portraitRequestError(error) } satisfies PortraitCacheEntry] as const;
      }
    })).then((results) => {
      if (controller.signal.aborted) return;
      setPortraitCache((current) => {
        const next = { ...current };
        results.forEach((result) => {
          if (!result || prefetches.get(result[0]) !== requestToken) return;
          prefetches.delete(result[0]);
          next[result[0]] = result[1];
        });
        return next;
      });
    });

    return () => {
      controller.abort();
      const retryableIds = pending
        .map((record) => record.id)
        .filter((recordId) => prefetches.get(recordId) === requestToken);
      retryableIds.forEach((recordId) => prefetches.delete(recordId));
      if (!retryableIds.length) return;
      setPortraitCache((current) => {
        const next = { ...current };
        let changed = false;
        retryableIds.forEach((recordId) => {
          if (next[recordId]?.status !== "loading") return;
          delete next[recordId];
          changed = true;
        });
        return changed ? next : current;
      });
    };
  }, [visibleRecords]);

  const filterOptions = useMemo(() => {
    const options = filterGroup === "全部标签"
      ? allTags
      : filterGroup === "院内" || filterGroup === "国内" || filterGroup === "国际"
        ? allTags.filter((tag) => records.some((record) => record.scope === filterGroup && record.tags.includes(tag)))
        : filterGroup === "研究方向" ? directions
          : filterGroup === "当前机构" ? institutions
            : titles;
    const keyword = filterSearch.trim().toLowerCase();
    return options.filter((option) => !keyword || option.toLowerCase().includes(keyword));
  }, [allTags, directions, filterGroup, filterSearch, institutions, records, titles]);

  const activeFilterCount = [scope !== "全部", selectedTag !== "全部标签", Boolean(selectedInstitution), Boolean(selectedDirection), Boolean(selectedTitle)].filter(Boolean).length;

  const setFilterValue = (value: string) => {
    if (filterGroup === "全部标签" || filterGroup === "院内" || filterGroup === "国内" || filterGroup === "国际") {
      setSelectedTag(value);
      if (filterGroup !== "全部标签") setScope(filterGroup);
    } else if (filterGroup === "研究方向") setSelectedDirection((current) => current === value ? "" : value);
    else if (filterGroup === "当前机构") setSelectedInstitution((current) => current === value ? "" : value);
    else setSelectedTitle((current) => current === value ? "" : value);
  };

  const clearFilters = () => {
    setScope("全部");
    setSelectedTag("全部标签");
    setSelectedInstitution("");
    setSelectedDirection("");
    setSelectedTitle("");
    setFilterSearch("");
  };

  const toggleVisibleSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleRecords.forEach((record) => next.delete(record.id));
      else visibleRecords.forEach((record) => next.add(record.id));
      return next;
    });
  };

  const exportSelected = () => {
    const exportRecords = selectedIds.size > 0 ? filteredRecords.filter((record) => selectedIds.has(record.id)) : filteredRecords;
    const scholarRows = exportRecords.filter(isScholar).map((record) => record.sourceRecord);
    const studentRows = exportRecords.filter((record) => !isScholar(record)).map((record) => record.sourceRecord as StudentRecord);
    if (scholarRows.length) exportScholarsToExcel(scholarRows, "人才库_学者.xlsx");
    if (studentRows.length) exportStudentsToExcel(studentRows, "人才库_学生.xlsx");
  };

  const handleDelete = async (record: TalentLibraryRecord) => {
    if (!window.confirm(`确定要删除 ${record.name} 吗？此操作不可撤销。`)) return;
    if (!isScholar(record)) return;
    try {
      await deleteScholar(record.sourceRecord.url_hash);
      invalidateScholarListCache();
      setReloadSeed((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  const buildPortraitTraits = (record: TalentLibraryRecord): PortraitTraitsPayload => ({
    entity_type: isScholar(record) ? "expert" : "student",
    affiliation_scope: isScholar(record) ? "external" : record.scope === "院内" ? "internal" : "external",
    student_stage: isScholar(record) ? null : "potential",
    relationship_traits: [],
    human_judgments: [],
    confirmed_by: "scholars-system",
    confirmed_at: new Date().toISOString(),
  });

  const startPortrait = async (record: TalentLibraryRecord) => {
    if (isScholar(record) && record.scope === "院内") return;
    const recordId = portraitRecordId(record);
    portraitPrefetchRef.current.delete(record.id);
    setMenuId(null);
    setPortraitRecord(record);
    setPortraitAssessment(null);
    setPortraitError(null);
    setPortraitStarting(true);
    setPortraitCache((current) => ({ ...current, [record.id]: { status: "loading" } }));
    try {
      const result = await startPortraitAssessment(record.source, recordId, buildPortraitTraits(record));
      setPortraitAssessment({
        id: result.id,
        source_record_type: record.source,
        source_record_id: recordId,
        portrait_type: isScholar(record) ? "external_expert" : "potential_student",
        status: result.status,
        core_conclusion: null,
        weighted_score: null,
        evidence_coverage: null,
        recommendation_level: null,
        error_code: null,
        error_message: null,
        dimensions: [],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "识别任务提交失败";
      setPortraitError(message);
      setPortraitCache((current) => ({ ...current, [record.id]: { status: "error", message } }));
    } finally {
      setPortraitStarting(false);
    }
  };

  const openPortrait = async (record: TalentLibraryRecord) => {
    setMenuId(null);
    setPortraitRecord(record);
    setPortraitError(null);
    const cached = portraitCache[record.id];
    if (cached?.status === "ready") {
      setPortraitAssessment(cached.assessment);
      setPortraitLoadingLatest(false);
      return;
    }
    if (cached?.status === "missing") {
      setPortraitAssessment(null);
      setPortraitLoadingLatest(false);
      return;
    }
    if (cached?.status === "unsupported") {
      setPortraitAssessment(null);
      setPortraitLoadingLatest(false);
      return;
    }
    if (cached?.status === "error") {
      setPortraitAssessment(null);
      setPortraitLoadingLatest(false);
      setPortraitError(cached.message);
      return;
    }
    setPortraitAssessment(null);
    setPortraitLoadingLatest(true);
    try {
      const assessment = await fetchLatestPortrait(record.source, portraitRecordId(record));
      setPortraitCache((current) => ({ ...current, [record.id]: { status: "ready", assessment } }));
      setPortraitAssessment(assessment);
    } catch (error) {
      if (error instanceof PortraitApiError && error.status === 404) {
        setPortraitCache((current) => ({ ...current, [record.id]: { status: "missing" } }));
      } else {
        const message = portraitRequestError(error);
        setPortraitCache((current) => ({ ...current, [record.id]: { status: "error", message } }));
        setPortraitError(message);
      }
    } finally {
      setPortraitLoadingLatest(false);
    }
  };

  useEffect(() => {
    const assessmentId = portraitAssessment?.id;
    if (!assessmentId || ["completed", "insufficient", "needs_review", "failed"].includes(portraitAssessment.status)) return;
    let cancelled = false;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const next = await fetchPortraitAssessment(assessmentId);
        if (cancelled) return;
        setPortraitAssessment(next);
        if (portraitRecord) {
          setPortraitCache((current) => ({
            ...current,
            [portraitRecord.id]: next.status === "failed"
              ? { status: "error", message: next.error_message || "识别任务失败" }
              : ["completed", "insufficient", "needs_review"].includes(next.status)
                ? { status: "ready", assessment: next }
                : { status: "loading" },
          }));
        }
        if (!["completed", "insufficient", "needs_review", "failed"].includes(next.status)) timer = window.setTimeout(() => void poll(), 1500);
      } catch (err) {
        if (!cancelled) setPortraitError(err instanceof Error ? err.message : "识别状态获取失败");
      }
    };
    timer = window.setTimeout(() => void poll(), 700);
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [portraitAssessment?.id, portraitAssessment?.status, portraitRecord]);

  const closePortrait = () => {
    setPortraitRecord(null);
    setPortraitAssessment(null);
    setPortraitError(null);
    setPortraitStarting(false);
    setPortraitLoadingLatest(false);
  };

  return (
    <div className="h-full overflow-hidden bg-[#f4f7f6] text-[#172522]">
      <div className="flex h-full min-w-0 flex-col">
        <div className="shrink-0 border-b border-[#e5ebe8] bg-[#f8faf9] px-5 py-4 md:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#d9e2de] bg-white p-1">
                {SCOPES.map((value) => (
                  <button key={value} type="button" onClick={() => setScope(value)} className={cn("h-7 rounded-md px-3 text-sm font-semibold transition-colors", scope === value ? "bg-[#146d68] text-white" : "text-[#60706b] hover:bg-[#e4f0ee]")}>{value}</button>
                ))}
              </div>
              <label className="relative min-w-[280px] flex-1 md:min-w-[380px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a09b]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="检索姓名、机构、标签、活动或关系" className="h-10 w-full rounded-lg border border-[#d9e2de] bg-white pl-9 pr-10 text-sm outline-none transition focus:border-[#146d68] focus:ring-2 focus:ring-[#e4f0ee]" />
                {query && <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#91a09b] hover:text-[#146d68]" title="清空搜索"><X className="h-4 w-4" /></button>}
              </label>
              <span className="whitespace-nowrap text-sm text-[#60706b]">共 {filteredRecords.length} 人</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 2xl:ml-auto">
              <button type="button" disabled className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#d9e2de] bg-white px-3 text-sm font-semibold text-[#91a09b]" title="批量画像识别功能开发中"><SlidersHorizontal className="h-4 w-4" />批量识别已选（{selectedIds.size}）</button>
              <button type="button" onClick={exportSelected} disabled={!filteredRecords.length} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#d9e2de] bg-white px-3 text-sm font-semibold text-[#3f514c] hover:bg-[#f3f8f7] disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />导出名单</button>
              <button type="button" onClick={() => setImportMode("chooser")} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#146d68] px-3.5 text-sm font-semibold text-white hover:bg-[#0f5854]"><Upload className="h-4 w-4" />导入人才档案</button>
              <button type="button" onClick={() => setFilterOpen((value) => !value)} className={cn("inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold", filterOpen || activeFilterCount ? "border-[#146d68] bg-[#e4f0ee] text-[#0f5854]" : "border-[#d9e2de] bg-white text-[#3f514c] hover:bg-[#f3f8f7]")}><Filter className="h-4 w-4" />筛选{activeFilterCount ? ` (${activeFilterCount})` : ""}</button>
              <button type="button" aria-pressed={fullInfo} onClick={() => setFullInfo((value) => !value)} className={cn("inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold", fullInfo ? "border-[#146d68] bg-[#e4f0ee] text-[#0f5854]" : "border-[#d9e2de] bg-white text-[#3f514c] hover:bg-[#f3f8f7]")}><Eye className="h-4 w-4" />完整信息</button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {filterOpen && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-5 top-[76px] z-30 w-[min(920px,calc(100%-40px))] overflow-hidden rounded-xl border border-[#d7e4e0] bg-white shadow-[0_18px_52px_rgba(20,46,40,.14)] md:right-7">
              <div className="grid min-h-[300px] grid-cols-[148px_minmax(0,1fr)]">
                <aside className="space-y-1 border-r border-[#edf2f0] bg-[#fafdfc] p-3">
                  <p className="px-2 py-1 text-xs font-extrabold text-[#7b8d87]">筛选分组</p>
                  {(["全部标签", "院内", "国内", "国际", "研究方向", "当前机构", "职称"] as FilterGroup[]).map((group) => <button key={group} type="button" onClick={() => { setFilterGroup(group); setFilterSearch(""); }} className={cn("flex min-h-9 w-full items-center rounded-lg px-2.5 text-left text-sm font-semibold", filterGroup === group ? "bg-[#e5f2ee] text-[#0f615a]" : "text-[#526963] hover:bg-[#f3f8f7]")}>{group}</button>)}
                </aside>
                <section className="flex min-w-0 flex-col p-4">
                  <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a09b]" /><input value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="搜索标签、方向、机构或职称" className="h-10 w-full rounded-lg border border-[#dfe8e5] bg-[#fafdfc] pl-9 pr-3 text-sm outline-none focus:border-[#146d68]" /></div>
                  <div className="mt-4 min-h-0 flex-1 overflow-auto"><div className="mb-2 flex items-center justify-between text-sm font-extrabold text-[#2e4741]"><span>{filterGroup}</span><span className="text-xs font-semibold text-[#7d8d88]">{filterOptions.length} 项</span></div><div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">{filterOptions.map((option) => { const active = filterGroup === "研究方向" ? selectedDirection === option : filterGroup === "当前机构" ? selectedInstitution === option : filterGroup === "职称" ? selectedTitle === option : selectedTag === option; return <button key={option} type="button" onClick={() => setFilterValue(option)} className={cn("flex min-h-9 items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm font-semibold", active ? "border-[#146d68] bg-[#146d68] text-white" : "border-[#e0ebe7] text-[#38524b] hover:bg-[#f4f9f8]")}><span className="truncate">{option}</span>{active && <Check className="h-4 w-4 shrink-0" />}</button>; })}</div>{filterOptions.length === 0 && <p className="py-12 text-center text-sm text-[#91a09b]">未找到匹配的筛选项</p>}</div>
                </section>
              </div>
              <div className="flex items-center gap-2 border-t border-[#e5ebe8] px-4 py-3"><button type="button" onClick={clearFilters} className="h-9 rounded-lg border border-[#d9e2de] px-3 text-sm font-semibold text-[#526963] hover:bg-[#f3f8f7]">重置筛选</button><button type="button" onClick={() => { clearFilters(); setFilterOpen(false); }} className="h-9 rounded-lg border border-[#d9e2de] px-3 text-sm text-[#526963] hover:bg-[#f3f8f7]">清空</button><div className="flex-1" /><button type="button" onClick={() => setFilterOpen(false)} className="h-9 rounded-lg bg-[#146d68] px-4 text-sm font-bold text-white hover:bg-[#0f5854]">应用筛选</button></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-0 flex-1 overflow-auto p-5 md:p-7">
          {(activeFilterCount > 0 || query) && <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#60706b]"><span className="font-semibold">已选条件：</span>{scope !== "全部" && <span className="rounded-full border border-[#d9e2de] bg-white px-2.5 py-1">范围：{scope}</span>}{selectedTag !== "全部标签" && <span className="rounded-full border border-[#d9e2de] bg-white px-2.5 py-1">标签：{selectedTag}</span>}{selectedInstitution && <span className="rounded-full border border-[#d9e2de] bg-white px-2.5 py-1">机构：{selectedInstitution}</span>}{selectedDirection && <span className="rounded-full border border-[#d9e2de] bg-white px-2.5 py-1">方向：{selectedDirection}</span>}{selectedTitle && <span className="rounded-full border border-[#d9e2de] bg-white px-2.5 py-1">职称：{selectedTitle}</span>}{query && <span className="rounded-full border border-[#d9e2de] bg-white px-2.5 py-1">搜索：{query}</span>}<button type="button" onClick={clearFilters} className="ml-1 text-[#146d68] hover:underline">清除全部</button></div>}
          {isLoading ? <div className="flex h-72 items-center justify-center rounded-xl border border-[#e5ebe8] bg-white text-sm text-[#91a09b]">加载中...</div> : error ? <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-sm text-red-500"><p>{error}</p><button type="button" onClick={() => setReloadSeed((value) => value + 1)} className="text-[#146d68] hover:underline">重试</button></div> : <div className="overflow-hidden rounded-xl border border-[#e5ebe8] bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[1080px] w-full border-collapse text-left"><thead><tr className="border-b border-[#e5ebe8] bg-[#f8faf9] text-xs font-extrabold text-[#60706b]"><th className="w-12 px-4 py-3"><input type="checkbox" onClick={(event) => event.stopPropagation()} checked={allVisibleSelected} ref={(element) => { if (element) element.indeterminate = someVisibleSelected; }} onChange={toggleVisibleSelection} aria-label="全选当前列表" /></th>{["姓名", "当前机构", "职称", "研究方向", "标签", "画像识别", "操作"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{visibleRecords.map((record, index) => <motion.tr data-record-id={record.id} key={record.id} role="button" tabIndex={0} onClick={() => void openPortrait(record)} onKeyDown={(event) => { if ((event.target as HTMLElement).closest("a,button,input,select,textarea")) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openPortrait(record); } }} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.015, duration: 0.18 }} className="group border-b border-[#edf2f0] last:border-b-0 hover:bg-[#f3f8f7]"><td className="px-4 py-3"><input type="checkbox" onClick={(event) => event.stopPropagation()} checked={selectedIds.has(record.id)} onChange={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(record.id)) next.delete(record.id); else next.add(record.id); return next; })} aria-label={`选择${record.name}`} /></td><td className="px-4 py-3"><Link to={isScholar(record) ? `/scholars/${record.sourceRecord.url_hash}` : `/students/${(record.sourceRecord as StudentRecord).id}`} state={{ from: location }} onClick={(event) => event.stopPropagation()} className="font-semibold text-[#263b35] hover:text-[#146d68]">{fullInfo ? safe(record.name) : maskTalentName(record.name)}</Link></td><td className="px-4 py-3 text-sm text-[#526963]"><span className="block max-w-[18rem] truncate">{safe(record.institution)}</span></td><td className="px-4 py-3 text-sm text-[#526963]">{safe(record.title)}</td><td className="px-4 py-3"><div className="flex max-w-[16rem] flex-wrap gap-1">{record.directions.slice(0, 2).map((direction) => <span key={direction} className="rounded-full border border-[#bfdbfe] bg-[#eaf4ff] px-2 py-0.5 text-xs font-semibold text-[#3988f5]">{direction}</span>)}{record.directions.length > 2 && <span className="rounded-full border border-[#d9e2de] bg-[#f8faf9] px-1.5 py-0.5 text-xs text-[#91a09b]">+{record.directions.length - 2}</span>}{record.directions.length === 0 && <span className="text-xs text-[#91a09b]">—</span>}</div></td><td className="px-4 py-3"><div className="flex max-w-[20rem] flex-wrap gap-1">{displayTags(record).map((tag) => <span key={tag} className="rounded-full border border-[#d9e2de] bg-[#f8faf9] px-2 py-0.5 text-xs text-[#526963]">{tag}</span>)}{record.tags.length > 3 && <span className="rounded-full border border-[#d9e2de] bg-[#f8faf9] px-1.5 py-0.5 text-xs text-[#91a09b]">+{record.tags.length - 3}</span>}{record.tags.length === 0 && <span className="text-xs text-[#91a09b]">—</span>}</div></td><td className="px-4 py-3 text-center" aria-label={isScholar(record) && record.scope === "院内" ? "院内学者识别暂不支持" : "画像识别结果"}>{(() => { const entry = portraitCache[record.id]; if (!entry || entry.status === "loading") return <div className="mx-auto h-20 w-28 animate-pulse rounded-lg bg-[#edf4f1]" aria-label="画像识别加载中" />; if (entry.status === "ready") return <PortraitRadarChart dimensions={entry.assessment.dimensions} compact />; if (entry.status === "error") return <span className="text-xs text-red-500">{entry.message}</span>; if (entry.status === "unsupported") return <span className="text-xs text-[#8a9994]">暂不支持</span>; return <span className="text-xs text-[#8a9994]">未识别</span>; })()}</td><td className="relative px-4 py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); setMenuId((current) => current === record.id ? null : record.id); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#91a09b] hover:bg-[#e4f0ee] hover:text-[#146d68]" aria-label={`${record.name}操作菜单`}><MoreVertical className="h-4 w-4" /></button>{menuId === record.id && <div onClick={(event) => event.stopPropagation()} className="absolute right-3 top-11 z-20 w-28 rounded-lg border border-[#d9e2de] bg-white p-1 text-left shadow-lg"><Link to={isScholar(record) ? `/scholars/${record.sourceRecord.url_hash}` : `/students/${(record.sourceRecord as StudentRecord).id}`} state={{ from: location }} onClick={() => setMenuId(null)} className="block rounded-md px-3 py-2 text-sm text-[#3f514c] hover:bg-[#f3f8f7]">查看</Link><button type="button" onClick={() => void startPortrait(record)} disabled={isScholar(record) && record.scope === "院内"} className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#91a09b] enabled:text-[#3f514c] enabled:hover:bg-[#f3f8f7] disabled:cursor-not-allowed" title={isScholar(record) && record.scope === "院内" ? "院内学者识别暂不支持" : "使用LLM识别画像"}>识别</button>{isScholar(record) && <button type="button" onClick={() => { setMenuId(null); void handleDelete(record); }} className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">删除</button>}</div>}</td></motion.tr>)}</tbody></table>{visibleRecords.length === 0 && <div className="flex h-56 items-center justify-center text-sm text-[#91a09b]">未找到符合条件的人才</div>}</div><Pagination page={page} totalPages={totalPages} totalItems={filteredRecords.length} onPageChange={setPage} /></div>}
        </div>
      </div>
      {importMode === "chooser" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"><div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-[#172522]">导入人才档案</h2><button type="button" onClick={() => setImportMode(null)} className="text-[#91a09b] hover:text-[#146d68]" title="关闭"><X className="h-5 w-5" /></button></div><p className="mt-2 text-sm text-[#60706b]">请选择要导入的档案类型，导入流程沿用现有模板和校验规则。</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => setImportMode("scholars")} className="flex items-center justify-center gap-2 rounded-lg border border-[#d9e2de] px-3 py-3 text-sm font-semibold text-[#3f514c] hover:bg-[#f3f8f7]"><FileSpreadsheet className="h-4 w-4" />学者档案</button><button type="button" onClick={() => setImportMode("students")} className="flex items-center justify-center gap-2 rounded-lg border border-[#d9e2de] px-3 py-3 text-sm font-semibold text-[#3f514c] hover:bg-[#f3f8f7]"><FileSpreadsheet className="h-4 w-4" />学生档案</button></div></div></div>}
      <BatchScholarImportModal isOpen={importMode === "scholars"} onClose={() => setImportMode(null)} onSuccess={() => { setImportMode(null); setReloadSeed((value) => value + 1); }} />
      <BatchStudentImportModal isOpen={importMode === "students"} onClose={() => setImportMode(null)} onSuccess={() => { setImportMode(null); setReloadSeed((value) => value + 1); }} />
      <PortraitAssessmentModal isOpen={Boolean(portraitRecord)} recordName={portraitRecord ? safe(portraitRecord.name) : "人才"} assessment={portraitAssessment} isStarting={portraitStarting} isLoadingLatest={portraitLoadingLatest} error={portraitError} onClose={closePortrait} onStart={portraitRecord && !(isScholar(portraitRecord) && portraitRecord.scope === "院内") ? () => void startPortrait(portraitRecord) : undefined} onRetry={() => { if (portraitRecord) void startPortrait(portraitRecord); }} />
    </div>
  );
}
