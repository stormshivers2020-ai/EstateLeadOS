import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { OrganizationSettingsClient } from "@/components/admin/OrganizationSettingsClient";
import { LocalDevControlPanel } from "@/components/settings/LocalDevControlPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { USER_ROLES } from "@/lib/constants/roles";
import { isDemoMode } from "@/lib/config/app-mode";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { getSessionContext } from "@/lib/config/session";

export default function SettingsPage() {
  const demo = isDemoMode();
  const local = isLocalPreviewMode();
  const session = getSessionContext();

  return (
    <AppShell
      title="Settings"
      subtitle="SCS Nova production configuration"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Operator</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-200">{session.userName}</span>
            <Badge variant="success">SCS Nova Production</Badge>
            <Badge variant="info">{session.organizationName}</Badge>
            {local && <Badge variant="warning">Local data store</Badge>}
            {demo && <Badge variant="info">Demo dataset</Badge>}
          </CardContent>
        </Card>

        <LocalDevControlPanel />
        <OrganizationSettingsClient />

        <Card>
          <CardHeader><CardTitle>Roles Reference</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {USER_ROLES.map((role) => (
                <li key={role.id} className="border-b border-slate-700/40 pb-3 last:border-0">
                  <p className="text-sm font-medium text-slate-200">{role.name}</p>
                  <p className="text-xs text-slate-400">{role.description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Legal &amp; Support</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <Link href="/disclaimer" className="text-sky-400 hover:underline">Compliance Disclaimer</Link>
            <Link href="/terms" className="text-sky-400 hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link>
            <Link href="/guide" className="text-sky-400 hover:underline">User Guide</Link>
            <Link href="/support" className="text-sky-400 hover:underline">Support</Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
