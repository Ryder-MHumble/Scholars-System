import { cn } from '@/utils/cn';

interface PaperFilterPanelProps {
  sortBy: 'year' | 'citation';
  onSortChange: (sort: 'year' | 'citation') => void;
  className?: string;
}

export function PaperFilterPanel({
  sortBy,
  onSortChange,
  className,
}: PaperFilterPanelProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-sm text-gray-600 font-medium">Sort by:</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSortChange('year')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            sortBy === 'year'
              ? 'bg-primary-100 text-primary-700 border border-primary-300'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200',
          )}
        >
          By Year
        </button>
        <button
          onClick={() => onSortChange('citation')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            sortBy === 'citation'
              ? 'bg-primary-100 text-primary-700 border border-primary-300'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200',
          )}
        >
          By Citation
        </button>
      </div>
    </div>
  );
}
