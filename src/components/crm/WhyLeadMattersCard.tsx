import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Lightbulb } from "lucide-react";

interface WhyLeadMattersCardProps {
  leadId?: string;
  signals: { name: string; explanation: string; confidence: number }[];
  dataConfidenceScore: number;
  complianceRiskScore: number;
  nextAction: string;
  missingItems?: string[];
}

export function WhyLeadMattersCard({
  leadId,
  signals,
  dataConfidenceScore,
  complianceRiskScore,
  nextAction,
  missingItems = [],
}: WhyLeadMattersCardProps) {
  const topSignals = signals.slice(0, 3);
  const complianceReviewNeeded = complianceRiskScore >= 60;
  const signalNames = topSignals.map((s) => s.name.toLowerCase()).join(", ");

  const summary = topSignals.length > 0
    ? `Nova Intelligence flagged this lead due to ${signalNames}. Source confidence is ${dataConfidenceScore >= 75 ? "moderate to high" : dataConfidenceScore >= 50 ? "moderate" : "low"}. ${complianceReviewNeeded ? "Manual owner verification and compliance review are required before outreach." : "Standard workflow review applies before outreach preparation."}`
    : `Nova Intelligence requires manual verification for this lead. Source confidence is ${dataConfidenceScore >= 75 ? "moderate to high" : dataConfidenceScore >= 50 ? "moderate" : "low"}. ${complianceReviewNeeded ? "Compliance review is recommended before outreach." : "Complete verification steps before outreach preparation."}`;

  return (
    <Card className="border-[var(--nova-gold-muted)] bg-gradient-to-br from-[var(--nova-gold-muted)]/20 to-[var(--nova-panel)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-[var(--nova-gold)]" />
          Nova Intelligence Brief
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-relaxed text-[var(--nova-text-primary)]">{summary}</p>
        {topSignals.length > 0 && (
          <div>
            <p className="nova-label mb-2">Signal Stack</p>
            <div className="flex flex-wrap gap-2">
              {topSignals.map((s) => (
                <Badge key={s.name} variant="info">{s.name}</Badge>
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
        <div className="flex flex-wrap gap-3 text-xs">
          <Link href={leadId ? `/wizards/compliance?leadId=${leadId}` : "/wizards/compliance"} className="text-[var(--nova-blue)] hover:underline">Run Compliance Wizard</Link>
          <Link href="#documents" className="text-[var(--nova-blue)] hover:underline">Generate Document Packet</Link>
          <Link href="#signals" className="text-[var(--nova-blue)] hover:underline">View Source Evidence</Link>
        </div>
      </CardContent>
    </Card>
  );
}
