"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { DOCUMENT_CENTER_SECTIONS } from "@/lib/types/documents";
import type { DocumentCenterSection, DocumentRecord } from "@/lib/types/documents";
import {
  DocumentStatusBadge,
  AttorneyReviewBadge,
  SignatureStatusBadge,
  ReadinessBadge,
} from "./DocumentBadges";
import {
  getDocuments,
  getDocumentCenterOverview,
  getAttorneyReviewQueue,
  getLeadPackets,
  getStarterTemplates,
} from "@/lib/services/documents";
import { getDemoLeadsSummarySync } from "@/lib/services/crm";
import { useLeads } from "@/hooks/useLeads";
import {
  FileText, Shield, FolderOpen, Library, Scale,
  Filter, ChevronRight,
} from "lucide-react";

const SECTION_LABELS: Record<DocumentCenterSection, string> = {
  my_documents: "My Documents",
  state_deal_kit: "State Deal Kit Documents",
  lead_specific: "Lead-Specific Documents",
  seller: "Seller Documents",
  buyer_assignee: "Buyer / Assignee Documents",
  title_company: "Title Company Documents",
  internal_worksheets: "Internal Worksheets",
  compliance: "Compliance Documents",
  uploaded: "Uploaded Documents",
  signed: "Signed Documents",
  attorney_review_queue: "Attorney Review Queue",
  template_library: "SCS Nova Template Library",
};

interface DocumentCenterClientProps {
  isDemo: boolean;
}

