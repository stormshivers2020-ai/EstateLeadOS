import { cn } from "@/lib/utils/cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  nova?: boolean;
}

export function SectionHeader({ title, subtitle, action, className, nova = true }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {nova && <p className="nova-label mb-1">SCS Nova</p>}
        <h2 className="text-lg font-semibold tracking-tight text-[var(--nova-text-primary)]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--nova-text-secondary)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
