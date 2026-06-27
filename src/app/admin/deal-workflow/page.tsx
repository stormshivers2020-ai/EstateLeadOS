import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getBuyerOutreachTemplates, checkBuyerOutreachSafety } from "@/lib/services/buyers";
import { isDemoMode } from "@/lib/config/app-mode";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { Settings, Shield } from "lucide-react";

const ADMIN_SECTIONS = [
  "Deal Calculator Settings",
  "Deal Potential Scoring Rules",
  "Buyer Match Rules",
  "Buyer Network Controls",
  "Assignment Stage Settings",
  "Assignment Workflow Blockers",
  "Buyer Outreach Templates",
  "Assignment Risk Warnings",
  "Report Metric Settings",
];

const DEFAULTS = [
  { label: "Default Investor Discount", value: "70%" },
  { label: "Default Holding Costs", value: "$4,500" },
  { label: "Default Closing Costs", value: "$6,000" },
  { label: "POF Required for Assignment", value: "Recommended" },
  { label: "Assignment Tracking per Plan", value: "Phase 7 placeholder" },
];

export default function AdminDealWorkflowPage() {
  const isDemo = isDemoMode();
  const templates = getBuyerOutreachTemplates();

  return (
    <AppShell
      title="SCS Nova Admin — Deal Workflow Controls"
      subtitle="Master scoring, matching, assignment, and buyer outreach settings"
      isAdmin
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          SCS Nova Super Admin only. Organization users cannot edit master deal workflow logic.
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_SECTIONS.map((section) => (
            <Card key={section}>
              <CardContent className="flex items-center gap-3 py-4">
                <Settings className="h-5 w-5 text-sky-400" />
                <span className="text-sm font-medium text-slate-200">{section}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Default Assumptions</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {DEFAULTS.map((d) => (
              <div key={d.label} className="rounded border border-slate-800 px-3 py-2 text-sm">
                <p className="text-slate-500">{d.label}</p>
                <p className="text-slate-200">{d.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-400" />
              Buyer Outreach Templates ({templates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">Contract-interest language only — must pass Outreach Safety Guard.</p>
            {templates.map((t) => {
              const safety = checkBuyerOutreachSafety(t.body);
              return (
                <div key={t.id} className="rounded border border-slate-700/50 px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-200">{t.templateName}</span>
                    <span className={`text-xs ${safety.blocked ? "text-red-400" : "text-emerald-400"}`}>
                      {safety.safetyStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t.category} · {t.channel}</p>
                  {t.assignmentRiskReminderFlag && <p className="text-xs text-amber-400">Assignment risk reminder required</p>}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {isDemo && (
          <Card>
            <CardHeader><CardTitle>Deal Workflow Audit Logs</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-400">
              Demo audit events available from Assignment Detail and Deal Calculator history.
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-slate-600">{GLOBAL_DISCLAIMER}</p>
      </div>
    </AppShell>
  );
}
