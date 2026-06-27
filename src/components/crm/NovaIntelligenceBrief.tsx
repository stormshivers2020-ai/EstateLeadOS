"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles } from "lucide-react";
import { NOVA_SYSTEM_LABELS } from "@/lib/constants/brand";

interface NovaIntelligenceBriefProps {
  summary: string;
  signals?: string[];
  dataConfidenceScore: number;
  complianceReviewNeeded: boolean;
  missingItems?: string[];
  nextAction: string;
}

export function NovaIntelligenceBrief({
  summary,
  signals = [],
  dataConfidenceScore,
  complianceReviewNeeded,
  missingItems = [],
  nextAction,
}: NovaIntelligenceBriefProps) {
  return (
    <Card className="border-[var(--nova-gold-muted)] bg-gradient-to-br from-[var(--nova-gold-muted)]/30 to-[var(--nova-panel)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-[var(--nova-gold)]" />
          Nova Intelligence Brief
        </CardTitle>
        <p className="text-xs text-[var(--nova-text-muted)]">{NOVA_SYSTEM_LABELS.intelligence}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-relaxed text-[var(--nova-text-primary)]">{summary}</p>
        {signals.length > 0 && (
          <div>
            <p className="nova-label mb-2">Signal Stack</p>
            <div className="flex flex-wrap gap-2">
              {signals.map((s) => (
                <Badge key={s} variant="info">{s}</Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Source Confidence {dataConfidenceScore}%</Badge>
          {complianceReviewNeeded && <Badge variant="warning">Compliance review required</Badge>}
          {missingItems.map((item) => (
            <Badge key={item} variant="warning">Missing: {item}</Badge>
          ))}
        </div>
        <div className="rounded-lg border border-[var(--nova-border)] bg-black/20 p-3">
          <p className="text-xs font-medium text-[var(--nova-text-muted)]">What must happen next</p>
          <p className="mt-1 text-[var(--nova-text-primary)]">{nextAction}</p>
        </div>
      </CardContent>
    </Card>
  );
}
