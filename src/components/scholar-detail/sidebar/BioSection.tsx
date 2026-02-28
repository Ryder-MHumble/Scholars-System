import { useState } from "react";
import { User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CollapsibleSection } from "../shared/CollapsibleSection";

interface BioSectionProps {
  bio?: string;
  maxLength?: number;
}

export function BioSection({ bio, maxLength = 300 }: BioSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!bio) {
    return null;
  }

  const shouldTruncate = bio.length > maxLength;
  const displayText =
    shouldTruncate && !isExpanded ? bio.slice(0, maxLength) + "..." : bio;

  return (
    <CollapsibleSection title="Bio" icon={User} defaultExpanded={true}>
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={isExpanded ? "expanded" : "collapsed"}
            initial={{ opacity: 0, height: "auto" }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
          >
            {displayText}
          </motion.p>
        </AnimatePresence>
        {shouldTruncate && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {isExpanded ? "Show Less" : "Read More"}
          </motion.button>
        )}
      </div>
    </CollapsibleSection>
  );
}
