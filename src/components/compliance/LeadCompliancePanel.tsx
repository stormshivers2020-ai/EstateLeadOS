import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskBadge, StateSupportBadge, CountySupportBadge, ScoreBadge } from "./ComplianceBadges";
import { WorkflowBlockerPanel } from "./WorkflowBlockerPanel";
import type { ComplianceCheckResult, LeadComplianceContext } from "@/lib/types/compliance";
import { Shield, FileText, Wrench } from "lucide-react";

interface LeadCompliancePanelProps {
  context: LeadComplianceContext;
  checkResult: ComplianceCheckResult | null;
  stateSupportStatus?: string;
  countySupportStatus?: string;
}

export function LeadCompliancePanel({
  context,
  checkResult,
  stateSupportStatus,
  countySupportStatus,
}: LeadCompliancePanelProps) {
  return (
    <div className="space-y-4">
      <Card className="border-sky-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-400" />
            Compliance Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">State / County</p>
              <p className="text-sm font-medium text-slate-100">
                {context.stateAbbreviation ?? "—"} / {context.countyName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Deal Type</p>
              <p className="text-sm capitalize text-slate-200">
                {context.dealType?.replace(/_/g, " ") ?? "Not selected"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Compliance Risk</p>
              <RiskBadge risk={context.complianceRiskLevel} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Risk Score</p>
              <ScoreBadge score={context.complianceRiskScore} />
            </div>
          </div>

          {stateSupportStatus && (
            <div className="flex flex-wrap gap-2">
              <StateSupportBadge status={stateSupportStatus as never} />
              {countySupportStatus && (
                <CountySupportBadge status={countySupportStatus as never} />
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <ProgressItem
              icon={Wrench}
              label="Equipment Progress"
              value={context.equipmentProgress}
            />
            <ProgressItem
              icon={FileText}
              label="Document Progress"
              value={context.documentProgress}
            />
          </div>

          <div className="grid gap-2 text-sm">
            <StatusRow label="Owner identity verified" ok={context.ownerIdentityVerified} />
            <StatusRow label="Source documents attached" ok={context.sourceDocumentsAttached} />
            <StatusRow label="Communication log active" ok={context.communicationLogActive} />
          </div>

          {checkResult && (
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
              <p className="text-xs font-medium text-slate-300">Last Compliance Check</p>
              <p className="mt-1 text-sm text-slate-400">{checkResult.explanation}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="text-emerald-400">
                  Allowed: {checkResult.allowedStages.join(", ") || "none"}
                </span>
                <span className="text-red-400">
                  Blocked: {checkResult.blockedStages.join(", ") || "none"}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              href="/state-deal-kits"
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
            >
              Open State Deal Kit
            </Link>
            <button
              type="button"
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
            >
              Run Compliance Check
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
            >
              Add Acknowledgement
            </button>
          </div>

          <p className="text-xs text-slate-500">
            EstateLeadOS cannot confirm legal compliance. Review required before continuing.
          </p>
        </CardContent>
      </Card>

      <WorkflowBlockerPanel blockers={context.blockers} />
    </div>
  );
}

function ProgressItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-700/40 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-700">
        <div
          className="h-2 rounded-full bg-sky-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-300">{value}%</p>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={ok ? "text-emerald-400" : "text-amber-400"}>
        {ok ? "Yes" : "No"}
      </span>
    </div>
  );
}
