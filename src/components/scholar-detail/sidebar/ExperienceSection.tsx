import { Briefcase } from 'lucide-react';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import type { Experience } from '@/types';

interface ExperienceSectionProps {
  experience: Experience[];
}

export function ExperienceSection({ experience }: ExperienceSectionProps) {
  if (!experience || experience.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection title="Experience" icon={Briefcase} defaultExpanded={false}>
      <div className="space-y-4">
        {experience.map((exp, index) => (
          <div key={index} className="relative pl-6 pb-4 last:pb-0">
            {/* Timeline dot and line */}
            <div className="absolute left-0 top-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow" />
              {index < experience.length - 1 && (
                <div className="absolute top-3 left-1.5 w-0.5 h-full bg-gray-200" />
              )}
            </div>

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">{exp.position}</h4>
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                  {exp.endYear ? `${exp.startYear}-${exp.endYear}` : `${exp.startYear}-至今`}
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{exp.institution}</p>
              {exp.description && (
                <p className="text-xs text-gray-600 leading-relaxed">{exp.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
