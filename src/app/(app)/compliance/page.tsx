import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { RiskBadge, StateSupportBadge } from "@/components/compliance/ComplianceBadges";
import { WorkflowBlockerPanel } from "@/components/compliance/WorkflowBlockerPanel";
import { EmptyState } from "@/components/layout/EmptyState";
import { isDemoMode } from "@/lib/config/app-mode";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import {
  getActiveBlockers,
  getAcknowledgements,
  getComplianceAuditLog,
  getComplianceOverview,
  getStateRiskMap,
} from "@/lib/services/compliance";
import { getAttorneyReviewQueue } from "@/lib/services/documents";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  FileWarning,
  Scale,
  ShieldAlert,
  ClipboardCheck,
} from "lucide-react";

export default function ComplianceCenterPage() {
  const isDemo = isDemoMode();
  const overview = getComplianceOverview();
  const blockers = getActiveBlockers();
  const acknowledgements = getAcknowledgements();
  const auditLog = getComplianceAuditLog();
  const stateRiskMap = getStateRiskMap().filter((s) => s.activeLeads > 0 || isDemo);

  const attorneyQueue = isDemo ? getAttorneyReviewQueue() : [];

  const sourceWarnings = isDemo
    ? [
        { source: "Duval Tax Assessor", state: "FL", county: "Duval", permission: "approved_manual", terms: "pending", warning: "Manual-only county" },
        { source: "Mecklenburg Probate", state: "NC", county: "Mecklenburg", permission: "research_only", terms: "unknown", warning: "Research-only — no automated access" },
      ]
    : [];

  return (
    <AppShell
      title="Compliance Center"
      subtitle="Nova Compliance Layer — workflow readiness, risk visibility, and required acknowledgements"
    >
      {isDemo && (
        <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          Demo compliance data is fictional and for product demonstration only.
        </div>
      )}

      {!isDemo && overview.leadsNeedingReview === 0 && (
        <EmptyState
          icon={Shield}
          title="No Compliance Activity Yet"
          description="Select a state and county in State Deal Kits to configure compliance workflows. Import leads or configure approved data sources to begin."
          action={
            <a
              href="/state-deal-kits"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              Open State Deal Kits
            </a>
          }
        />
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Needs Review" value={overview.leadsNeedingReview} icon={ClipboardCheck} />
        <StatCard title="Elevated Risk" value={overview.elevatedRiskLeads} icon={AlertTriangle} />
        <StatCard title="Restricted" value={overview.restrictedLeads} icon={ShieldAlert} />
        <StatCard title="Missing Acknowledgements" value={overview.missingAcknowledgements} icon={FileWarning} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="High Risk Leads" value={overview.highRiskLeads} />
            <Metric label="Attorney Review Required" value={overview.attorneyReviewRequired} />
            <Metric label="Missing Documents" value={overview.missingDocuments} />
            <Metric label="Missing Equipment" value={overview.missingEquipment} />
            <Metric label="Unknown Rules" value={overview.unknownRules} />
            <Metric label="Source Warnings" value={overview.sourceWarnings} />
            <Metric label="Assignment Blockers" value={overview.assignmentBlockers} />
            <Metric label="Outreach Blockers" value={overview.outreachBlockers} />
          </CardContent>
        </Card>

        <WorkflowBlockerPanel blockers={blockers} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>State Risk Map</CardTitle>
        </CardHeader>
        <CardContent>
          {stateRiskMap.length === 0 ? (
            <p className="text-sm text-slate-400">No active leads by state.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                    <th className="pb-2 pr-4">State</th>
                    <th className="pb-2 pr-4">Support</th>
                    <th className="pb-2 pr-4">Risk</th>
                    <th className="pb-2 pr-4">Data</th>
                    <th className="pb-2 pr-4">Active Leads</th>
                    <th className="pb-2">Blocked</th>
                  </tr>
                </thead>
                <tbody>
                  {stateRiskMap.map((row) => (
                    <tr key={row.state} className="border-b border-slate-800">
                      <td className="py-2 pr-4 font-medium text-slate-200">
                        {row.stateName} ({row.state})
                      </td>
                      <td className="py-2 pr-4">
                        <StateSupportBadge status={row.supportedStatus} />
                      </td>
                      <td className="py-2 pr-4">
                        <RiskBadge risk={row.riskRating} />
                      </td>
                      <td className="py-2 pr-4 capitalize text-slate-400">
                        {row.dataAvailability.replace(/_/g, " ")}
                      </td>
                      <td className="py-2 pr-4 text-slate-300">{row.activeLeads}</td>
                      <td className="py-2 text-amber-400">{row.blockedLeads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Attorney Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attorneyQueue.length === 0 ? (
              <p className="text-sm text-slate-400">No items in attorney/title review queue.</p>
            ) : (
              <ul className="space-y-3">
                {attorneyQueue.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-slate-700/50 p-3 text-sm"
                  >
                    <div className="flex justify-between">
                      <Link href={`/documents/${item.documentRecordId}`} className="font-medium text-sky-300 hover:underline">
                        {item.documentName}
                      </Link>
                      <RiskBadge risk={item.riskLevel as "elevated"} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.stateAbbreviation} / {item.countyName} — {item.dealType.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-amber-300">{item.reviewReason}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/documents" className="mt-3 inline-block text-xs text-sky-400 hover:underline">
              View full Attorney Review Queue in Document Center →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceWarnings.length === 0 ? (
              <p className="text-sm text-slate-400">No source warnings.</p>
            ) : (
              <ul className="space-y-3">
                {sourceWarnings.map((w, i) => (
                  <li key={i} className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-3 text-sm">
                    <p className="font-medium text-slate-200">{w.source}</p>
                    <p className="text-xs text-slate-400">
                      {w.state} / {w.county} — {w.permission}
                    </p>
                    <p className="mt-1 text-xs text-amber-300">{w.warning}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Compliance Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-sm text-slate-400">No compliance audit entries.</p>
          ) : (
            <ul className="space-y-2">
              {auditLog.map((entry) => (
                <li key={entry.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{entry.actionDescription}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {acknowledgements.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Required Acknowledgements ({acknowledgements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {acknowledgements.map((ack) => (
                <li key={ack.id} className="text-sm text-slate-300">
                  <span className="capitalize text-sky-400">
                    {ack.acknowledgementType.replace(/_/g, " ")}
                  </span>
                  {" — "}
                  {ack.acknowledgementText.slice(0, 80)}...
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-xs leading-relaxed text-slate-500">{GLOBAL_DISCLAIMER}</p>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}
