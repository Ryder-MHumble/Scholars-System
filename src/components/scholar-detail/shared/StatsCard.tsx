import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  highlight?: boolean;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  highlight = false,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 rounded-lg border',
        highlight
          ? 'bg-primary-50 border-primary-200'
          : 'bg-gray-50 border-gray-200',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            'w-4.5 h-4.5',
            highlight ? 'text-primary-600' : 'text-gray-600',
          )}
        />
        <span className="text-sm text-gray-600 font-medium">{label}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'text-2xl font-bold',
            highlight ? 'text-primary-700' : 'text-gray-900',
          )}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
