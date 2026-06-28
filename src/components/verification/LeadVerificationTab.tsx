"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  VERIFICATION_DISCLAIMER,
  PERSON_ROLE_LABELS,
  CONTACT_STATUS_LABELS,
} from "@/lib/services/verification/constants";
import type { LeadVerificationBundle } from "@/lib/types/verification";
import type { RequiredDocument } from "@/lib/types/program";
import { ProofChainTimeline } from "./ProofChainTimeline";
import { EvidenceCard } from "./EvidenceCard";
import { PropertyVisualPanel } from "./PropertyVisualPanel";
import { ContactCandidateCard } from "./ContactCandidateCard";
import { RequiredDocumentChecklist } from "./RequiredDocumentChecklist";
import { RejectedSourcesPanel } from "./RejectedSourcesPanel";
import { GOVERNMENT_STATUS_LABELS } from "@/lib/types/government";
import { GOVERNMENT_PROOF_DISCLAIMER, INVALID_PROOF_SOURCE_NOTE } from "@/lib/constants/required-packet-items";
import { discoverRequiredDocuments } from "@/lib/services/program/client-document-discovery";
import { getLocalState } from "@/lib/local/localStateStore";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { ShieldAlert, Landmark, Loader2 } from "lucide-react";

interface LeadVerificationTabProps {
  leadId: string;
  initialBundle: LeadVerificationBundle | null;
}

