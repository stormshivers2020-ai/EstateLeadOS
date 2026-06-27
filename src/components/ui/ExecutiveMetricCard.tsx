import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "./Card";
import { Badge } from "./Badge";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";

interface ExecutiveMetricCardProps {
  title: string;
  value: string | number;
  explanation: string;
  href?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  status?: { label: string; variant: "success" | "warning" | "danger" | "info" | "default" };
}

export function ExecutiveMetricCard({
  title,
  value,
  explanation,
  href,
  icon: Icon,
  trend = "neutral",
  trendLabel,
  status,
}: ExecutiveMetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-amber-400" : "text-slate-500";

  const content = (
    <Card className={cn("premium-panel group transition-all duration-200", href && "hover:border-sky-600/30 hover:shadow-lg")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
              {status && <Badge variant={status.variant}>{status.label}</Badge>}
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-50">{value}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{explanation}</p>
            {trendLabel && (
              <p className={cn("mt-2 flex items-center gap-1 text-xs", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                {trendLabel}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                <Icon className="h-5 w-5" />
              </div>
            )}
            {href && (
              <ArrowUpRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-sky-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}
