import { EmptyState } from "./EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LucideIcon } from "lucide-react";

interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: number;
  features?: string[];
}

export function ModulePlaceholder({
  icon,
  title,
  description,
  phase,
  features = [],
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        phase={phase}
      />

      {features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Planned Capabilities
              <Badge variant="info">Phase {phase}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
