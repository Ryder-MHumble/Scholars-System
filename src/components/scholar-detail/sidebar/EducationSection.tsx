import { GraduationCap } from 'lucide-react';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import type { Education } from '@/types';

interface EducationSectionProps {
  education: Education[];
}

export function EducationSection({ education }: EducationSectionProps) {
  if (!education || education.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection title="Education" icon={GraduationCap} defaultExpanded={false}>
      <div className="space-y-4">
        {education.map((edu, index) => (
          <div key={index} className="relative pl-6 pb-4 last:pb-0">
            {/* Timeline dot and line */}
            <div className="absolute left-0 top-1.5">
              <div className="w-3 h-3 rounded-full bg-primary-600 border-2 border-white shadow" />
              {index < education.length - 1 && (
                <div className="absolute top-3 left-1.5 w-0.5 h-full bg-gray-200" />
              )}
            </div>

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">{edu.degree}</h4>
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                  {edu.endYear ? `${edu.year}-${edu.endYear}` : edu.year}
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{edu.institution}</p>
              {edu.major && (
                <p className="text-xs text-gray-600">{edu.major}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
