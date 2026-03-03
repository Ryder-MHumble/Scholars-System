/**
 * 学术成就卡片
 * 从 ScholarDetailPage.tsx:1919-2141 提取
 * 显示代表性论文、专利、奖项，支持编辑模式
 */
import { motion } from "framer-motion";
import {
  Trophy,
  BookOpen,
  Award,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { FacultyDetail } from "@/services/facultyApi";
import { slideInUp } from "@/utils/animations";

interface AchievementsCardProps {
  faculty: FacultyDetail;
  isEditMode: boolean;
  setShowAchievementsModal: (show: boolean) => void;
}

export function AchievementsCard({
  faculty,
  isEditMode,
  setShowAchievementsModal,
}: AchievementsCardProps) {
  return (
    <motion.div
      variants={slideInUp}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      {/* 卡片标题 */}
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">学术成就</h3>
        {isEditMode && (
          <button
            onClick={() => setShowAchievementsModal(true)}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-full transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            编辑
          </button>
        )}
      </div>

      {/* ── 代表性论文 ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-600">代表性论文</h4>
          {faculty.representative_publications && faculty.representative_publications.length > 0 && (
            <span className="text-xs text-gray-400">{faculty.representative_publications.length} 篇</span>
          )}
        </div>
        {faculty.representative_publications && faculty.representative_publications.length > 0 ? (
          <>
            <div className="space-y-3">
              {faculty.representative_publications.map((pub, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 leading-snug">
                          {pub.title || "论文"}
                        </p>
                        {pub.is_corresponding && (
                          <span className="inline-block text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded mt-1">
                            通讯作者
                          </span>
                        )}
                      </div>
                      {pub.citation_count !== undefined && pub.citation_count > 0 && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          被引 {pub.citation_count}
                        </span>
                      )}
                    </div>
                    {pub.venue && (
                      <p className="text-xs text-gray-500 mb-1">
                        {pub.venue}
                        {pub.year && ` (${pub.year})`}
                      </p>
                    )}
                    {pub.authors && (
                      <p className="text-xs text-gray-400 truncate">{pub.authors}</p>
                    )}
                  </div>
                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
            {faculty.publications_count > 0 && (
              <p className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-100">
                总计约 {faculty.publications_count} 篇，可前往{" "}
                {faculty.dblp_url ? (
                  <a href={faculty.dblp_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">DBLP</a>
                ) : "DBLP"}{" "}
                或{" "}
                {faculty.google_scholar_url ? (
                  <a href={faculty.google_scholar_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Scholar</a>
                ) : "Google Scholar"}{" "}
                查看全部
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            论文详情暂未收录
            {(faculty.dblp_url || faculty.google_scholar_url) && (
              <>，可前往{" "}
                {faculty.dblp_url ? (
                  <a href={faculty.dblp_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">DBLP</a>
                ) : "DBLP"}{" "}
                或{" "}
                {faculty.google_scholar_url ? (
                  <a href={faculty.google_scholar_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Scholar</a>
                ) : "Google Scholar"}{" "}
                查看
              </>
            )}
          </p>
        )}
      </div>

      {/* ── 专利 ── */}
      <div className="pt-4 border-t border-gray-100 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-600">专利</h4>
          {faculty.patents && faculty.patents.length > 0 && (
            <span className="text-xs text-gray-400">{faculty.patents.length} 项</span>
          )}
        </div>
        {faculty.patents && faculty.patents.length > 0 ? (
          <div className="space-y-3">
            {faculty.patents.map((patent, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      {patent.title || "专利"}
                    </p>
                    {patent.year && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {patent.year}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1">
                    {patent.patent_no && (
                      <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {patent.patent_no}
                      </span>
                    )}
                    {patent.patent_type && (
                      <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {patent.patent_type}
                      </span>
                    )}
                    {patent.status && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded border",
                        patent.status === "已授权" ? "bg-green-50 border-green-200 text-green-700" : "bg-blue-50 border-blue-200 text-blue-700"
                      )}>
                        {patent.status}
                      </span>
                    )}
                  </div>
                  {patent.inventors && (
                    <p className="text-xs text-gray-400 truncate">
                      发明人: {patent.inventors}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">暂无专利数据</p>
        )}
      </div>

      {/* ── 荣誉奖项 ── */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-600">荣誉奖项</h4>
          {faculty.awards && faculty.awards.length > 0 && (
            <span className="text-xs text-gray-400">{faculty.awards.length} 个</span>
          )}
        </div>
        {faculty.awards && faculty.awards.length > 0 ? (
          <div className="space-y-3">
            {faculty.awards.map((award, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      {award.title || "奖项"}
                    </p>
                    {award.year && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {award.year}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs mb-1">
                    {award.level && (
                      <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-amber-700">
                        {award.level}
                      </span>
                    )}
                    {award.grantor && (
                      <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-gray-600">
                        {award.grantor}
                      </span>
                    )}
                  </div>
                  {award.description && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {award.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">暂无荣誉奖项数据</p>
        )}
      </div>
    </motion.div>
  );
}
