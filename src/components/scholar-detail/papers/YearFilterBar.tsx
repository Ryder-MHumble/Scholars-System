import { cn } from '@/utils/cn';

interface YearFilterBarProps {
  years: number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  className?: string;
}

export function YearFilterBar({
  years,
  selectedYear,
  onYearChange,
  className,
}: YearFilterBarProps) {
  // Sort years in descending order
  const sortedYears = [...years].sort((a, b) => b - a);

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar', className)}>
      {/* All button */}
      <button
        onClick={() => onYearChange(null)}
        className={cn(
          'flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap',
          selectedYear === null
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        )}
      >
        All
      </button>

      {/* Year buttons */}
      {sortedYears.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
            selectedYear === year
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
