import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileJson, FileSpreadsheet, Check, X } from 'lucide-react';
import PageTransition from '@/layouts/PageTransition';
import { scholars } from '@/data/scholars';
import { universities } from '@/data/universities';
import { cn } from '@/utils/cn';

const ALL_TITLES = ['教授', '副教授', '助理教授', '研究员', '副研究员', '助理研究员', '讲师', '博士后'] as const;
const ALL_HONORS = ['中国科学院院士', '中国工程院院士', '国家杰出青年科学基金获得者', '国家优秀青年科学基金获得者', '长江学者特聘教授', '长江学者青年学者', '万人计划领军人才', 'IEEE Fellow', 'ACM Fellow'] as const;
const SCHOLAR_DIVISIONS = ['AI核心和基础/AI安全', 'AI社会科学', 'AI+自然科学/生命科学', 'AI核心和基础/大模型', 'AI+工程技术', '其他'] as const;

const COLUMNS = [
  { id: 'name', label: '姓名', group: '基础信息' },
  { id: 'nameEn', label: '英文名', group: '基础信息' },
  { id: 'title', label: '职称', group: '基础信息' },
  { id: 'universityName', label: '院校', group: '基础信息' },
  { id: 'departmentName', label: '院系', group: '基础信息' },
  { id: 'researchFields', label: '研究方向', group: '基础信息' },
  { id: 'email', label: '邮箱', group: '联系信息' },
  { id: 'phone', label: '电话', group: '联系信息' },
  { id: 'homepage', label: '个人主页', group: '联系信息' },
  { id: 'hIndex', label: 'H 指数', group: '学术指标' },
  { id: 'citationCount', label: '引用数', group: '学术指标' },
  { id: 'paperCount', label: '论文数', group: '学术指标' },
  { id: 'honors', label: '学术荣誉', group: '荣誉信息' },
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
              selected.includes(opt)
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ExportPage() {
  // Filters
  const [filterUnis, setFilterUnis] = useState<string[]>([]);
  const [filterDepts, setFilterDepts] = useState<string[]>([]);
  const [filterTitles, setFilterTitles] = useState<string[]>([]);
  const [filterHonors, setFilterHonors] = useState<string[]>([]);
  const [filterDivisions, setFilterDivisions] = useState<string[]>([]);
  const [filterMentorType, setFilterMentorType] = useState<string[]>([]);

  // Column selection
  const [selectedColumns, setSelectedColumns] = useState<ColumnId[]>([
    'name', 'title', 'universityName', 'departmentName', 'email',
  ]);

  // Format
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'excel'>('csv');

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const uniOptions = universities.map((u) => u.name);
  const deptOptions = useMemo(() => {
    if (filterUnis.length === 0) {
      return universities.flatMap((u) => u.departments.map((d) => d.name));
    }
    return universities
      .filter((u) => filterUnis.includes(u.name))
      .flatMap((u) => u.departments.map((d) => d.name));
  }, [filterUnis]);

  const filtered = useMemo(() => {
    let result = scholars;

    if (filterUnis.length > 0) {
      const uniIds = universities.filter((u) => filterUnis.includes(u.name)).map((u) => u.id);
      result = result.filter((s) => uniIds.includes(s.universityId));
    }

    if (filterDepts.length > 0) {
      const deptIds = universities
        .flatMap((u) => u.departments)
        .filter((d) => filterDepts.includes(d.name))
        .map((d) => d.id);
      result = result.filter((s) => deptIds.includes(s.departmentId));
    }

    if (filterTitles.length > 0) {
      result = result.filter((s) => filterTitles.includes(s.title));
    }

    if (filterHonors.length > 0) {
      result = result.filter((s) => filterHonors.some((h) => s.honors.includes(h as never)));
    }

    if (filterDivisions.length > 0) {
      result = result.filter((s) => filterDivisions.includes((s as { scholarDivision?: string }).scholarDivision ?? ''));
    }

    if (filterMentorType.length > 0) {
      result = result.filter((s) => filterMentorType.includes((s as { mentorType?: string }).mentorType ?? ''));
    }

    return result;
  }, [filterUnis, filterDepts, filterTitles, filterHonors, filterDivisions, filterMentorType]);

  const toggleColumn = (col: ColumnId) =>
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );

  const groups = [...new Set(COLUMNS.map((c) => c.group))];

  const getScholarRow = (s: (typeof scholars)[number]): Record<ColumnId, string> => {
    const uni = universities.find((u) => u.id === s.universityId);
    const dept = uni?.departments.find((d) => d.id === s.departmentId);
    return {
      name: s.name,
      nameEn: s.nameEn ?? '',
      title: s.title,
      universityName: uni?.name ?? '',
      departmentName: dept?.name ?? '',
      researchFields: s.researchFields.join('|'),
      email: s.email ?? '',
      phone: s.phone ?? '',
      homepage: s.homepage ?? '',
      hIndex: String(s.hIndex ?? ''),
      citationCount: String(s.citationCount ?? ''),
      paperCount: String(s.paperCount ?? ''),
      honors: s.honors.join('|'),
    };
  };

  const handleExport = () => {
    if (selectedFormat === 'excel') {
      alert('Excel 导出即将支持，请暂时使用 CSV 格式。');
      return;
    }

    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);

      const data = filtered.map(getScholarRow);

      if (selectedFormat === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scholars-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV
        const header = selectedColumns.map((col) => COLUMNS.find((c) => c.id === col)?.label ?? col);
        const rows = data.map((row) => selectedColumns.map((col) => row[col]));
        const csv = [header, ...rows]
          .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
          .join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scholars-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 1000);
  };

  const resetFilters = () => {
    setFilterUnis([]);
    setFilterDepts([]);
    setFilterTitles([]);
    setFilterHonors([]);
    setFilterDivisions([]);
    setFilterMentorType([]);
  };

  const hasFilters =
    filterUnis.length > 0 ||
    filterDepts.length > 0 ||
    filterTitles.length > 0 ||
    filterHonors.length > 0 ||
    filterDivisions.length > 0 ||
    filterMentorType.length > 0;

  const formats = [
    { id: 'csv' as const, label: 'CSV', desc: '通用格式，兼容性最佳', icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { id: 'json' as const, label: 'JSON', desc: '程序化处理和 API 对接', icon: FileJson, color: 'text-amber-600 bg-amber-50' },
    { id: 'excel' as const, label: 'Excel', desc: '即将支持', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50', disabled: true },
  ];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">数据导出</h2>
          <p className="text-sm text-gray-500 mt-0.5">设置筛选条件和导出列，生成学者数据报表</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Filters + Columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">筛选条件</h3>
                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                    重置
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <MultiSelect label="所属院校" options={uniOptions} selected={filterUnis} onChange={setFilterUnis} />
                {deptOptions.length > 0 && (
                  <MultiSelect label="所属院系" options={deptOptions} selected={filterDepts} onChange={setFilterDepts} />
                )}
                <MultiSelect label="职称" options={ALL_TITLES} selected={filterTitles} onChange={setFilterTitles} />
                <MultiSelect label="学术荣誉" options={ALL_HONORS} selected={filterHonors} onChange={setFilterHonors} />
                <MultiSelect label="学部分类" options={SCHOLAR_DIVISIONS} selected={filterDivisions} onChange={setFilterDivisions} />
                <MultiSelect label="导师类型" options={['教学研究型', '研究型']} selected={filterMentorType} onChange={setFilterMentorType} />
              </div>
            </div>

            {/* Column Selection */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">导出列</h3>
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {COLUMNS.filter((c) => c.group === group).map((col) => {
                        const checked = selectedColumns.includes(col.id);
                        return (
                          <label
                            key={col.id}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs font-medium',
                              checked
                                ? 'bg-primary-50 border-primary-300 text-primary-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300',
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleColumn(col.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3 h-3"
                            />
                            {col.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Format + Preview + Export */}
          <div className="space-y-4">
            {/* Format */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">导出格式</h3>
              <div className="space-y-2">
                {formats.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => !fmt.disabled && setSelectedFormat(fmt.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                      fmt.disabled && 'opacity-50 cursor-not-allowed',
                      selectedFormat === fmt.id && !fmt.disabled
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-200',
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', fmt.color)}>
                      <fmt.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{fmt.label}</div>
                      <div className="text-xs text-gray-400">{fmt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">数据预览</h3>
              <div className="text-center py-3 mb-3">
                <span className="text-3xl font-bold text-primary-600">{filtered.length}</span>
                <p className="text-xs text-gray-400 mt-0.5">符合条件的学者</p>
              </div>
              {filtered.length > 0 && (
                <div className="space-y-1.5">
                  {filtered.slice(0, 5).map((s) => {
                    const uni = universities.find((u) => u.id === s.universityId);
                    return (
                      <div key={s.id} className="flex items-center gap-2 text-xs text-gray-600 py-1 border-b border-gray-50 last:border-0">
                        <span className="font-medium truncate">{s.name}</span>
                        <span className="text-gray-400 shrink-0">{s.title}</span>
                        <span className="text-gray-400 ml-auto shrink-0">{uni?.shortName}</span>
                      </div>
                    );
                  })}
                  {filtered.length > 5 && (
                    <p className="text-xs text-gray-400 text-center pt-1">...还有 {filtered.length - 5} 条</p>
                  )}
                </div>
              )}
            </div>

            {/* Export Button */}
            <motion.button
              onClick={handleExport}
              disabled={exporting || filtered.length === 0}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all',
                filtered.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : exported
                    ? 'bg-emerald-500 text-white'
                    : exporting
                      ? 'bg-primary-400 text-white cursor-wait'
                      : 'bg-primary-500 text-white hover:bg-primary-600',
              )}
            >
              {exported ? (
                <><Check className="w-4 h-4" /> 导出成功</>
              ) : exporting ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Download className="w-4 h-4" /></motion.div> 导出中...</>
              ) : (
                <><Download className="w-4 h-4" /> 导出 {filtered.length} 条数据</>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
