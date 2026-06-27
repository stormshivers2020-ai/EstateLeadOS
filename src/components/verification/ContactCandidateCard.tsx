"use client";

import type { ContactCandidate } from "@/lib/types/verification";
import { CONTACT_STATUS_LABELS } from "@/lib/services/verification/constants";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "lucide-react";

interface ContactCandidateCardProps {
  contact: ContactCandidate;
  onApprove: () => void;
  onReject: () => void;
  onNeedsResearch: () => void;
}

export function ContactCandidateCard({
  contact,
  onApprove,
  onReject,
  onNeedsResearch,
}: ContactCandidateCardProps) {
  return (
    <div className="rounded-lg border border-slate-700/50 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-200 capitalize">
          {contact.contactType.replace(/_/g, " ")}
        </span>
        <Badge variant="info">{contact.confidenceScore}%</Badge>
        <Badge variant="default">
          {CONTACT_STATUS_LABELS[contact.verificationStatus]}
        </Badge>
      </div>
      <p className="mt-1 text-slate-300">{contact.contactValue}</p>
      {contact.personName && (
        <p className="text-xs text-slate-500">Linked to: {contact.personName}</p>
      )}
      {contact.notes && <p className="mt-1 text-xs text-slate-400">{contact.notes}</p>}
      {contact.sourceName && (
        <p className="mt-1 text-xs text-slate-500">Source: {contact.sourceName}</p>
      )}
      <div className="mobile-action-row mt-3">
        {contact.sourceUrl && (
          <a
            href={contact.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-sky-400 sm:px-2.5 sm:py-1 sm:text-xs"
          >
            <ExternalLink className="h-3 w-3" />
            Open Source
          </a>
        )}
        <button type="button" onClick={onApprove} className="touch-target rounded-lg bg-sky-600 px-3 py-2.5 text-sm text-white hover:bg-sky-500 sm:px-2.5 sm:py-1 sm:text-xs">
          Approve Contact
        </button>
        <button type="button" onClick={onReject} className="touch-target rounded-lg border border-slate-600 px-3 py-2.5 text-sm text-slate-300 sm:px-2.5 sm:py-1 sm:text-xs">
          Reject
        </button>
        <button type="button" onClick={onNeedsResearch} className="touch-target rounded-lg border border-slate-600 px-3 py-2.5 text-sm text-slate-300 sm:px-2.5 sm:py-1 sm:text-xs">
          Mark Needs Research
        </button>
      </div>
    </div>
  );
}
