"use client";

import { getAutomationState } from "@/lib/automation";
import { PAYOUT_STATUS_LABELS } from "@/lib/automation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DollarSign } from "lucide-react";

export function AutomationPayoutReadinessPanel({ leadId }: { leadId?: string }) {
  const state = getAutomationState();
  const records = leadId
    ? state.payoutReadiness.filter((p) => p.leadId === leadId)
    : state.payoutReadiness;

  const record = records[0];

  if (!record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[var(--nova-gold)]" />
            Payout Readiness Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--nova-text-muted)]">
          No payout readiness record yet. Run Closing / Payout Readiness Automation after assignment workflow begins.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[rgba(214,168,79,0.2)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[var(--nova-gold)]" />
          Payout Readiness Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--nova-text-muted)]">Status</span>
          <Badge variant={record.payoutReadinessStatus === "ready_for_payout_review" ? "gold" : "default"}>
            {PAYOUT_STATUS_LABELS[record.payoutReadinessStatus]}
          </Badge>
        </div>
        <div className="grid gap-2 text-xs">
          <Row label="Recorded fee" value={record.actualAssignmentFee != null ? `$${record.actualAssignmentFee.toLocaleString()}` : "Not recorded"} />
          <Row label="Closing date" value={record.closingDate ?? "—"} />
          <Row label="Title company" value={record.titleCompany ?? "—"} />
          <Row label="Signed documents" value={record.signedDocumentsStatus} />
          <Row label="Compliance" value={record.complianceStatus} />
          <Row label="Document packet" value={record.documentPacketStatus} />
          <Row label="Payment provider" value={record.paymentProviderStatus.replace(/_/g, " ")} />
        </div>
        <p className="rounded-lg border border-[var(--nova-border)] bg-black/20 p-3 text-[10px] leading-relaxed text-[var(--nova-text-muted)]">
          {record.payoutNotes}
        </p>
        <p className="text-[10px] text-[var(--nova-orange)]">
          EstateLeadOS tracks payout readiness and recorded outcomes. Actual funds movement requires a connected, approved payment provider, title-company process, or external banking workflow.
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[var(--nova-text-muted)]">{label}</span>
      <span className="text-[var(--nova-text-secondary)]">{value}</span>
    </div>
  );
}
