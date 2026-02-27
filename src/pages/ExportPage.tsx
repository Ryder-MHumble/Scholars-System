import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, FileJson, Check } from 'lucide-react';
import PageTransition from '@/layouts/PageTransition';
import { scholars } from '@/data/scholars';
import { universities } from '@/data/universities';
import { papers } from '@/data/papers';
import { cn } from '@/utils/cn';

const exportFormats = [
  { id: 'excel', label: 'Excel (.xlsx)', description: '适合用Excel或WPS打开查看', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'csv', label: 'CSV (.csv)', description: '通用数据格式，兼容性最好', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { id: 'json', label: 'JSON (.json)', description: '适合程序化处理和API对接', icon: FileJson, color: 'text-amber-600 bg-amber-50' },
];

const dataScopes = [
  { id: 'scholars', label: '学者数据', count: scholars.length, description: '所有学者基本信息、研究方向、荣誉等' },
  { id: 'institutions', label: '院校数据', count: universities.length, description: '院校和院系层级关系' },
  { id: 'papers', label: '论文数据', count: papers.length, description: '代表性论文信息' },
  { id: 'all', label: '全量数据', count: scholars.length + universities.length + papers.length, description: '包含所有学者、院校和论文数据' },
];

export default function ExportPage() {
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [selectedScope, setSelectedScope] = useState('scholars');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);

      // Generate and download JSON for demo
      let data: unknown;
      if (selectedScope === 'scholars') {
        data = scholars.map((s) => {
          const uni = universities.find((u) => u.id === s.universityId);
          const dept = uni?.departments.find((d) => d.id === s.departmentId);
          return { ...s, universityName: uni?.name, departmentName: dept?.name };
        });
      } else if (selectedScope === 'institutions') {
        data = universities;
      } else if (selectedScope === 'papers') {
        data = papers;
      } else {
        data = { scholars, universities, papers };
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scholar-db-${selectedScope}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">数据导出</h2>
          <p className="text-sm text-gray-500 mt-0.5">选择导出格式和数据范围</p>
        </div>

        {/* Format Selection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">导出格式</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {exportFormats.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={cn(
                  'flex flex-col items-center p-4 rounded-lg border-2 transition-all text-center',
                  selectedFormat === fmt.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200',
                )}
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', fmt.color)}>
                  <fmt.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-900">{fmt.label}</span>
                <span className="text-xs text-gray-500 mt-1">{fmt.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scope Selection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">数据范围</h3>
          <div className="space-y-2">
            {dataScopes.map((scope) => (
              <button
                key={scope.id}
                onClick={() => setSelectedScope(scope.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                  selectedScope === scope.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200',
                )}
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{scope.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{scope.description}</div>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{scope.count} 条</span>
              </button>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <motion.button
          onClick={handleExport}
          disabled={exporting}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all',
            exported
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
            <><Download className="w-4 h-4" /> 开始导出</>
          )}
        </motion.button>
      </div>
    </PageTransition>
  );
}
