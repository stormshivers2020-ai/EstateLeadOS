import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "gold";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[var(--nova-panel-soft)] text-[var(--nova-text-secondary)] border border-[var(--nova-border)]",
  success: "bg-[rgba(64,217,139,0.12)] text-[var(--nova-green)] border border-[rgba(64,217,139,0.25)]",
  warning: "bg-[rgba(255,180,84,0.12)] text-[var(--nova-orange)] border border-[rgba(255,180,84,0.25)]",
  danger: "bg-[rgba(255,94,94,0.12)] text-[var(--nova-red)] border border-[rgba(255,94,94,0.25)]",
  info: "bg-[rgba(77,163,255,0.12)] text-[var(--nova-blue)] border border-[rgba(77,163,255,0.25)]",
  gold: "bg-[var(--nova-gold-muted)] text-[var(--nova-gold-soft)] border border-[rgba(214,168,79,0.3)]",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors duration-200",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
