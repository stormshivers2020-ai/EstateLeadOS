import { APP_NAME, POWERED_BY, NOVA_SYSTEM_LABELS } from "@/lib/constants/brand";
import { cn } from "@/lib/utils/cn";

type BrandVariant =
  | "inline"
  | "footer"
  | "admin"
  | "report"
  | "document"
  | "login"
  | "command";

const VARIANT_COPY: Record<BrandVariant, { primary: string; secondary: string }> = {
  inline: { primary: APP_NAME, secondary: `Powered by ${POWERED_BY}` },
  footer: { primary: APP_NAME, secondary: `Powered by ${POWERED_BY}` },
  admin: { primary: "SCS Nova Control Layer", secondary: `${NOVA_SYSTEM_LABELS.adminControl}` },
  report: { primary: `Generated through ${APP_NAME}`, secondary: `Powered by ${POWERED_BY}` },
  document: { primary: `Prepared in ${NOVA_SYSTEM_LABELS.documentRoom}`, secondary: `Powered by ${POWERED_BY}` },
  login: { primary: APP_NAME, secondary: `Powered by ${POWERED_BY}` },
  command: { primary: NOVA_SYSTEM_LABELS.commandCenter, secondary: `${APP_NAME} operational overview powered by ${POWERED_BY}` },
};

export function ScsNovaBrand({
  variant = "inline",
  className,
}: {
  variant?: BrandVariant;
  className?: string;
}) {
  const copy = VARIANT_COPY[variant];
  return (
    <div className={cn("text-center", className)}>
      <p className="text-sm font-semibold tracking-tight text-[var(--nova-text-primary)]">{copy.primary}</p>
      <p className="text-xs text-[var(--nova-text-muted)]">
        {variant === "inline" || variant === "footer" ? (
          <>Powered by <span className="text-[var(--nova-gold-soft)]">{POWERED_BY}</span></>
        ) : (
          copy.secondary
        )}
      </p>
    </div>
  );
}

export function ScsNovaSidebarFooter() {
  return (
    <div className="space-y-1">
      <p className="nova-label">Powered by {POWERED_BY}</p>
      <p className="text-xs text-[var(--nova-text-muted)]">Nationwide inherited-property intelligence</p>
    </div>
  );
}
