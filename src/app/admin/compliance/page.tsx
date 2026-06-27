import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskBadge, StateSupportBadge, CountySupportBadge } from "@/components/compliance/ComplianceBadges";
import {
  getCountiesForState,
  getStateProfiles,
} from "@/lib/services/compliance";
import { isDemoMode } from "@/lib/config/app-mode";
import { ShieldCheck } from "lucide-react";

const ADMIN_SECTIONS = [
  "State Profiles",
  "County Profiles",
  "Compliance Rules",
  "Risk Ratings",
  "Required Equipment Templates",
  "Required Document Templates",
  "Acknowledgement Templates",
  "Workflow Blocker Rules",
  "Attorney Review Notes",
  "Source Compliance Warnings",
  "State/County Review Status",
];

export default function AdminCompliancePage() {
  const states = getStateProfiles();
  const isDemo = isDemoMode();
  const demoStates = ["TX", "FL", "OH", "GA", "NC"];

  return (
    <AppShell
      title="SCS Nova Admin — Compliance Controls"
      subtitle="Master state/county profiles, compliance rules, and checklist templates"
      isAdmin
    >
      <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
        SCS Nova Super Admin only. Demo compliance data is fictional.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => (
          <Card key={section}>
            <CardContent className="flex items-center gap-3 py-4">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
              <span className="text-sm font-medium text-slate-200">{section}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>State Profiles ({states.length} states)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                  <th className="pb-2 pr-4">State</th>
                  <th className="pb-2 pr-4">Support</th>
                  <th className="pb-2 pr-4">Risk</th>
                  <th className="pb-2 pr-4">Review Status</th>
                  <th className="pb-2">Last Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {(isDemo ? states.filter((s) => demoStates.includes(s.stateAbbreviation)) : states.slice(0, 10)).map((s) => (
                  <tr key={s.id} className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-slate-200">
                      {s.stateName} ({s.stateAbbreviation})
                    </td>
                    <td className="py-2 pr-4">
                      <StateSupportBadge status={s.supportedStatus} />
                    </td>
                    <td className="py-2 pr-4">
                      <RiskBadge risk={s.riskRating} />
                    </td>
                    <td className="py-2 pr-4 capitalize text-slate-400">
                      {s.complianceReviewStatus.replace(/_/g, " ")}
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {s.lastReviewedAt
                        ? new Date(s.lastReviewedAt).toLocaleDateString()
                        : "Not reviewed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isDemo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>County Profiles (Demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                    <th className="pb-2 pr-4">County</th>
                    <th className="pb-2 pr-4">State</th>
                    <th className="pb-2 pr-4">Support</th>
                    <th className="pb-2 pr-4">Risk</th>
                    <th className="pb-2">Admin Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {demoStates.flatMap((abbr) =>
                    getCountiesForState(abbr).map((c) => (
                      <tr key={c.id} className="border-b border-slate-800">
                        <td className="py-2 pr-4 text-slate-200">{c.countyName}</td>
                        <td className="py-2 pr-4 text-slate-400">{c.stateAbbreviation}</td>
                        <td className="py-2 pr-4">
                          <CountySupportBadge status={c.supportedStatus} />
                        </td>
                        <td className="py-2 pr-4">
                          <RiskBadge risk={c.countyRiskRating} />
                        </td>
                        <td className="py-2 capitalize text-slate-500">
                          {c.adminApprovalStatus}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Scoring Rules (Template)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Probate signal weight: 15 — Active</li>
            <li>• Inheritance transfer weight: 12 — Active</li>
            <li>• Absentee owner weight: 8 — Active</li>
            <li>• Vacancy signal weight: 10 — Active</li>
            <li>• Tax delinquency weight: 8 — Active</li>
            <li>• Missing data penalty: -10 — Active</li>
            <li>• Unknown source terms penalty: -15 — Active</li>
          </ul>
        </CardContent>
      </Card>
    </AppShell>
  );
}
