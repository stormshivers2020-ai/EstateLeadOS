import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getDocumentTypes,
  getStarterTemplates,
  getDocumentVariables,
  getDocumentAuditLogs,
} from "@/lib/services/documents";
import { isDemoMode } from "@/lib/config/app-mode";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { FileText, Library, Variable, Shield, History } from "lucide-react";

const ADMIN_SECTIONS = [
  "Template Library",
  "Template Builder",
  "Document Types",
  "State Document Rules",
  "Deal Type Document Rules",
  "Required Document Templates",
  "Attorney Review Flags",
  "Signature Rules",
  "Variable Registry",
  "Disclaimer Templates",
  "Document Audit Logs",
  "Deprecated Templates",
];

export default function AdminDocumentsPage() {
  const isDemo = isDemoMode();
  const types = getDocumentTypes();
  const templates = getStarterTemplates();
  const variables = getDocumentVariables();
  const auditLogs = getDocumentAuditLogs();

  return (
    <AppShell
      title="SCS Nova Admin — Document Controls"
      subtitle="Master template library, document rules, and variable registry"
      isAdmin
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          SCS Nova Super Admin and authorized Compliance Reviewer roles only. Organization users cannot alter master document logic.
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_SECTIONS.map((section) => (
            <Card key={section}>
              <CardContent className="flex items-center gap-3 py-4">
                <Shield className="h-5 w-5 text-sky-400" />
                <span className="text-sm font-medium text-slate-200">{section}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-4 w-4 text-sky-400" />
              SCS Nova Template Library ({templates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-400">
              Starter workflow templates — checklists, worksheets, acknowledgements. Not legal advice.
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded border border-slate-700/50 px-3 py-2 text-sm">
                  <div>
                    <span className="text-slate-200">{t.templateName}</span>
                    <span className="ml-2 text-xs text-slate-500">{t.category.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={t.active ? "success" : "default"}>{t.reviewStatus.replace(/_/g, " ")}</Badge>
                    {t.attorneyReviewed ? (
                      <Badge variant="success">Attorney Reviewed</Badge>
                    ) : (
                      <Badge variant="warning">Needs Review</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Builder preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-400" />
              Template Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">
              Create, edit, duplicate, version, and archive SCS Nova master templates.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Create template", "Edit template", "Duplicate template", "Version template", "Preview template", "Insert variables", "Validate variables", "Mark attorney review", "Activate/deactivate", "View usage", "View audit history"].map((action) => (
                <button key={action} className="rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-left text-xs text-slate-300 hover:border-sky-600">
                  {action}
                </button>
              ))}
            </div>
            {isDemo && templates[0] && (
              <div className="mt-4 rounded border border-slate-700 bg-slate-900/50 p-3">
                <p className="text-xs font-medium text-slate-400">Sample template body — {templates[0].templateName}</p>
                <pre className="mt-2 max-h-32 overflow-auto text-xs text-slate-500">{templates[0].body.slice(0, 400)}...</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Types */}
        <Card>
          <CardHeader>
            <CardTitle>Document Types ({types.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 space-y-1 overflow-y-auto text-sm">
              {types.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-slate-800 py-1.5">
                  <span className="text-slate-300">{t.name}</span>
                  <div className="flex gap-1">
                    <Badge variant="default">{t.requirementLogic}</Badge>
                    {t.attorneyReviewFlag && <Badge variant="warning">Attorney</Badge>}
                    {t.signatureNeededFlag && <Badge variant="info">Signature</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Variable Registry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Variable className="h-4 w-4 text-sky-400" />
              Variable Registry ({variables.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {variables.map((v) => (
                <div key={v.id} className="rounded border border-slate-800 px-3 py-2 text-xs">
                  <code className="text-sky-300">{`{{${v.variableName}}}`}</code>
                  <p className="text-slate-500">{v.label} · {v.sourceModule}</p>
                  {v.required && <Badge variant="warning" className="mt-1">Required</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        {isDemo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Document Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-b border-slate-800 pb-2 text-xs">
                  <p className="text-slate-300">{log.actionDescription}</p>
                  <p className="text-slate-500">{log.userName} · {new Date(log.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-slate-600">{GLOBAL_DISCLAIMER}</p>
      </div>
    </AppShell>
  );
}
