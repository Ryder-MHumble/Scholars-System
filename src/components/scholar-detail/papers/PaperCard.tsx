import { Award, Eye, Quote, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import type { Paper } from "@/types";
import { cn } from "@/utils/cn";

interface PaperCardProps {
  paper: Paper;
  className?: string;
}

export function PaperCard({ paper, className }: PaperCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer",
        className,
      )}
    >
      {/* Title with highlight badge */}
      <div className="flex items-start gap-3 mb-3">
        {paper.isHighlight && (
          <Award className="flex-shrink-0 w-5 h-5 text-amber-500 mt-0.5" />
        )}
        <h3 className="flex-1 text-base font-semibold text-gray-900 leading-snug hover:text-primary-600 transition-colors">
          {paper.title}
        </h3>
      </div>

      {/* Authors */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-700">
          {paper.authors.map((author, index) => (
            <span key={index} className="inline-flex items-center">
              <Link
                to={`/scholars/${paper.scholarId}`}
                className="hover:text-primary-600 hover:underline transition-colors"
              >
                {author}
              </Link>
              {index < paper.authors.length - 1 && (
                <span className="ml-2 text-gray-400">,</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Venue and Year */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-primary-600 font-medium">
          {paper.venue}
        </span>
        <span className="text-sm text-gray-500">({paper.year})</span>
        {paper.venueType && (
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            {paper.venueType}
          </span>
        )}
      </div>

      {/* Metrics and Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {paper.citationCount !== undefined && (
            <div className="flex items-center gap-1.5">
              <Quote className="w-4 h-4" />
              <span>Cited {paper.citationCount.toLocaleString()}</span>
            </div>
          )}
          {paper.views !== undefined && (
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Views {paper.views.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {paper.bibtex && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              title="复制BibTeX"
            >
              Bibtex
            </motion.button>
          )}
          {paper.doi && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-primary-200 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              DOI
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
