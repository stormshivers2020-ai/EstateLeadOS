"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getRuntimeConfig, isLocalPreviewMode } from "@/lib/config/runtime";
import { isDemoMode } from "@/lib/config/app-mode";
import { getSessionContext } from "@/lib/config/session";
import {
  resetDemoData,
  clearLocalData,
  simulateComplianceBlocker,
  simulateDocumentBlocker,
  exportLocalStateJsonPlaceholder,
} from "@/lib/local/localSeedManager";
import { loginAsRole, LOCAL_PREVIEW_USERS } from "@/lib/local/localAuth";
import { simulateConnectorRun } from "@/lib/services/connector-simulation";
import { importCsvLocally, getSampleCsvContent } from "@/lib/services/csv-import";
import type { UserRoleId } from "@/lib/constants/roles";
import { Sparkles } from "lucide-react";

export function LocalDevControlPanel() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const runtime = getRuntimeConfig();
  const session = getSessionContext();

  if (!isLocalPreviewMode()) return null;

  function notify(text: string) {
    setMessage(text);
    router.refresh();
  }

  return (
    <Card className="border-[rgba(214,168,79,0.25)] bg-gradient-to-br from-[var(--nova-gold-muted)]/10 to-[var(--nova-panel)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--nova-gold)]" />
          SCS Nova Local Dev Control Panel
          <Badge variant="gold">Local Preview</Badge>
        </CardTitle>
        <p className="text-xs text-[var(--nova-text-muted)]">
          You are viewing EstateLeadOS on a local data store. Connect Supabase when you are ready for persistent cloud storage.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="grid gap-2 text-xs text-[var(--nova-text-muted)] sm:grid-cols-2">
          <div>Data provider: <span className="text-[var(--nova-text-secondary)]">{runtime.dataProvider}</span></div>
          <div>Mode: <span className="text-[var(--nova-text-secondary)]">{isDemoMode() ? "Demo" : "Fresh Start"}</span></div>
          <div>Role: <span className="text-[var(--nova-text-secondary)]">{session.role.replace(/_/g, " ")}</span></div>
          <div>Organization: <span className="text-[var(--nova-text-secondary)]">{session.organizationName}</span></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { resetDemoData(); notify("Demo data reset."); }} className="nova-btn-primary px-3 py-1.5 text-xs">Reset Demo Data</button>
          <button type="button" onClick={() => { clearLocalData(); notify("Local data cleared."); }} className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs text-[var(--nova-text-secondary)] hover:border-[var(--nova-border-strong)]">Clear Local Data</button>
          <button type="button" onClick={() => { const r = importCsvLocally(getSampleCsvContent()); notify(`Imported ${r.imported} leads.`); }} className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs text-[var(--nova-text-secondary)]">Import Sample CSV</button>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(exportLocalStateJsonPlaceholder()); notify("Local state JSON copied to clipboard."); }} className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs text-[var(--nova-text-secondary)]">Export Local State JSON</button>
        </div>

        <div>
          <p className="nova-label mb-2">Switch Role</p>
          <div className="flex flex-wrap gap-2">
            {LOCAL_PREVIEW_USERS.map((u) => (
              <button key={u.id} type="button" onClick={() => { loginAsRole(u.role as UserRoleId); notify(`Switched to ${u.role}`); }} className="rounded border border-[var(--nova-border)] px-2 py-1 text-xs text-[var(--nova-text-muted)] hover:border-[var(--nova-gold)] hover:text-[var(--nova-gold-soft)]">{u.role.replace(/_/g, " ")}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="nova-label mb-2">Simulate Connector Run</p>
          <div className="flex flex-wrap gap-2">
            {(["success", "blocked", "failed", "credentials_missing", "county_unsupported", "no_records"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { simulateConnectorRun(t); notify(`Connector: ${t}`); }} className="rounded border border-[var(--nova-border)] px-2 py-1 text-xs text-[var(--nova-text-muted)] hover:border-[var(--nova-blue)]">{t}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="nova-label mb-2">Simulate Workflow Blockers</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { simulateComplianceBlocker(); notify("Compliance blocker simulated."); }} className="rounded border border-[var(--nova-border)] px-2 py-1 text-xs text-[var(--nova-text-muted)] hover:border-[var(--nova-orange)]">Compliance Blocker</button>
            <button type="button" onClick={() => { simulateDocumentBlocker(); notify("Document blocker simulated."); }} className="rounded border border-[var(--nova-border)] px-2 py-1 text-xs text-[var(--nova-text-muted)] hover:border-[var(--nova-orange)]">Document Blocker</button>
          </div>
        </div>

        {message && <p className="text-xs text-[var(--nova-green)]">{message}</p>}
      </CardContent>
    </Card>
  );
}
