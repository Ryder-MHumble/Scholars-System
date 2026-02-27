import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, Building2, FileText } from 'lucide-react';
import PageTransition from '@/layouts/PageTransition';
import { scholars } from '@/data/scholars';
import { universities } from '@/data/universities';
import { papers } from '@/data/papers';
import { getAvatarColor, getInitial } from '@/utils/avatar';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const results = useMemo(() => {
    if (!query.trim()) return { scholars: [], universities: [], papers: [] };
    const q = query.toLowerCase();
    return {
      scholars: scholars.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
          s.researchFields.some((f) => f.toLowerCase().includes(q)),
      ),
      universities: universities.filter(
        (u) =>
          u.name.includes(q) ||
          u.shortName.includes(q) ||
          u.departments.some((d) => d.name.includes(q)),
      ),
      papers: papers.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)),
      ),
    };
  }, [query]);

  const total = results.scholars.length + results.universities.length + results.papers.length;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">搜索结果</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {query ? `"${query}" 共找到 ${total} 条结果` : '请输入搜索关键词'}
          </p>
        </div>

        {/* Scholar Results */}
        {results.scholars.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" /> 学者
              <span className="text-xs text-gray-400">({results.scholars.length})</span>
            </h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {results.scholars.slice(0, 10).map((s, i) => {
                const uni = universities.find((u) => u.id === s.universityId);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link to={`/scholars/${s.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0" style={{ backgroundColor: getAvatarColor(s.name) }}>
                        {getInitial(s.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{s.name} {s.nameEn && <span className="text-gray-400 font-normal">({s.nameEn})</span>}</div>
                        <div className="text-xs text-gray-500">{uni?.name} · {s.title} · {s.researchFields.slice(0, 3).join(', ')}</div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* University Results */}
        {results.universities.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" /> 院校
              <span className="text-xs text-gray-400">({results.universities.length})</span>
            </h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {results.universities.map((u) => (
                <Link key={u.id} to={`/institutions/${u.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.location} · {u.departments.length} 个院系</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Paper Results */}
        {results.papers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> 论文
              <span className="text-xs text-gray-400">({results.papers.length})</span>
            </h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {results.papers.slice(0, 10).map((p) => (
                <div key={p.id} className="p-4">
                  <div className="text-sm font-medium text-gray-900">{p.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{p.authors.join(', ')} · {p.venue} {p.year}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {total === 0 && query && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">未找到相关结果</p>
            <p className="text-xs mt-1">请尝试其他关键词</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
