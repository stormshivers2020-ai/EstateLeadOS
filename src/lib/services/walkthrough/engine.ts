import type {
  LeadWalkthroughSession,
  StepValidationResult,
  WalkthroughEvidenceSummary,
  WalkthroughStepData,
  WalkthroughStepId,
} from "@/lib/types/walkthrough";
import { WALKTHROUGH_STEP_ORDER } from "@/lib/types/walkthrough";
import { getFullLeadByIdSync } from "@/lib/services/crm";

export function getNextStep(step: WalkthroughStepId): WalkthroughStepId | null {
  const idx = WALKTHROUGH_STEP_ORDER.indexOf(step);
  if (idx < 0 || idx >= WALKTHROUGH_STEP_ORDER.length - 1) return null;
  return WALKTHROUGH_STEP_ORDER[idx + 1];
}

export function getPreviousStep(step: WalkthroughStepId): WalkthroughStepId | null {
  const idx = WALKTHROUGH_STEP_ORDER.indexOf(step);
  if (idx <= 0) return null;
  return WALKTHROUGH_STEP_ORDER[idx - 1];
}

function hasText(v: string | undefined | null): boolean {
  return Boolean(v?.trim());
}

export function validateStep(step: WalkthroughStepId, data: WalkthroughStepData, leadId: string | null): StepValidationResult {
  const missing: string[] = [];

  switch (step) {
    case "start": {
      const s = data.start;
      if (!hasText(s?.estateName)) missing.push("Estate / lead name");
      if (!hasText(s?.county)) missing.push("County");
      if (!hasText(s?.state)) missing.push("State");
      if (s?.createNew === false && !leadId && !hasText(s?.selectedLeadId)) {
        missing.push("Select a lead from the list");
      }
      break;
    }
    case "source_discovery": {
      const sources = data.source_discovery?.sources ?? [];
      if (sources.length === 0) missing.push("At least one source");
      else {
        const last = sources[sources.length - 1];
        if (!hasText(last.sourceType)) missing.push("Source type on latest source");
        if (!hasText(last.confidence)) missing.push("Source confidence");
        if (!hasText(last.url) && !hasText(last.evidenceFileName)) missing.push("Source URL or uploaded evidence");
      }
      break;
    }
    case "death_probate": {
      const d = data.death_probate;
      if (!d?.verificationStatus) missing.push("Verification status");
      if (!hasText(d?.citation)) missing.push("Source citation");
      if (!hasText(d?.notes)) missing.push("Evidence notes");
      if (d?.verificationStatus === "not_verified" && !d.notVerifiedAction) {
        missing.push("Choose continue as research lead or reject lead");
      }
      break;
    }
    case "property_verification": {
      const p = data.property_verification;
      if (!hasText(p?.propertyAddress) && !hasText(p?.parcelId)) missing.push("Property address or parcel ID");
      if (!hasText(p?.sourceCitation)) missing.push("Property source citation");
      if (!hasText(p?.connectionNotes)) missing.push("Ownership / connection notes");
      if (!p?.confidence) missing.push("Property confidence score");
      break;
    }
    case "property_media": {
      const m = data.property_media;
      const items = m?.media ?? [];
      if (!m?.mediaUnavailable && items.length === 0) missing.push("At least one media item or mark unavailable");
      if (m?.mediaUnavailable && !hasText(m.unavailableReason)) missing.push("Reason media is unavailable");
      if (!m?.mediaUnavailable) {
        const valid = items.some((i) => hasText(i.caption) && hasText(i.source));
        if (!valid) missing.push("Media caption and source on at least one item");
      }
      if (!hasText(m?.visibilityNotes)) missing.push("Property visibility notes");
      break;
    }
    case "heir_discovery": {
      const h = data.heir_discovery;
      if (!h?.contactNotFound) {
        const contacts = h?.contacts ?? [];
        if (contacts.length === 0) missing.push("At least one contact candidate or mark not found");
        else {
          const c = contacts[contacts.length - 1];
          if (!hasText(c.name)) missing.push("Contact name");
          if (!hasText(c.contactType)) missing.push("Contact type");
          if (!hasText(c.confidence)) missing.push("Contact confidence label");
          if (!hasText(c.evidenceNotes)) missing.push("Evidence / source notes");
        }
      } else if (!hasText(h.notFoundNotes)) {
        missing.push("Notes explaining contact not found");
      }
      break;
    }
    case "contact_path": {
      const c = data.contact_path;
      if (!c?.noContactFound) {
        const hasMethod =
          hasText(c?.phone) || hasText(c?.email) || hasText(c?.mailingAddress) || hasText(c?.attorneyContact);
        if (!hasMethod) missing.push("Phone, email, mailing address, or attorney contact");
      } else if (!hasText(c?.noContactReason)) {
        missing.push("Reason no contact method was found");
      }
      if (!c?.complianceAcknowledged) missing.push("Confirm contact data is not guaranteed unless verified");
      break;
    }
    case "lead_qualification": {
      const q = data.lead_qualification;
      if (!q?.decision) missing.push("Lead decision (pursue / hold / reject)");
      if (!hasText(q?.reason)) missing.push("Decision reason");
      if (q?.score === undefined || q.score === null || Number.isNaN(q.score)) missing.push("Lead score");
      break;
    }
    case "deal_value": {
      const d = data.deal_value;
      if (d?.arvLow === undefined || d.arvLow <= 0) missing.push("Estimated ARV low range");
      if (d?.arvHigh === undefined || d.arvHigh <= 0) missing.push("Estimated ARV high range");
      if (d?.offerLow === undefined) missing.push("Estimated offer low");
      if (d?.offerHigh === undefined) missing.push("Estimated offer high");
      if (d?.assignmentFeeTarget === undefined) missing.push("Assignment fee target");
      if (!hasText(d?.riskNotes)) missing.push("Risk notes");
      if (!d?.estimatesAcknowledged) missing.push("Confirm numbers are estimates only");
      break;
    }
    case "packet_builder": {
      const p = data.packet_builder;
      if (!hasText(p?.packetId)) break;
      if (!p?.reviewed) missing.push("Mark packet as reviewed");
      if (p?.status !== "review_ready") missing.push("Packet status must be REVIEW_READY");
      break;
    }
    case "attorney_compliance": {
      const a = data.attorney_compliance;
      if (!a?.reviewStatus) missing.push("Review status");
      if (!hasText(a?.complianceNotes)) missing.push("Compliance notes");
      break;
    }
    case "outreach_direction": {
      const o = data.outreach_direction;
      if (!o?.nextAction) missing.push("Next action");
      if (!hasText(o?.taskNotes)) missing.push("Task notes");
      break;
    }
    case "final_archive":
      break;
    case "complete":
      break;
  }

  return { valid: missing.length === 0, missing };
}

