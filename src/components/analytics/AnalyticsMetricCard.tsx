import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { MoneyLabel } from "@/lib/types/analytics";
import type { LucideIcon } from "lucide-react";

const LABEL_VARIANTS: Record<MoneyLabel, "info" | "warning" | "success" | "danger" | "default"> = {
  estimated: "info",
  projected: "info",
  accrued: "warning",
  pending: "warning",
  received: "success",
  lost: "danger",
  user_entered: "default",
  system_calculated: "default",
};

interface AnalyticsMetricCardProps {
  title: string;
  value: string;
  explanation: string;
  moneyLabel?: MoneyLabel;
  icon?: LucideIcon;
  className?: string;
}

export function AnalyticsMetricCard({
  title,
  value,
  explanation,
  moneyLabel,
  icon: Icon,
  className,
}: AnalyticsMetricCardProps) {
  return (
    <Card className={cn("premium-panel nova-glow-gold", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
              {moneyLabel && (
                <Badge variant={LABEL_VARIANTS[moneyLabel]}>
                  {moneyLabel.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--nova-gold-soft)]">{value}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{explanation}</p>
          </div>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--nova-gold-muted)] bg-black/30 text-[var(--nova-gold)]">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
