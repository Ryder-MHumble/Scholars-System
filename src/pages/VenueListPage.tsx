import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  TrendingUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { Venue, VenueType, VenueRank } from "@/types/venue";
import { cn } from "@/utils/cn";
import { fetchVenueList } from "@/services/venueApi";

export default function VenueListPage() {
  const [searchParams] = useSearchParams();

  // Initialize state from URL params
  const subtab = searchParams.get("subtab");
  const initialType: VenueType | "全部" =
    subtab === "top_conferences"
      ? "会议"
      : subtab === "journals"
        ? "期刊"
        : "全部";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<VenueType | "全部">(
    initialType,
  );
  const [selectedRank, setSelectedRank] = useState<VenueRank | "全部">("全部");
  const [selectedField, setSelectedField] = useState<string>("全部");

  // API state
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state with URL params
  useEffect(() => {
    const subtab = searchParams.get("subtab");
    if (subtab === "top_conferences") {
      setSelectedType("会议");
    } else if (subtab === "journals") {
      setSelectedType("期刊");
    } else {
      setSelectedType("全部");
    }
  }, [searchParams]);

  // Fetch venues from API
  useEffect(() => {
    const controller = new AbortController();

    const loadVenues = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextVenues = await fetchVenueList(
          {
            type: selectedType,
            rank: selectedRank,
            field: selectedField,
            keyword: searchQuery,
            pageSize: 100,
          },
          controller.signal,
        );
        setVenues(nextVenues);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to fetch venues:", err);
        setError(err instanceof Error ? err.message : "加载失败");
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search query
    const timeoutId = setTimeout(
      () => {
        void loadVenues();
      },
      searchQuery.trim() ? 300 : 0,
    );

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedType, selectedRank, selectedField, searchQuery]);

  // Get unique fields from API data
  const fields = useMemo(() => {
    const fieldSet = new Set(venues.map((v) => v.field));
    return ["全部", ...Array.from(fieldSet)];
  }, [venues]);

  const handleVenueClick = (venue: Venue) => {
    if (venue.isExternal && venue.externalUrl) {
      window.open(venue.externalUrl, "_blank");
    } else if (venue.website) {
      window.open(venue.website, "_blank");
    } else {
      alert("查看相关学者功能开发中");
    }
  };

  const getRankColor = (rank: VenueRank) => {
    switch (rank) {
      case "A*":
        return "bg-red-100 text-red-700 border-red-200";
      case "A":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "B":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "C":
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-6 md:p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">学术社群</h2>
              <p className="text-sm text-gray-500 mt-1">
                AI 领域顶级期刊与会议 · 共{" "}
                <span className="font-semibold text-gray-700">
                  {loading ? "..." : venues.length}
                </span>{" "}
                个
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索期刊或会议..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
              />
            </div>

            {/* Rank Filter */}
            <div className="flex items-center gap-2">
              {(["全部", "A*", "A", "B", "C"] as const).map((rank) => (
                <button
                  key={rank}
                  onClick={() => setSelectedRank(rank)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    selectedRank === rank
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200",
                  )}
                >
                  {rank}
                </button>
              ))}
            </div>
          </div>

          {/* Field Filter */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {fields.map((field) => (
              <button
                key={field}
                onClick={() => setSelectedField(field)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                  selectedField === field
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {field}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <BookOpen className="w-16 h-16 text-red-300 mb-4" />
              <p className="text-red-500 mb-2">加载失败</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && venues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">未找到匹配的期刊或会议</p>
            </div>
          )}

          {/* Venue Grid */}
          {!loading && !error && venues.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {venues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                >
                  <button
                    onClick={() => handleVenueClick(venue)}
                    className="w-full bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary-300 transition-all text-left group relative overflow-hidden"
                  >
                    {/* Rank Badge - Top Right */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-sm font-bold rounded-lg border shadow-sm",
                          getRankColor(venue.rank),
                        )}
                      >
                        {venue.rank}
                      </span>
                    </div>

                    {/* Name Section */}
                    <div className="pr-12 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors">
                        {venue.nameEn}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {venue.fullName}
                      </p>
                    </div>

                    {/* Field Tag */}
                    <div className="mb-3">
                      <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {venue.field}
                      </span>
                    </div>

                    {/* Description */}
                    {venue.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {venue.description}
                      </p>
                    )}

                    {/* Stats Footer */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      {venue.h5Index && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600 font-medium">
                            H5: {venue.h5Index}
                          </span>
                        </div>
                      )}
                      {venue.impactFactor && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600 font-medium">
                            IF: {venue.impactFactor}
                          </span>
                        </div>
                      )}
                      {venue.acceptanceRate && (
                        <div className="text-xs text-gray-600 font-medium">
                          录用率: {venue.acceptanceRate}
                        </div>
                      )}
                      {venue.website && (
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 transition-colors ml-auto" />
                      )}
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
