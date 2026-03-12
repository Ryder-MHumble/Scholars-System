import { useState, useEffect, useRef } from "react";
import { Search, UserPlus, Loader2, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchScholarList, type ScholarListItem } from "@/services/scholarApi";
import { cn } from "@/utils/cn";

export interface ScholarPickResult {
  scholar_id: string;   // url_hash
  name: string;
  photo_url: string;
  institution: string;  // university
  title: string;        // position
  department: string;
}

interface ScholarSearchPickerProps {
  onSelect: (result: ScholarPickResult) => void;
  placeholder?: string;
  className?: string;
  /** url_hash list to exclude from results (already selected scholars) */
  excludeIds?: string[];
  /** if true, shows the picker inline (no standalone box) */
  compact?: boolean;
}

export function ScholarSearchPicker({
  onSelect,
  placeholder = "搜索学者姓名...",
  className,
  excludeIds = [],
  compact = false,
}: ScholarSearchPickerProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScholarListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(false);
      try {
        const res = await fetchScholarList(1, 8, { search: query.trim() });
        const filtered = res.items.filter(
          (s) => !excludeIds.includes(s.url_hash),
        );
        setResults(filtered);
        setIsOpen(true);
        setSearched(true);
      } catch {
        setResults([]);
        setIsOpen(true);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, excludeIds.join(",")]);

  // Click outside to close
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSelect = (scholar: ScholarListItem) => {
    onSelect({
      scholar_id: scholar.url_hash,
      name: scholar.name,
      photo_url: scholar.photo_url ?? "",
      institution: scholar.university ?? "",
      title: scholar.position ?? "",
      department: scholar.department ?? "",
    });
    setQuery("");
    setIsOpen(false);
    setSearched(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-9 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow",
            compact ? "py-1.5" : "py-2",
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin pointer-events-none" />
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {results.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {results.map((scholar) => (
                <button
                  key={scholar.url_hash}
                  onClick={() => handleSelect(scholar)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 transition-colors text-left group"
                >
                  <ScholarAvatar
                    name={scholar.name}
                    photoUrl={scholar.photo_url}
                    size={36}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700">
                      {scholar.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {[scholar.position, scholar.department, scholar.university]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {scholar.academic_titles?.length > 0 && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                      {scholar.academic_titles[0]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : searched ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-gray-500 mb-1">未找到匹配的学者</p>
              <p className="text-xs text-gray-400">
                可以新增学者到学者库
              </p>
            </div>
          ) : null}

          {/* Add new scholar button */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => navigate("/scholars/add")}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" />
              新增学者到学者库
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Avatar Component ────────────────────────────────────────────────

interface ScholarAvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}

export function ScholarAvatar({
  name,
  photoUrl,
  size = 40,
  className,
}: ScholarAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const char = name ? name.charAt(0) : "?";

  const sizeClass =
    size <= 32
      ? "w-8 h-8 text-xs"
      : size <= 40
        ? "w-10 h-10 text-sm"
        : "w-12 h-12 text-base";

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover shrink-0",
          sizeClass,
          className,
        )}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium shrink-0",
        sizeClass,
        className,
      )}
    >
      {char}
    </div>
  );
}
