import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Award,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { ALL_VENUES } from "@/data/venues";
import type { Venue, VenueType, VenueRank } from "@/types/venue";
import { cn } from "@/utils/cn";

export default function VenueListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<VenueType | "全部">("全部");
  const [selectedRank, setSelectedRank] = useState<VenueRank | "全部">("全部");
  const [selectedField, setSelectedField] = useState<string>("全部");

  // Get unique fields
  const fields = useMemo(() => {
    const fieldSet = new Set(ALL_VENUES.map((v) => v.field));
    return ["全部", ...Array.from(fieldSet)];
  }, []);

  // Filter venues
  const filteredVenues = useMemo(() => {
    let venues = ALL_VENUES;

    if (selectedType !== "全部") {
      venues = venues.filter((v) => v.type === selectedType);
    }

    if (selectedRank !== "全部") {
      venues = venues.filter((v) => v.rank === selectedRank);
    }

    if (selectedField !== "全部") {
      venues = venues.filter((v) => v.field === selectedField);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      venues = venues.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.nameEn.toLowerCase().includes(query) ||
          v.fullName?.toLowerCase().includes(query) ||
          v.field.toLowerCase().includes(query),
      );
    }

    return venues;
  }, [searchQuery, selectedType, selectedRank, selectedField]);

  const handleVenueClick = (venue: Venue) => {
    if (venue.isExternal && venue.externalUrl) {
      window.open(venue.externalUrl, "_blank");
    } else {
      // TODO: Navigate to venue detail page or show related scholars
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">期刊会议</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              AI 领域顶级期刊与会议 · 共 {filteredVenues.length} 个
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索期刊或会议..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            {(["全部", "会议", "期刊"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  selectedType === type
                    ? "bg-primary-100 text-primary-700"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200",
                )}
              >
                {type}
              </button>
            ))}
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
                    ? "bg-primary-100 text-primary-700"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200",
                )}
              >
                {rank}
              </button>
            ))}
          </div>
        </div>

        {/* Field Filter */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
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
      </div>

      {/* Venue Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {filteredVenues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">未找到匹配的期刊或会议</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <button
                  onClick={() => handleVenueClick(venue)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary-300 transition-all text-left group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          venue.type === "会议"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600"
                            : "bg-gradient-to-br from-purple-500 to-purple-600",
                        )}
                      >
                        {venue.type === "会议" ? (
                          <Award className="w-5 h-5 text-white" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-white" />
                        )}
                      </div>
                      {venue.isExternal && (
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 text-xs font-bold rounded border",
                        getRankColor(venue.rank),
                      )}
                    >
                      {venue.rank}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {venue.nameEn}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                    {venue.fullName}
                  </p>

                  {/* Field Tag */}
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {venue.field}
                    </span>
                  </div>

                  {/* Description */}
                  {venue.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {venue.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    {venue.h5Index && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          H5: {venue.h5Index}
                        </span>
                      </div>
                    )}
                    {venue.impactFactor && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          IF: {venue.impactFactor}
                        </span>
                      </div>
                    )}
                    {venue.acceptanceRate && (
                      <div className="text-xs text-gray-600">
                        录用率: {venue.acceptanceRate}
                      </div>
                    )}
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
