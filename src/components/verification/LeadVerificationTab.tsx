"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  VERIFICATION_DISCLAIMER,
  PERSON_ROLE_LABELS,
  CONTACT_STATUS_LABELS,
} from "@/lib/services/verification/constants";
import type { LeadVerificationBundle } from "@/lib/types/verification";
import { ProofChainTimeline } from "./ProofChainTimeline";
import { EvidenceCard } from "./EvidenceCard";
import { PropertyVisualPanel } from "./PropertyVisualPanel";
import { ContactCandidateCard } from "./ContactCandidateCard";
import { ShieldAlert } from "lucide-react";

interface LeadVerificationTabProps {
  leadId: string;
  initialBundle: LeadVerificationBundle | null;
}

export function LeadVerificationTab({ leadId, initialBundle }: LeadVerificationTabProps) {
  const [bundle, setBundle] = useState(initialBundle);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/verification`);
      const data = await res.json();
      setBundle(data.bundle ?? null);
    } finally {
      setLoading(false);
    }
  }

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

  if (!bundle) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-400">
          No verification evidence yet. Run internet search or attach source records — evidence is saved when search results are queued or approved.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

      <ProofChainTimeline steps={bundle.proofChain} evidenceSources={bundle.evidenceSources} />

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-200">Linked Source Cards</h3>
        <div className="space-y-3">
          {bundle.evidenceSources.map((source) => (
            <EvidenceCard key={source.id} source={source} />
          ))}
        </div>
      </div>

      <PropertyVisualPanel media={bundle.propertyMedia} />

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-200">Contact Candidates</h3>
        <p className="mb-3 text-xs text-slate-500">
          EstateLeadOS does not auto-contact anyone. Review confidence and sources before manual outreach.
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
          <CardHeader><CardTitle className="text-base">Verification Action Log</CardTitle></CardHeader>
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

      {loading && <p className="text-xs text-slate-500">Refreshing evidence…</p>}
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