export function canContinue(session: LeadWalkthroughSession): StepValidationResult {
  return validateStep(session.currentStep, session.stepData, session.leadId);
}

export function calculateLeadScore(data: WalkthroughStepData): number {
  let score = 0;
  const sources = data.source_discovery?.sources ?? [];
  if (sources.length > 0) {
    const conf = sources[0]?.confidence;
    score += conf === "high" ? 25 : conf === "medium" ? 15 : 8;
  }
  const death = data.death_probate?.verificationStatus;
  score += death === "verified" ? 25 : death === "partial" ? 15 : death === "not_verified" ? 5 : 0;
  const prop = data.property_verification?.confidence;
  score += prop === "high" ? 20 : prop === "medium" ? 12 : prop === "low" ? 5 : 0;
  const contacts = data.heir_discovery?.contacts ?? [];
  if (contacts.length > 0) {
    const c = contacts[0]?.confidence;
    score += c === "verified" ? 15 : c === "likely" ? 10 : c === "weak" ? 4 : 2;
  }
  const deal = data.deal_value;
  if (deal?.assignmentFeeTarget && deal.assignmentFeeTarget > 0) score += 15;
  return Math.min(100, Math.max(0, score));
}

export function buildEvidenceSummary(session: LeadWalkthroughSession): WalkthroughEvidenceSummary {
  const lead = session.leadId ? getFullLeadByIdSync(session.leadId) : null;
  const d = session.stepData;
  const contacts = d.heir_discovery?.contacts ?? [];
  const topContact = contacts[0]?.confidence ?? "unknown";

  return {
    sourceCount: d.source_discovery?.sources?.length ?? 0,
    evidenceCount:
      (d.death_probate?.citation ? 1 : 0) +
      (d.property_verification?.sourceCitation ? 1 : 0) +
      (d.source_discovery?.sources?.length ?? 0),
    mediaCount: d.property_media?.media?.length ?? 0,
    contactCount: contacts.length,
    contactConfidence: topContact,
    leadDecision: d.lead_qualification?.decision ?? "—",
    packetStatus: d.packet_builder?.status ?? "—",
    nextAction: d.outreach_direction?.nextAction ?? "—",
    leadName: d.start?.estateName ?? lead?.ownerName ?? "—",
    propertyAddress: d.property_verification?.propertyAddress ?? lead?.propertyAddress ?? "—",
    archiveLocation: d.final_archive?.archiveLocation ?? "—",
  };
}

export function advanceSession(session: LeadWalkthroughSession): LeadWalkthroughSession {
  const validation = canContinue(session);
  if (!validation.valid) return session;

  const next = getNextStep(session.currentStep);
  if (!next) return session;

  const completed = session.completedSteps.includes(session.currentStep)
    ? session.completedSteps
    : [...session.completedSteps, session.currentStep];

  return {
    ...session,
    currentStep: next,
    completedSteps: completed,
    status: next === "complete" ? "complete" : session.status,
    finalOutcome: next === "complete" ? session.stepData.lead_qualification?.decision ?? "archived" : session.finalOutcome,
    updatedAt: new Date().toISOString(),
  };
}
