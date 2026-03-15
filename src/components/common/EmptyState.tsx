import type { ComponentType } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <Icon className="w-12 h-12 mb-3 opacity-30" />
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs mt-1 opacity-70">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-xs text-primary-600 hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