export function DocumentCenterClient({ isDemo }: DocumentCenterClientProps) {
  const { leads: supabaseLeads } = useLeads();
  const [section, setSection] = useState<DocumentCenterSection>("my_documents");
  const [leadFilter, setLeadFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [attorneyFilter, setAttorneyFilter] = useState(false);

  const overview = useMemo(() => getDocumentCenterOverview(), [isDemo]);
  const leads = useMemo(() => {
    if (isDemo) return getDemoLeadsSummarySync();
    return supabaseLeads.map((l) => ({ id: l.id, propertyAddress: l.propertyAddress }));
  }, [isDemo, supabaseLeads]);
  const queue = useMemo(() => getAttorneyReviewQueue(), [isDemo]);
  const packets = useMemo(() => getLeadPackets(), [isDemo]);
  const templates = useMemo(() => getStarterTemplates(), []);

  const documents = useMemo(() => {
    return getDocuments({
      section: section === "template_library" ? undefined : section,
      leadId: leadFilter || undefined,
      state: stateFilter || undefined,
      status: statusFilter || undefined,
      attorneyReview: attorneyFilter || undefined,
    });
  }, [section, leadFilter, stateFilter, statusFilter, attorneyFilter, isDemo]);

  if (!isDemo) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-sky-700/40 bg-sky-900/20 px-4 py-3 text-sm text-sky-200">
          Fresh-start mode: Document Center is empty until you open a lead packet or generate documents from SCS Nova starter templates.
        </div>
        <EmptyState
          icon={FolderOpen}
          title="No documents created yet"
          description="Open a lead, select a state/deal type, and EstateLeadOS will build the required document checklist."
          primaryAction={{ label: "Open Lead Feed", href: "/lead-feed" }}
          learnHref="/guide"
          action={
            <Link href="/state-deal-kits" className="text-sm text-sky-400 hover:underline">
              Open State Deal Kits →
            </Link>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Library className="h-4 w-4 text-sky-400" />
              SCS Nova Starter Templates Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-400">
              {templates.length} workflow templates (checklists, worksheets, acknowledgements) — not legal advice.
            </p>
            <Link href="/admin/documents" className="text-sm text-sky-400 hover:underline">
              SCS Nova Admin → Template Library →
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
        <strong>Workflow tools only.</strong> Generated templates are not legal advice and are not legally sufficient. Attorney/title review tracking — not legal approval.
      </div>

      {/* Overview widgets */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard title="Total Documents" value={overview.totalDocuments} />
        <StatCard title="Not Started" value={overview.notStarted} />
        <StatCard title="Generated" value={overview.generated} />
        <StatCard title="Uploaded" value={overview.uploaded} />
        <StatCard title="Signed" value={overview.signed} />
        <StatCard title="Attorney Review" value={overview.needsAttorneyReview} />
        <StatCard title="Missing Required" value={overview.missingRequired} />
        <StatCard title="Packets Incomplete" value={overview.packetsIncomplete} />
        <StatCard title="Compliance Pending" value={overview.compliancePending} />
        <StatCard title="State Deal Kits" value={overview.stateDealKitsActive} />
      </div>

      {/* Section nav */}
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_CENTER_SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              section === s
                ? "border-sky-600 bg-sky-900/40 text-sky-200"
                : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
            }`}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-200"
          >
            <option value="">All Leads</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>{l.propertyAddress}</option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-200"
          >
            <option value="">All States</option>
            {["TX", "FL", "NC", "GA"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-200"
          >
            <option value="">All Statuses</option>
            {["not_started", "generated", "uploaded", "signed", "reviewed", "needs_attorney_review"].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" checked={attorneyFilter} onChange={(e) => setAttorneyFilter(e.target.checked)} />
            Attorney review flag
          </label>
        </CardContent>
      </Card>

      {/* Template Library section */}
      {section === "template_library" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-4 w-4 text-sky-400" />
              SCS Nova Template Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-400">
              {templates.length} starter workflow templates. Checklists and worksheets — not binding contracts.
            </p>
            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{t.templateName}</p>
                    <p className="text-xs text-slate-500">{t.purpose}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.attorneyReviewed ? (
                      <Badge variant="success">Attorney Reviewed</Badge>
                    ) : (
                      <Badge variant="warning">Review Recommended</Badge>
                    )}
                    <Badge variant="info">v{t.version}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/documents" className="mt-4 inline-flex items-center gap-1 text-sm text-sky-400 hover:underline">
              Open Template Builder <ChevronRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Attorney Review Queue */}
      {section === "attorney_review_queue" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-amber-400" />
              Attorney/Title Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">Tracking only — does not constitute legal approval.</p>
            {queue.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/documents/${item.documentRecordId}`} className="text-sm font-medium text-sky-300 hover:underline">
                      {item.documentName}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {item.stateAbbreviation} / {item.countyName} · {item.dealType.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-amber-300">{item.reviewReason}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={item.riskLevel === "high" ? "danger" : "warning"}>{item.riskLevel}</Badge>
                    <AttorneyReviewBadge status={item.reviewStatus} />
                  </div>
                </div>
                {item.notes && <p className="mt-2 text-xs text-slate-400">{item.notes}</p>}
                <Link href={`/leads/${item.leadId}`} className="mt-2 inline-block text-xs text-sky-400 hover:underline">
                  Open Lead →
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Document table */}
      {section !== "template_library" && section !== "attorney_review_queue" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-400" />
              {SECTION_LABELS[section]} ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500">No documents match current filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-xs text-slate-500">
                      <th className="pb-2 pr-4">Document</th>
                      <th className="pb-2 pr-4">Lead</th>
                      <th className="pb-2 pr-4">State</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Attorney</th>
                      <th className="pb-2 pr-4">Signature</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <DocumentRow key={doc.id} doc={doc} leads={leads} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lead packets summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-400" />
            Lead Document Packets — Document Workflow Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">Readiness score reflects workflow completeness — not legal compliance.</p>
          {packets.map((pkt) => {
            const lead = leads.find((l) => l.id === pkt.leadId);
            return (
              <div key={pkt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3">
                <div>
                  <Link href={`/leads/${pkt.leadId}`} className="text-sm font-medium text-sky-300 hover:underline">
                    {lead?.propertyAddress ?? pkt.leadId}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {pkt.stateAbbreviation} / {pkt.countyName} · {pkt.dealType.replace(/_/g, " ")}
                  </p>
                  {pkt.missingDocuments.length > 0 && (
                    <p className="mt-1 text-xs text-amber-300">
                      Missing: {pkt.missingDocuments.slice(0, 3).join(", ")}
                      {pkt.missingDocuments.length > 3 && ` +${pkt.missingDocuments.length - 3} more`}
                    </p>
                  )}
                </div>
                <ReadinessBadge score={pkt.readinessScore} band={pkt.readinessBand} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-600">{GLOBAL_DISCLAIMER}</p>
    </div>
  );
}

function DocumentRow({
  doc,
  leads,
}: {
  doc: DocumentRecord;
  leads: { id: string; propertyAddress: string }[];
}) {
  const lead = leads.find((l) => l.id === doc.leadId);
  return (
    <tr className="border-b border-slate-800/50">
      <td className="py-3 pr-4">
        <Link href={`/documents/${doc.id}`} className="font-medium text-sky-300 hover:underline">
          {doc.documentName}
        </Link>
        <p className="text-xs text-slate-500">{doc.documentCategory.replace(/_/g, " ")}</p>
      </td>
      <td className="py-3 pr-4 text-xs text-slate-400">
        {lead ? (
          <Link href={`/leads/${doc.leadId}`} className="hover:text-sky-300">{lead.propertyAddress}</Link>
        ) : "—"}
      </td>
      <td className="py-3 pr-4 text-xs text-slate-400">{doc.stateAbbreviation ?? "—"}</td>
      <td className="py-3 pr-4"><DocumentStatusBadge status={doc.status} /></td>
      <td className="py-3 pr-4">
        {doc.attorneyReviewFlag ? <AttorneyReviewBadge status={doc.attorneyReviewStatus} /> : <span className="text-xs text-slate-600">—</span>}
      </td>
      <td className="py-3 pr-4">
        {doc.signatureNeededFlag ? <SignatureStatusBadge status={doc.signatureStatus} /> : <span className="text-xs text-slate-600">—</span>}
      </td>
      <td className="py-3">
        <Link href={`/documents/${doc.id}`} className="text-xs text-sky-400 hover:underline">View</Link>
      </td>
    </tr>
  );
}
