"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import {
  OrgStatusBadge, LicenseStatusBadge,
  HealthStatusBadge, TicketStatusBadge, AuditSeverityBadge, WhiteLabelBadge,
} from "./AdminBadges";
import { PermissionDenied } from "./PermissionDenied";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { ADMIN_SECTIONS, type AdminSection } from "@/lib/types/platform";
import { getSessionContext } from "@/lib/config/session";
import { checkAdminAccess } from "@/lib/services/admin";
import {
  getAdminOverview, getOrganizations, getPlatformUsers,
  getMarketLicenses, getUsageRecords, getWhiteLabelSettings,
  getApiKeys, getSupportTickets, getPlatformAuditLogs, getSystemHealth, getScsNovaSettings,
  getAdminReports,
} from "@/lib/services/admin";
import { ScsNovaBrand } from "@/components/brand/ScsNovaBrand";
import { AdminAutomationMonitor } from "@/components/automation/AdminAutomationMonitor";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ShieldCheck, AlertTriangle } from "lucide-react";

const SECTION_LABELS: Record<AdminSection, string> = {
  overview: "Overview", users: "Users", organizations: "Organizations",
  states: "States", counties: "Counties",
  data_sources: "Data Sources", lead_rules: "Lead Rules", compliance_rules: "Compliance Rules",
  document_templates: "Document Templates", outreach_templates: "Outreach Templates",
  buyer_network_controls: "Buyer Network Controls", api_keys: "API Keys",
  audit_logs: "Audit Logs", support_tickets: "Support Tickets", white_label: "White Label",
  system_health: "System Health", scs_nova_settings: "SCS Nova Settings",
};

interface AdminConsoleClientProps { isDemo: boolean }

