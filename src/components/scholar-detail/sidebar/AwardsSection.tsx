import { Award, Medal } from 'lucide-react';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import type { DetailedAward, AwardCategory } from '@/types';
import { cn } from '@/utils/cn';

interface AwardsSectionProps {
  awards: DetailedAward[];
}

const medalColors: Record<AwardCategory, string> = {
  gold: 'text-[#fbbf24] bg-amber-50',
  silver: 'text-[#9ca3af] bg-gray-100',
  bronze: 'text-[#c2410c] bg-orange-50',
};

const medalBorders: Record<AwardCategory, string> = {
  gold: 'border-amber-200',
  silver: 'border-gray-300',
  bronze: 'border-orange-200',
};

export function AwardsSection({ awards }: AwardsSectionProps) {
  if (!awards || awards.length === 0) {
    return null;
  }

  // Sort by year descending
  const sortedAwards = [...awards].sort((a, b) => b.year - a.year);

  return (
    <CollapsibleSection title="Awards" icon={Award} defaultExpanded={true}>
      <div className="space-y-3">
        {sortedAwards.map((award, index) => (
          <div
            key={index}
            className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
          >
            {/* Medal Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border-2',
                medalColors[award.category],
                medalBorders[award.category],
              )}
            >
              <Medal className="w-5 h-5" />
            </div>

            {/* Award Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                  {award.name}
                </h4>
                <span className="flex-shrink-0 text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {award.year}
                </span>
              </div>
              {award.issuer && (
                <p className="text-xs text-gray-600 mb-1">{award.issuer}</p>
              )}
              {award.description && (
                <p className="text-xs text-gray-500 leading-relaxed">
                  {award.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
