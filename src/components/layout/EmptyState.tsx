import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase?: number;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  learnHref?: string;
  learnLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  phase,
  primaryAction,
  secondaryAction,
  learnHref,
  learnLabel = "Learn more",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--nova-border-strong)] bg-gradient-to-b from-[var(--nova-panel-soft)]/40 to-[var(--nova-bg-primary)] px-8 py-16 text-center nova-animate-in",
        className
      )}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--nova-gold-muted)] bg-[var(--nova-gold-muted)]/30 text-[var(--nova-gold)]">
        <Icon className="h-7 w-7" />
      </div>
      <p className="nova-label mb-2">SCS Nova</p>
      <h3 className="text-lg font-semibold tracking-tight text-[var(--nova-text-primary)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--nova-text-secondary)]">{description}</p>
      {phase && (
        <p className="mt-3 text-xs text-[var(--nova-text-muted)]">Module activates in Phase {phase}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {primaryAction && (
          <Link href={primaryAction.href} className="nova-btn-primary px-4 py-2 text-sm">
            {primaryAction.label}
          </Link>
        )}
        {secondaryAction && (
          <Link href={secondaryAction.href} className="nova-btn-secondary px-4 py-2 text-sm">
            {secondaryAction.label}
          </Link>
        )}
        {action}
      </div>
      {learnHref && (
        <Link href={learnHref} className="mt-4 text-xs text-[var(--nova-gold)] hover:text-[var(--nova-gold-soft)] hover:underline">
          {learnLabel} →
        </Link>
      )}
    </div>
  );
}
