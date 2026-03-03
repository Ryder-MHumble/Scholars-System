// ─── 左侧分区标题 ─────────────────────────────────────────────────
interface SideLabelProps {
  icon: React.ElementType;
  title: string;
}

export function SideLabel({ icon: Icon, title }: SideLabelProps) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon className="w-3.5 h-3.5 text-primary-500" />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </span>
    </div>
  );
}
