import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SafetyStatusBadge } from "@/components/crm/PipelineBadges";
import { getOutreachTemplates, getBlockedPhrases } from "@/lib/services/outreach";
import { getCrmAuditEvents } from "@/lib/services/crm";
import { isDemoMode } from "@/lib/config/app-mode";

const ADMIN_SECTIONS = [
  "Outreach Templates",
  "Template Safety Review",
  "Blocked Language Rules",
  "Consent Reminder Templates",
  "DNC Reminder Templates",
  "State Outreach Warnings",
  "Communication Log Settings",
  "Pipeline Stage Settings",
  "Pipeline Blocker Rules",
  "Outreach Audit Logs",
];

export default function AdminOutreachPage() {
  const templates = getOutreachTemplates();
  const blockedPhrases = getBlockedPhrases();
  const auditEvents = getCrmAuditEvents().filter((e) => e.relatedModule === "outreach" || e.relatedModule === "outreach_safety");
  const isDemo = isDemoMode();

  return (
    <AppShell
      title="SCS Nova Admin — Outreach Controls"
      subtitle="Master outreach templates, safety rules, and pipeline settings"
      isAdmin
    >
      <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
        SCS Nova Super Admin only. Organization templates must pass Outreach Safety Guard.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_SECTIONS.map((s) => (
          <Card key={s}><CardContent className="py-4 text-sm font-medium text-slate-200">{s}</CardContent></Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Outreach Templates ({templates.length})</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Channel</th>
                <th className="pb-2 pr-4">Tone</th>
                <th className="pb-2">Safety</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-slate-800">
                  <td className="py-2 pr-4 text-slate-200">{t.templateName}</td>
                  <td className="py-2 pr-4 text-slate-400">{t.channel}</td>
                  <td className="py-2 pr-4 text-slate-400">{t.tone}</td>
                  <td className="py-2"><SafetyStatusBadge status={t.safetyStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Blocked Language Rules</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {blockedPhrases.map((bp, i) => (
              <li key={i} className="rounded-lg border border-red-900/30 bg-red-900/10 p-3">
                <span className="font-medium text-red-300">&quot;{bp.phrase}&quot;</span>
                <p className="text-xs text-slate-400">{bp.reason}</p>
                <p className="text-xs text-emerald-400">Alternative: {bp.alternative}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isDemo && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Outreach Audit Logs (Demo)</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {auditEvents.map((e) => (
                <li key={e.id} className="text-slate-300">{e.eventDescription}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
