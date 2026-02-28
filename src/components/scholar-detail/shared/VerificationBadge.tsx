import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface VerificationBadgeProps {
  verified?: boolean;
  claimed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerificationBadge({
  verified = false,
  claimed = false,
  size = 'md',
  className,
}: VerificationBadgeProps) {
  if (!verified && !claimed) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        verified
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-primary-50 text-primary-700 border border-primary-200',
        sizeClasses[size],
        className,
      )}
      title={verified ? '已验证身份' : '已认领'}
    >
      <CheckCircle2 className={iconSizes[size]} />
      <span>{verified ? 'Verified' : 'Claimed'}</span>
    </div>
  );
}