export function AdminConsoleClient({ isDemo }: AdminConsoleClientProps) {
  const [section, setSection] = useState<AdminSection>("overview");
  const session = getSessionContext();
  const access = checkAdminAccess(section, session.role);

  if (!isDemo) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="SCS Nova Admin Console"
        description="Fresh-start mode: configure organizations and market licenses. Demo mode loads sample admin data."
        action={<p className="text-xs text-slate-500">Set NEXT_PUBLIC_DEMO_MODE=true for sample admin data.</p>}
      />
    );
  }

  if (!access.allowed && section !== "overview") {
    return <PermissionDenied />;
  }

  const overview = getAdminOverview();

  return (
    <div className="space-y-6">
      <div className="premium-panel rounded-xl border-[rgba(214,168,79,0.2)] p-5">
        <ScsNovaBrand variant="admin" />
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--nova-gold)]">SCS Nova Control Layer</p>
        <p className="mt-3 text-sm text-[var(--nova-text-secondary)]">
          Master control room for platform governance, organization oversight, source approval, template governance, and system health.
        </p>
      </div>

      <AdminRiskStrip overview={overview} />

      <div className="rounded-lg border border-[rgba(77,163,255,0.2)] bg-[rgba(77,163,255,0.06)] px-4 py-3 text-sm text-[var(--nova-text-secondary)]">
        Platform licensing and organization isolation enforced through SCS Nova governance.
      </div>

      <div className="flex flex-wrap gap-2">
        {ADMIN_SECTIONS.map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${section === s ? "border-[rgba(214,168,79,0.4)] bg-[var(--nova-gold-muted)] text-[var(--nova-gold-soft)]" : "border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:border-[var(--nova-border-strong)]"}`}>
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {section === "overview" && <OverviewSection overview={overview} />}
      {section === "users" && <UsersSection />}
      {section === "organizations" && <OrganizationsSection />}
      {section === "states" && <StatesSection />}
      {section === "counties" && <CountiesSection />}
      {section === "data_sources" && <LinkSection title="Data Sources" href="/admin/compliance" desc="Connector permissions, source compliance, and data source health" />}
      {section === "lead_rules" && <PlaceholderSection title="Lead Rules" items={["Lead type classification", "Score weight overrides", "Signal thresholds", "Nationwide lead rules"]} />}
      {section === "compliance_rules" && <LinkSection title="Compliance Rules" href="/admin/compliance" desc="State/county compliance rules, risk ratings, workflow blockers" />}
      {section === "document_templates" && <LinkSection title="Document Templates" href="/admin/documents" desc="SCS Nova master template library and document rules" />}
      {section === "outreach_templates" && <LinkSection title="Outreach Templates" href="/admin/outreach" desc="Seller outreach templates and safety rules" />}
      {section === "buyer_network_controls" && <LinkSection title="Buyer Network Controls" href="/admin/deal-workflow" desc="Buyer match rules and buyer outreach templates" />}
      {section === "api_keys" && <ApiKeysSection />}
      {section === "audit_logs" && <AuditSection />}
      {section === "support_tickets" && <TicketsSection />}
      {section === "white_label" && <WhiteLabelSection />}
      {section === "system_health" && <HealthSection />}
      {section === "scs_nova_settings" && <SettingsSection />}

      <p className="text-xs text-slate-600">{GLOBAL_DISCLAIMER}</p>
    </div>
  );
}

function AdminRiskStrip({ overview }: { overview: ReturnType<typeof getAdminOverview> }) {
  const risks = [
    { label: "Failed pulls", count: overview.failedDataPulls, variant: "danger" as const },
    { label: "Compliance blockers", count: overview.complianceBlockersActive, variant: "warning" as const },
    { label: "Open tickets", count: overview.supportTicketsOpen, variant: "info" as const },
    { label: "White-label pending", count: Math.max(0, overview.whiteLabelClientsActive - 1), variant: "default" as const },
  ].filter((r) => r.count > 0);

  if (risks.length === 0) return null;

  return (
    <Card className="border-amber-800/30">
      <CardContent className="flex flex-wrap items-center gap-3 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-medium text-slate-400">Admin risk indicators:</span>
        {risks.map((r) => (
          <Badge key={r.label} variant={r.variant}>{r.label}: {r.count}</Badge>
        ))}
      </CardContent>
    </Card>
  );
}

function OverviewSection({ overview }: { overview: ReturnType<typeof getAdminOverview> }) {
  const reports = getAdminReports();
  return (
    <div className="space-y-4">
      <SectionHeader title="Platform Overview" subtitle="Organization health, licensing, and operational metrics" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard title="Organizations" value={overview.totalOrganizations} subtitle={`${overview.activeOrganizations} active`} />
        <StatCard title="Users" value={overview.totalUsers} subtitle={`${overview.activeUsers} active`} />
        <StatCard title="SCS Nova Admins" value={overview.scsNovaAdmins} />
        <StatCard title="Trial Orgs" value={overview.trialOrganizations} />
        <StatCard title="Market Licenses" value={overview.marketLicensesActive} />
        <StatCard title="States Enabled" value={overview.statesEnabled} />
        <StatCard title="Counties Enabled" value={overview.countiesEnabled} />
        <StatCard title="Data Sources" value={overview.dataSourcesActive} />
        <StatCard title="Failed Pulls" value={overview.failedDataPulls} />
        <StatCard title="Compliance Blockers" value={overview.complianceBlockersActive} />
        <StatCard title="Docs Need Review" value={overview.documentsNeedingReview} />
        <StatCard title="Open Tickets" value={overview.supportTicketsOpen} />
        <StatCard title="White-Label Active" value={overview.whiteLabelClientsActive} />
        <StatCard title="System Health" value={overview.systemHealthStatus} />
      </div>
      <AdminAutomationMonitor />
      <Card>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {reports.organizationsByPlan.map((r) => (
            <div key={r.plan} className="flex justify-between border-b border-slate-800 py-1">
              <span className="text-slate-400">{r.plan}</span><span>{r.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function UsersSection() {
  const users = getPlatformUsers();
  return (
    <Card>
      <CardHeader><CardTitle>Users ({users.length})</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-700 text-left text-xs text-slate-500">
            <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Organization</th><th className="pb-2 pr-3">Role</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Last Login</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-800">
                <td className="py-2 pr-3"><p className="text-slate-200">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                <td className="py-2 pr-3 text-xs">{u.organizationName}</td>
                <td className="py-2 pr-3"><Badge variant="info">{u.role.replace(/_/g, " ")}</Badge></td>
                <td className="py-2 pr-3"><Badge variant={u.accountStatus === "active" ? "success" : "warning"}>{u.accountStatus}</Badge></td>
                <td className="py-2 text-xs text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function OrganizationsSection() {
  const orgs = getOrganizations();
  return (
    <Card>
      <CardHeader><CardTitle>Organizations ({orgs.length})</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-700 text-left text-xs text-slate-500">
            <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Users</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Markets</th>
          </tr></thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b border-slate-800">
                <td className="py-2 pr-3 text-slate-200">{o.organizationName}</td>
                <td className="py-2 pr-3 text-xs">{o.userCount}/{o.seatLimit}</td>
                <td className="py-2 pr-3"><OrgStatusBadge status={o.accountStatus} /></td>
                <td className="py-2 text-xs">{o.activeStates.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function StatesSection() {
  const licenses = getMarketLicenses().filter((l) => !l.county);
  const states = [...new Set(licenses.map((l) => l.state))];
  return (
    <Card>
      <CardHeader><CardTitle>States Enabled ({states.length})</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {states.map((s) => <Badge key={s} variant="info">{s}</Badge>)}
      </CardContent>
    </Card>
  );
}

function CountiesSection() {
  const licenses = getMarketLicenses().filter((l) => l.county);
  return (
    <Card>
      <CardHeader><CardTitle>County Licenses ({licenses.length})</CardTitle></CardHeader>
      <CardContent>
        {licenses.map((l) => (
          <div key={l.id} className="flex justify-between border-b border-slate-800 py-2 text-sm">
            <span>{l.state} / {l.county}</span>
            <LicenseStatusBadge status={l.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ApiKeysSection() {
  const keys = getApiKeys();
  return (
    <Card>
      <CardHeader><CardTitle>API Keys — Enterprise Placeholder</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-xs text-amber-300">Full keys never shown after creation. Hashed storage only.</p>
        {keys.map((k) => (
          <div key={k.id} className="rounded border border-slate-800 p-3">
            <div className="flex justify-between"><span className="text-slate-200">{k.keyName}</span><Badge variant={k.status === "active" ? "success" : "default"}>{k.status}</Badge></div>
            <p className="text-xs text-slate-500">{k.keyPrefix} · {k.organizationName}</p>
            <p className="text-xs text-slate-500">Permissions: {k.permissions.join(", ")} · Rate: {k.rateLimit}/hr</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AuditSection() {
  const logs = getPlatformAuditLogs();
  return (
    <Card>
      <CardHeader><CardTitle>Audit Logs — Append Only ({logs.length})</CardTitle></CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-slate-500">Normal users cannot edit audit logs.</p>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className="border-b border-slate-800 pb-2 text-xs">
              <div className="flex flex-wrap gap-2">
                <AuditSeverityBadge severity={l.severity} />
                <Badge variant="default">{l.eventCategory}</Badge>
                <span className="text-slate-500">{new Date(l.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-slate-300">{l.eventDescription}</p>
              <p className="text-slate-500">{l.userName} · {l.organizationName ?? "Platform"}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TicketsSection() {
  const tickets = getSupportTickets();
  return (
    <Card>
      <CardHeader><CardTitle>Support Tickets ({tickets.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {tickets.map((t) => (
          <div key={t.id} className="rounded border border-slate-800 p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium text-slate-200">{t.subject}</span>
              <TicketStatusBadge status={t.status} />
            </div>
            <p className="text-xs text-slate-500">{t.organizationName} · {t.issueType.replace(/_/g, " ")} · {t.priority}</p>
            <p className="mt-1 text-xs text-slate-400">{t.description}</p>
            {t.assignedAdminName && <p className="text-xs text-sky-400">Assigned: {t.assignedAdminName}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WhiteLabelSection() {
  const settings = getWhiteLabelSettings();
  return (
    <Card>
      <CardHeader><CardTitle>White Label Settings</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-amber-300">White-label cannot remove legal disclaimers or SCS Nova internal ownership.</p>
        {settings.map((w) => (
          <div key={w.id} className="rounded border border-slate-800 p-3">
            <div className="flex justify-between"><span className="text-slate-200">{w.organizationName}</span><WhiteLabelBadge enabled={w.enabled} approved={w.approvedByScsNova} /></div>
            {w.enabled && (
              <>
                <p className="text-xs text-slate-500">Subtitle: {w.appSubtitle} · Visibility: {w.poweredByScsNovaVisibility.replace(/_/g, " ")}</p>
                <p className="text-xs text-slate-500">Domain: {w.customDomainPlaceholder ?? "—"}</p>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HealthSection() {
  const health = getSystemHealth();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {health.map((h) => (
        <Card key={h.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-slate-200">{h.statusArea}</p>
              <p className="text-xs text-slate-500">{h.message}</p>
              {h.adminNote && <p className="text-xs text-amber-400">{h.adminNote}</p>}
            </div>
            <HealthStatusBadge status={h.status} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SettingsSection() {
  const s = getScsNovaSettings();
  return (
    <Card>
      <CardHeader><CardTitle>SCS Nova Platform Settings</CardTitle></CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Field label="Platform Name" value={s.platformName} />
        <Field label="Powered By" value={s.poweredByText} />
        <Field label="Demo Mode" value={s.demoModeEnabled ? "Enabled" : "Disabled"} />
        <Field label="Fresh-Start Mode" value={s.freshStartModeEnabled ? "Enabled" : "Disabled"} />
        <Field label="Maintenance Mode" value={s.maintenanceModeEnabled ? "ON" : "Off"} />
        <Field label="Support Email" value={s.defaultSupportEmailPlaceholder} />
        <Field label="Data Retention" value={s.defaultDataRetentionPlaceholder} />
        <div className="sm:col-span-2 rounded border border-amber-700/30 bg-amber-900/10 p-3">
          <p className="text-xs font-medium text-amber-300">Global Disclaimer (cannot be removed)</p>
          <p className="mt-1 text-xs text-slate-400">{s.globalDisclaimerText.slice(0, 200)}...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LinkSection({ title, href, desc }: { title: string; href: string; desc: string }) {
  return (
    <Card>
      <CardContent className="py-6">
        <p className="font-medium text-slate-200">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{desc}</p>
        <Link href={href} className="mt-3 inline-block text-sm text-sky-400 hover:underline">Open {title} →</Link>
      </CardContent>
    </Card>
  );
}

function PlaceholderSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <ul className="list-inside list-disc text-sm text-slate-400">
          {items.map((i) => <li key={i}>{i}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}
