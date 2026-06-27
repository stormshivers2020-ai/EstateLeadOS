"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import {
  GENERATED_DOCUMENT_WARNING,
  TEMPLATE_NOT_ATTORNEY_REVIEWED_WARNING,
  MISSING_VARIABLE_WARNING,
} from "@/lib/constants/document-variables";
import type { DocumentRecord } from "@/lib/types/documents";
import {
  DocumentStatusBadge,
  AttorneyReviewBadge,
  SignatureStatusBadge,
} from "./DocumentBadges";
import {
  getDocumentAuditLogs,
  getDocumentBlockers,
  getTemplateById,
} from "@/lib/services/documents";
import { AlertTriangle, ArrowLeft, FileText, History, Shield } from "lucide-react";

interface DocumentDetailClientProps {
  document: DocumentRecord;
  leadAddress?: string;
}

export function DocumentDetailClient({ document: doc, leadAddress }: DocumentDetailClientProps) {
  const template = doc.templateId ? getTemplateById(doc.templateId) : null;
  const auditLogs = getDocumentAuditLogs(doc.id);
  const blockers = doc.leadId ? getDocumentBlockers(doc.leadId).filter((b) => b.documentRecordId === doc.id) : [];

  return (
    <div className="space-y-6">
      <Link href="/documents" className="inline-flex items-center gap-1 text-sm text-sky-400 hover:underline">
        <ArrowLeft className="h-3 w-3" /> Back to Document Center
      </Link>

      <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
        {GENERATED_DOCUMENT_WARNING}
        {template && !template.attorneyReviewed && (
          <p className="mt-2">{TEMPLATE_NOT_ATTORNEY_REVIEWED_WARNING}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DocumentStatusBadge status={doc.status} />
        <AttorneyReviewBadge status={doc.attorneyReviewStatus} />
        {doc.signatureNeededFlag && <SignatureStatusBadge status={doc.signatureStatus} />}
        <Badge variant="info">{doc.requiredStatus.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-400" />
                {doc.documentName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Document Type" value={doc.documentTypeId.replace(/_/g, " ")} />
                <Field label="Category" value={doc.documentCategory.replace(/_/g, " ")} />
                <Field label="Lead" value={leadAddress ?? (doc.leadId ? doc.leadId : "—")} />
                <Field label="State / County" value={`${doc.stateAbbreviation ?? "—"} / ${doc.countyName ?? "—"}`} />
                <Field label="Deal Type" value={doc.dealType?.replace(/_/g, " ") ?? "—"} />
                <Field label="Workflow Stage" value={doc.workflowStage?.replace(/_/g, " ") ?? "—"} />
                <Field label="Version" value={`v${doc.version}`} />
                <Field label="Required Reason" value={doc.requiredReason ?? "—"} />
              </div>

              {doc.sourceFieldsUsed.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Source Fields Used</p>
                  <div className="flex flex-wrap gap-1">
                    {doc.sourceFieldsUsed.map((f) => (
                      <Badge key={f} variant="default">{`{{${f}}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {doc.status === "not_started" && (
                <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-xs text-red-200">
                  {MISSING_VARIABLE_WARNING}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {doc.generatedContentSnapshot ? (
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-xs text-slate-300">
                  {doc.generatedContentSnapshot}
                </pre>
              ) : doc.uploadedFileReference ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-sm text-slate-400">
                  Uploaded file: {doc.fileUrl ?? doc.uploadedFileReference}
                  <p className="mt-2 text-xs">File preview placeholder — secure storage integration pending.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No content generated yet. Generate from template to create draft.</p>
              )}
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">{doc.disclaimer || GLOBAL_DISCLAIMER}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Template info */}
          {template && (
            <Card>
              <CardHeader><CardTitle className="text-base">Template Used</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Field label="Template" value={template.templateName} />
                <Field label="Version" value={`v${doc.templateVersion ?? template.version}`} />
                <Field label="Review Status" value={template.reviewStatus.replace(/_/g, " ")} />
                {template.attorneyReviewed ? (
                  <Badge variant="success">Attorney Reviewed by SCS Nova</Badge>
                ) : (
                  <Badge variant="warning">Not Attorney Reviewed</Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions placeholder */}
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {["Generate from template", "Mark reviewed", "Mark needs attorney review", "Upload replacement", "Mark signed", "Mark not required", "Archive"].map((action) => (
                <button
                  key={action}
                  className="block w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-left text-xs text-slate-300 hover:border-sky-600 hover:text-sky-200"
                >
                  {action}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Blockers */}
          {blockers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Workflow Blockers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {blockers.map((b) => (
                  <div key={b.id} className="rounded border border-red-700/30 bg-red-900/10 p-2 text-xs text-red-200">
                    {b.blockerMessage}
                    <p className="mt-1 text-red-300/70">{b.requiredAction}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Audit trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-slate-400" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500">No audit events yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800 pb-2 text-xs">
                    <p className="text-slate-300">{log.actionDescription}</p>
                    <p className="text-slate-500">{log.userName} · {new Date(log.timestamp).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}
