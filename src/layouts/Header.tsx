import { useState, useCallback } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Search, X, GraduationCap } from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { path: '/', label: '总览', exact: true },
  { path: '/institutions', label: '院校浏览' },
  { path: '/scholars', label: '学者目录' },
  { path: '/changelog', label: '变更记录' },
  { path: '/export', label: '数据导出' },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, navigate],
  );

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2.5 shrink-0 mr-1">
        <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">学者数据库</span>
      </NavLink>

      <div className="w-px h-5 bg-gray-200 shrink-0" />

      {/* Nav links */}
      <nav className="flex items-center gap-0.5 flex-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
              )}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Search */}
      <form onSubmit={handleSearch}>
        <div
          className={cn(
            'flex items-center border rounded-lg transition-all duration-200',
            searchFocused
              ? 'border-primary-300 ring-2 ring-primary-100 w-72'
              : 'border-gray-200 w-56',
          )}
        >
          <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="搜索学者、院校、论文..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 py-2 px-2"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mr-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 mr-2 text-xs text-gray-400 bg-gray-100 rounded">
            ⌘K
          </kbd>
        </div>
      </form>
    </header>
  );
}
