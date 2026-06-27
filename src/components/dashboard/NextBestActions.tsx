import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Sparkles } from "lucide-react";

export interface NextAction {
  id: string;
  label: string;
  count?: number;
  href: string;
  priority: "high" | "normal" | "low";
}

interface NextBestActionsProps {
  actions: NextAction[];
}

export function NextBestActions({ actions }: NextBestActionsProps) {
  if (actions.length === 0) return null;

  return (
    <Card className="nova-glow-gold">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-[var(--nova-gold)]" />
          Nova Next Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="group flex items-center justify-between rounded-lg border border-[var(--nova-border)] bg-black/20 px-4 py-3 transition-all duration-200 hover:border-[var(--nova-gold-muted)] hover:bg-[var(--nova-gold-muted)]"
          >
            <div className="flex items-center gap-3">
              {action.count !== undefined && (
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--nova-gold-muted)] text-sm font-semibold text-[var(--nova-gold-soft)]">
                  {action.count}
                </span>
              )}
              <span className="text-sm text-[var(--nova-text-primary)] group-hover:text-[var(--nova-gold-soft)]">{action.label}</span>
              {action.priority === "high" && <Badge variant="warning">Priority</Badge>}
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--nova-text-muted)] group-hover:text-[var(--nova-gold)]" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