export function LeadVerificationTab({ leadId, initialBundle }: LeadVerificationTabProps) {
  const [bundle, setBundle] = useState(initialBundle);
  const [documents, setDocuments] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const rejected = getLocalState().rejectedSources?.slice(0, 10) ?? [];

  const runDiscovery = useCallback(async () => {
    setDiscovering(true);
    try {
      const result = await discoverRequiredDocuments(leadId);
      setDocuments(result.governmentProofDocuments);
    } finally {
      setDiscovering(false);
    }
  }, [leadId]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/verification`);
      const data = await res.json();
      setBundle(data.bundle ?? null);
      await runDiscovery();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialBundle) void runDiscovery();
  }, [initialBundle, runDiscovery]);

  async function personAction(personId: string, action: "approve" | "reject" | "needs_research") {
    await fetch(`/api/leads/${leadId}/verification/persons/${personId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await refresh();
  }

  async function contactAction(contactId: string, action: "approve" | "reject" | "needs_research") {
    await fetch(`/api/leads/${leadId}/verification/contacts/${contactId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await refresh();
  }

  async function leadAction(action: "approve" | "reject" | "needs_research") {
    await fetch(`/api/leads/${leadId}/verification/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await refresh();
  }

  if (!bundle) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center text-sm text-slate-400">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            {APP_NAME} · Powered by {POWERED_BY}
          </p>
          <p>No government evidence yet. Run Government Pipeline — only official public-record sources create lead proof.</p>
          <p className="text-xs text-amber-200/80">{INVALID_PROOF_SOURCE_NOTE}</p>
        </CardContent>
      </Card>
    );
  }

  const govStatus = bundle.governmentStatus ?? "unverified";
  const govEval = bundle.governmentEvaluation;
  const canVerify = govEval?.canVerify ?? false;
  const certaintyScore = bundle.evidenceSources[0]?.matchedFields?.source_certainty_score;
  const fetchMethod = bundle.evidenceSources[0]?.matchedFields?.fetch_method;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-sky-800/40 bg-sky-950/20 px-4 py-3 text-xs text-sky-200/90">
        <p className="font-medium text-sky-200">{GOVERNMENT_PROOF_DISCLAIMER}</p>
        <p className="mt-1 text-slate-400">
          A lead cannot be called verified without completing the proof chain and manual review. EstateLeadOS does not
          auto-contact anyone.
        </p>
      </div>

      <Card className="border-sky-800/40">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <Landmark className="h-4 w-4 text-sky-400" />
            Government Verification Status
            <Badge variant={canVerify ? "success" : "info"}>{GOVERNMENT_STATUS_LABELS[govStatus]}</Badge>
            {govEval?.proofChainComplete && (
              <Badge variant="success">Proof chain complete</Badge>
            )}
            {certaintyScore && (
              <Badge variant="info">Source certainty {certaintyScore}/100</Badge>
            )}
            {fetchMethod === "live_http" && <Badge variant="success">Live .gov fetch</Badge>}
            {fetchMethod === "arcgis_api" && <Badge variant="success">ArcGIS live</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {govEval && govEval.missingRequirements.length > 0 && (
            <ul className="space-y-1 text-sm text-slate-400">
              {govEval.missingRequirements.map((m) => (
                <li key={m}>• Still needed: {m}</li>
              ))}
            </ul>
          )}
          {!canVerify && (
            <p className="text-xs text-amber-300">
              Lead is not verified — complete proof chain steps and manual review first. Not legal approval.
            </p>
          )}
          <div className="mobile-action-row">
            <ActionButton label="Approve Lead (Manual Review)" onClick={() => leadAction("approve")} variant="primary" />
            <ActionButton label="Reject Lead" onClick={() => leadAction("reject")} />
            <ActionButton label="Mark Needs Research" onClick={() => leadAction("needs_research")} />
          </div>
        </CardContent>
      </Card>

      <RejectedSourcesPanel rejected={rejected} />

      <ProofChainTimeline steps={bundle.proofChain} evidenceSources={bundle.evidenceSources} />

      <RequiredDocumentChecklist
        documents={documents}
        evidenceSources={bundle.evidenceSources}
        onRefresh={runDiscovery}
        loading={discovering}
      />

      <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-4 py-3 text-sm text-amber-100">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{VERIFICATION_DISCLAIMER}</p>
        </div>
      </div>

      {bundle.persons.map((person) => (
        <Card key={person.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {person.personName}
              <Badge variant="info">{PERSON_ROLE_LABELS[person.roleLabel]}</Badge>
              <Badge variant="default">{person.confidenceScore}% confidence</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">{person.connectionRationale}</p>
            <p className="text-xs text-slate-500">
              Status: {person.verificationStatus.replace(/_/g, " ")}
              {person.approvedAt && ` — approved ${new Date(person.approvedAt).toLocaleString()}`}
            </p>
            <div className="mobile-action-row">
              <ActionButton label="Approve Person" onClick={() => personAction(person.id, "approve")} variant="primary" />
              <ActionButton label="Reject Person" onClick={() => personAction(person.id, "reject")} />
              <ActionButton label="Mark Needs Research" onClick={() => personAction(person.id, "needs_research")} />
            </div>
          </CardContent>
        </Card>
      ))}

      <div>
        <h3 className="mb-1 text-sm font-medium text-slate-200">Evidence Source Cards</h3>
        <p className="mb-3 text-xs text-slate-500">Every claim must have a citation from an official or attached source.</p>
        <div className="space-y-3">
          {bundle.evidenceSources.map((source) => (
            <EvidenceCard key={source.id} source={source} id={`evidence-${source.id}`} />
          ))}
        </div>
      </div>

      <PropertyVisualPanel media={bundle.propertyMedia} />

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-200">Contact Candidates (Separate from Verified Proof)</h3>
        <p className="mb-3 text-xs text-slate-500">
          Low-confidence contact enrichment only — people-search cannot verify a lead. EstateLeadOS does not auto-contact
          anyone.
        </p>
        {bundle.contactCandidates.length === 0 ? (
          <p className="text-sm text-slate-400">No contact candidates extracted yet.</p>
        ) : (
          <div className="space-y-3">
            {bundle.contactCandidates.map((contact) => (
              <ContactCandidateCard
                key={contact.id}
                contact={contact}
                onApprove={() => contactAction(contact.id, "approve")}
                onReject={() => contactAction(contact.id, "reject")}
                onNeedsResearch={() => contactAction(contact.id, "needs_research")}
              />
            ))}
          </div>
        )}
      </div>

      {bundle.actionLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification Action Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {bundle.actionLogs.slice(0, 10).map((log) => (
                <li key={log.id} className="flex flex-col gap-1 text-slate-300 sm:flex-row sm:justify-between">
                  <span className="min-w-0 break-words">
                    {log.actorUserName ?? "Operator"} — {log.actionType.replace(/_/g, " ")}
                    {log.contactMethod && ` (${log.contactMethod})`}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(loading || discovering) && (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          {loading ? "Refreshing evidence…" : "Running document discovery…"}
        </p>
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "default";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === "primary"
          ? "touch-target w-full rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-sky-500 sm:w-auto sm:py-1.5 sm:text-xs"
          : "touch-target w-full rounded-lg border border-slate-600 px-3 py-2.5 text-sm text-slate-300 hover:border-slate-500 sm:w-auto sm:py-1.5 sm:text-xs"
      }
    >
      {label}
    </button>
  );
}

export { CONTACT_STATUS_LABELS };
