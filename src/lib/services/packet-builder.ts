import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { getSessionContext } from "@/lib/config/session";
import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLatestCalculation } from "@/lib/services/deal-calculator";
import { getLeadComplianceContext } from "@/lib/services/compliance";
import { getLeadVerificationBundleSync } from "@/lib/services/verification/bundle-client";
import { getWalkthroughSessions } from "@/lib/services/walkthrough/session-store";
import type { LeadWalkthroughSession } from "@/lib/types/walkthrough";
import { WALKTHROUGH_STEP_ORDER } from "@/lib/types/walkthrough";
import type {
  LeadPacketConfidenceSummary,
  LeadPacketContactItem,
  LeadPacketContent,
  LeadPacketMediaItem,
  LeadPacketRecord,
  LeadPacketRecordStatus,
  LeadPacketRecommendation,
  LeadPacketSourceItem,
} from "@/lib/types/lead-packet";
import {
  PACKET_CONTACT_DISCLAIMER as CONTACT_DISCLAIMER,
  PACKET_ESTIMATE_DISCLAIMER as ESTIMATE_DISCLAIMER,
} from "@/lib/types/lead-packet";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function ensurePacketStore(): LeadPacketRecord[] {
  const state = getLocalState() as ReturnType<typeof getLocalState> & { leadPacketRecords?: LeadPacketRecord[] };
  if (!state.leadPacketRecords) state.leadPacketRecords = [];
  return state.leadPacketRecords;
}

export function getLeadPacketRecords(filters?: { leadId?: string }): LeadPacketRecord[] {
  let items = [...ensurePacketStore()];
  if (filters?.leadId) items = items.filter((p) => p.leadId === filters.leadId);
  return items.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export function getLatestLeadPacket(leadId: string): LeadPacketRecord | null {
  return getLeadPacketRecords({ leadId })[0] ?? null;
}

export function getLeadPacketById(id: string): LeadPacketRecord | null {
  return ensurePacketStore().find((p) => p.id === id) ?? null;
}

function getNextVersion(leadId: string): number {
  const existing = getLeadPacketRecords({ leadId });
  if (existing.length === 0) return 1;
  return Math.max(...existing.map((p) => p.packetVersion)) + 1;
}

function mapContactConfidence(
  status: string | undefined
): LeadPacketContactItem["confidence"] {
  if (status === "verified" || status === "manually_approved") return "verified";
  if (status === "likely_match" || status === "verified_by_source") return "likely";
  if (status === "weak_match" || status === "needs_verification") return "weak";
  return "unknown";
}

function getWalkthroughForLead(leadId: string): LeadWalkthroughSession | null {
  return (
    getWalkthroughSessions()
      .filter((s) => s.leadId === leadId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null
  );
}

function deriveRecommendation(
  lead: ReturnType<typeof getFullLeadByIdSync>,
  walkthrough: LeadWalkthroughSession | null
): { recommendation: LeadPacketRecommendation; rationale: string | null; pendingDecisionNote: string | null } {
  const wtDecision = walkthrough?.stepData?.lead_qualification?.decision;
  if (wtDecision === "pursue") return { recommendation: "pursue", rationale: walkthrough?.stepData?.lead_qualification?.reason ?? null, pendingDecisionNote: null };
  if (wtDecision === "hold") return { recommendation: "hold_for_more_research", rationale: walkthrough?.stepData?.lead_qualification?.reason ?? null, pendingDecisionNote: null };
  if (wtDecision === "reject") return { recommendation: "reject", rationale: walkthrough?.stepData?.lead_qualification?.reason ?? null, pendingDecisionNote: null };

  if (walkthrough?.stepData?.attorney_compliance?.reviewStatus === "needs_attorney") {
    return { recommendation: "send_to_attorney", rationale: walkthrough.stepData.attorney_compliance.complianceNotes ?? null, pendingDecisionNote: null };
  }
  const outreach = walkthrough?.stepData?.outreach_direction?.nextAction;
  if (outreach === "prepare_buyer_packet") {
    return { recommendation: "prepare_outreach", rationale: walkthrough?.stepData?.outreach_direction?.taskNotes ?? null, pendingDecisionNote: null };
  }
  if (outreach === "archive_inactive") {
    return { recommendation: "archive_inactive", rationale: walkthrough?.stepData?.outreach_direction?.taskNotes ?? null, pendingDecisionNote: null };
  }
  if (lead?.pipelineStage === "closed_lost" || lead?.pipelineStage === "closed_won") {
    return { recommendation: "archive_inactive", rationale: lead.nextAction ?? null, pendingDecisionNote: null };
  }

  return {
    recommendation: "pending_decision",
    rationale: null,
    pendingDecisionNote: "No lead decision recorded yet. Complete qualification or walkthrough before outreach.",
  };
}

function assessMissingRequirements(content: LeadPacketContent): string[] {
  const missing: string[] = [];
  const { overview, sourceDiscovery, propertyEvidence, contactCandidates, contactNotFoundReason, recommendation } =
    content;

  if (!overview.leadId) missing.push("Lead record");
  if (!overview.propertyAddress && !propertyEvidence.parcelId) {
    missing.push("Property address or parcel ID");
  }
  if (sourceDiscovery.length === 0) {
    missing.push("At least one source citation");
  } else if (sourceDiscovery.every((s) => s.confidence == null)) {
    missing.push("Source confidence score");
  }

  const hasPropertyEvidence =
    Boolean(propertyEvidence.propertyAddress || propertyEvidence.parcelId) ||
    Boolean(propertyEvidence.unavailableReason);
  if (!hasPropertyEvidence) {
    missing.push("Property evidence or documented unavailability reason");
  }

  const hasContacts = contactCandidates.length > 0 || Boolean(contactNotFoundReason);
  if (!hasContacts) {
    missing.push("Contact candidate or documented not-found reason");
  }

  if (recommendation.recommendation === "pending_decision" && !recommendation.pendingDecisionNote) {
    missing.push("Lead decision or explicit pending-decision note");
  }

  return missing;
}

function derivePacketStatus(missing: string[], complianceBlocked: boolean): LeadPacketRecordStatus {
  if (complianceBlocked) return "attorney_review_needed";
  if (missing.length > 0) return "missing_data";
  return "review_ready";
}

function buildPacketContent(leadId: string): LeadPacketContent {
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) throw new Error("Lead not found");

  const evidence = getLeadVerificationBundleSync(leadId, {
    propertyAddress: lead.propertyAddress ?? "",
    ownerName: lead.ownerName,
    parcelId: lead.parcelId,
  });
  const calculation = getLatestCalculation(leadId);
  const compliance = getLeadComplianceContext(leadId);
  const walkthrough = getWalkthroughForLead(leadId);

  const leadSources = lead.sourceRecords ?? [];
  const evidenceSources = evidence?.evidenceSources ?? [];

  const sourceDiscovery: LeadPacketSourceItem[] = [
    ...leadSources.map((s) => ({
      id: s.id,
      url: s.sourceUrl ?? null,
      title: s.sourceName ?? null,
      agency: s.sourceName ?? null,
      sourceType: s.sourceType,
      confidence: s.reliabilityScore ?? null,
      capturedAt: s.retrievedAt ?? null,
      notes: s.fieldsProvided?.join(", ") ?? null,
      screenshotUrl: null,
    })),
    ...evidenceSources.map((s) => ({
      id: s.id,
      url: s.sourceUrl ?? null,
      title: s.sourceTitle ?? s.sourceName,
      agency: s.sourceName,
      sourceType: s.sourceType,
      confidence: s.confidenceScore ?? null,
      capturedAt: s.retrievedAt ?? null,
      notes: s.sourceExcerpt ?? s.citationLabel ?? null,
      screenshotUrl: s.screenshotUrl ?? null,
    })),
  ].filter((s, i, arr) => arr.findIndex((x) => x.url === s.url && x.title === s.title) === i);

  const wtProbate = walkthrough?.stepData?.death_probate;
  const probateEvidence = {
    probateRecord: wtProbate?.citation ?? null,
    deathRecord: null,
    obituaryRecord: null,
    registerOfWillsSource: wtProbate?.citation ?? null,
    estateFiling: null,
    courtReference: wtProbate?.citation ?? null,
    verificationStatus: wtProbate?.verificationStatus ?? null,
    citations: wtProbate?.citation ? [wtProbate.citation] : evidenceSources.map((e) => e.formattedCitation ?? e.citationLabel ?? e.sourceUrl ?? "").filter(Boolean),
    notes: wtProbate?.notes ?? null,
    unavailableReason:
      wtProbate?.verificationStatus === "not_verified"
        ? wtProbate.notVerifiedAction?.replace(/_/g, " ") ?? "Probate/death evidence not verified"
        : evidenceSources.length === 0 && !wtProbate
          ? "No probate or death evidence attached yet"
          : null,
  };

  const wtProperty = walkthrough?.stepData?.property_verification;
  const propertyEvidence = {
    propertyAddress: wtProperty?.propertyAddress ?? lead.propertyAddress ?? null,
    parcelId: wtProperty?.parcelId ?? lead.parcelId ?? null,
    deedSource: wtProperty?.sourceCitation ?? null,
    taxRecordSource: lead.taxAssessedValue ? "Lead tax assessed value on file" : null,
    sdatGisSource: evidenceSources.find((e) => /gis|sdat|assessor/i.test(e.sourceType))?.sourceUrl ?? null,
    landRecordSource: evidenceSources.find((e) => /deed|land|record/i.test(e.sourceType))?.sourceUrl ?? null,
    ownerConnectionNotes: wtProperty?.connectionNotes ?? lead.ownerHeir?.notes ?? null,
    propertyConfidenceScore: wtProperty?.confidence ? ({ high: 85, medium: 60, low: 35 }[wtProperty.confidence] ?? null) : lead.dataConfidenceScore ?? null,
    unavailableReason:
      !wtProperty?.propertyAddress && !lead.propertyAddress && !lead.parcelId
        ? "Property location not confirmed"
        : null,
  };

  const propertyMedia: LeadPacketMediaItem[] = [
    ...(evidence?.propertyMedia ?? []).map((m) => ({
      id: m.id,
      caption: m.attribution ?? m.mediaType,
      mediaUrl: m.mediaUrl ?? null,
      mediaType: m.mediaType,
      source: m.sourceName ?? null,
      capturedAt: m.retrievedAt ?? null,
      unavailableReason: null,
    })),
    ...(walkthrough?.stepData?.property_media?.media ?? []).map((m) => ({
      id: m.id,
      caption: m.caption,
      mediaUrl: m.fileName ? `/uploads/${m.fileName}` : null,
      mediaType: m.mediaType,
      source: m.source,
      capturedAt: null,
      unavailableReason: m.unavailable ? m.unavailableReason ?? "Media marked unavailable in walkthrough" : null,
    })),
  ];

  const verificationContacts: LeadPacketContactItem[] = (evidence?.contactCandidates ?? []).map((c) => ({
    id: c.id,
    name: c.personName ?? null,
    role: c.personRole ?? c.contactType,
    phone: c.contactType === "phone" ? c.contactValue : null,
    email: c.contactType === "email" ? c.contactValue : null,
    mailingAddress: c.contactType === "mailing_address" ? c.contactValue : null,
    confidence: mapContactConfidence(c.verificationStatus),
    sourceNotes: c.sourceName ? `${c.sourceName}${c.sourceUrl ? ` — ${c.sourceUrl}` : ""}` : CONTACT_DISCLAIMER,
    verificationStatus: c.verificationStatus,
  }));

  const wtContacts: LeadPacketContactItem[] = (walkthrough?.stepData?.heir_discovery?.contacts ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.contactType,
    phone: c.phone ?? null,
    email: c.email ?? null,
    mailingAddress: c.mailingAddress ?? null,
    confidence: c.confidence,
    sourceNotes: c.evidenceNotes || CONTACT_DISCLAIMER,
    verificationStatus: c.confidence === "verified" ? "verified" : "unverified",
  }));

  const contactCandidates = [...verificationContacts, ...wtContacts].filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
  );

  const contactNotFoundReason =
    walkthrough?.stepData?.heir_discovery?.contactNotFound
      ? walkthrough.stepData.heir_discovery.notFoundNotes ?? "No heir/representative contact found during walkthrough"
      : walkthrough?.stepData?.contact_path?.noContactFound
        ? walkthrough.stepData.contact_path.noContactReason ?? "No contact path confirmed"
        : contactCandidates.length === 0
          ? "No contact candidates on file — research required before outreach"
          : null;

  const wtDeal = walkthrough?.stepData?.deal_value;
  let dealEstimate: LeadPacketContent["dealEstimate"] = null;
  if (wtDeal) {
    dealEstimate = {
      arvLow: wtDeal.arvLow,
      arvHigh: wtDeal.arvHigh,
      offerLow: wtDeal.offerLow,
      offerHigh: wtDeal.offerHigh,
      assignmentFeeTarget: wtDeal.assignmentFeeTarget,
      repairAssumptions: wtDeal.repairAssumptions,
      buyerDemandNotes: wtDeal.buyerDemandNotes,
      riskNotes: wtDeal.riskNotes,
      disclaimer: ESTIMATE_DISCLAIMER,
      source: "walkthrough",
    };
  } else if (calculation) {
    dealEstimate = {
      arvLow: calculation.estimatedCurrentValue ?? calculation.estimatedArv,
      arvHigh: calculation.estimatedArv,
      offerLow: calculation.offerRangeLow,
      offerHigh: calculation.offerRangeHigh,
      assignmentFeeTarget: calculation.targetAssignmentSpread,
      repairAssumptions: calculation.estimatedRepairs ? String(calculation.estimatedRepairs) : null,
      buyerDemandNotes: calculation.notes,
      riskNotes: calculation.warnings.join("; ") || null,
      disclaimer: ESTIMATE_DISCLAIMER,
      source: "calculator",
    };
  } else if (lead.estimatedValue || lead.taxAssessedValue) {
    dealEstimate = {
      arvLow: lead.taxAssessedValue ?? lead.estimatedValue ?? null,
      arvHigh: lead.estimatedValue ?? lead.taxAssessedValue ?? null,
      offerLow: null,
      offerHigh: null,
      assignmentFeeTarget: null,
      repairAssumptions: null,
      buyerDemandNotes: null,
      riskNotes: "Derived from lead fields only — run deal calculator for structured estimate.",
      disclaimer: ESTIMATE_DISCLAIMER,
      source: "lead_fields",
    };
  }

  const complianceBlocked =
    Boolean(lead.doNotContact) || (compliance?.blockers?.length ?? 0) > 0;

  const outreachAllowed: LeadPacketContent["compliance"]["outreachAllowed"] = lead.doNotContact
    ? "no"
    : complianceBlocked
      ? "no"
      : compliance?.acknowledgements?.length
        ? "pending"
        : "pending";

  const complianceSection = {
    complianceStatus: compliance?.lastComplianceCheck?.explanation ?? null,
    attorneyReviewStatus: walkthrough?.stepData?.attorney_compliance?.reviewStatus ?? "not_started",
    outreachAllowed,
    legalWarnings: [
      ...(lead.doNotContact ? ["Lead marked do-not-contact"] : []),
      ...(compliance?.blockers?.map((b) => b.blockerMessage) ?? []),
      GLOBAL_DISCLAIMER,
    ],
    notes: walkthrough?.stepData?.attorney_compliance?.complianceNotes ?? null,
    nextRequiredReviewStep:
      walkthrough?.stepData?.attorney_compliance?.reviewStatus === "needs_attorney"
        ? "Send to attorney review"
        : outreachAllowed === "no"
          ? "Resolve compliance block before outreach"
          : "Complete attorney/compliance review",
  };

  const stepSummaries =
    walkthrough?.completedSteps.map((stepId) => {
      const data = walkthrough.stepData[stepId as keyof typeof walkthrough.stepData];
      return {
        stepId,
        completed: true,
        notes:
          typeof data === "object" && data && "notes" in data
            ? String((data as { notes?: string }).notes ?? "")
            : null,
        decision:
          stepId === "lead_qualification" && walkthrough.stepData.lead_qualification
            ? walkthrough.stepData.lead_qualification.decision
            : stepId === "outreach_direction" && walkthrough.stepData.outreach_direction
              ? walkthrough.stepData.outreach_direction.nextAction
              : null,
        missingItems: [],
      };
    }) ?? [];

  const walkthroughSummary = walkthrough
    ? {
        sessionId: walkthrough.id,
        status: walkthrough.status,
        completedSteps: walkthrough.completedSteps,
        stepSummaries,
        missingItems: WALKTHROUGH_STEP_ORDER.filter(
          (s) => s !== "complete" && !walkthrough.completedSteps.includes(s)
        ).map((s) => `Walkthrough step not completed: ${s.replace(/_/g, " ")}`),
        finalOutcome: walkthrough.finalOutcome,
        nextAction: lead.nextAction ?? null,
      }
    : null;

  const recommendation = deriveRecommendation(lead, walkthrough);

  const overview = {
    leadId: lead.id,
    estateName: walkthrough?.stepData?.start?.estateName ?? lead.ownerName ?? null,
    ownerName: lead.ownerName ?? null,
    propertyAddress: lead.propertyAddress ?? null,
    county: lead.county ?? null,
    state: lead.state ?? null,
    leadStatus: lead.pipelineStage ?? null,
    leadSource: leadSources[0]?.sourceName ?? lead.origin ?? null,
    createdAt: lead.createdAt ?? null,
    updatedAt: lead.updatedAt ?? null,
    leadScore: lead.estateLeadScore ?? null,
    confidenceScore: lead.dataConfidenceScore ?? null,
  };

  return {
    overview,
    sourceDiscovery,
    probateEvidence,
    propertyEvidence,
    propertyMedia,
    contactCandidates,
    contactNotFoundReason,
    dealEstimate,
    compliance: complianceSection,
    walkthrough: walkthroughSummary,
    recommendation: {
      recommendation: recommendation.recommendation,
      rationale: recommendation.rationale,
      pendingDecisionNote: recommendation.pendingDecisionNote,
    },
    appendix: {
      rawNotes: lead.ownerHeir?.notes ? [lead.ownerHeir.notes] : [],
      auditExcerpt: (evidence?.actionLogs ?? []).slice(0, 15).map(
        (l) => `${l.actionType} — ${l.actorUserName ?? "system"} — ${new Date(l.createdAt).toLocaleString()}`
      ),
    },
  };
}

export function buildLeadPacketRecord(input: {
  leadId: string;
  rebuild?: boolean;
}): LeadPacketRecord {
  const existing = getLatestLeadPacket(input.leadId);
  if (existing && !input.rebuild) return existing;

  const session = getSessionContext();
  const content = buildPacketContent(input.leadId);
  const missingRequirements = assessMissingRequirements(content);
  const complianceBlocked = content.compliance.outreachAllowed === "no";
  const packetStatus = derivePacketStatus(missingRequirements, complianceBlocked);

  const confidenceSummary: LeadPacketConfidenceSummary = {
    overall: content.overview.confidenceScore,
    sourceConfidence:
      content.sourceDiscovery.length > 0
        ? Math.round(
            content.sourceDiscovery.reduce((sum, s) => sum + (s.confidence ?? 0), 0) /
              content.sourceDiscovery.length
          )
        : null,
    propertyConfidence: content.propertyEvidence.propertyConfidenceScore,
    contactConfidence:
      content.contactCandidates.find((c) => c.confidence === "verified")
        ? "verified"
        : content.contactCandidates.find((c) => c.confidence === "likely")
          ? "likely"
          : content.contactNotFoundReason
            ? "not_found"
            : "unknown",
    dataConfidenceScore: content.overview.confidenceScore,
  };

  const record: LeadPacketRecord = {
    id: uid("lpk"),
    organizationId: session.organizationId,
    leadId: input.leadId,
    packetStatus,
    packetVersion: getNextVersion(input.leadId),
    packetJson: content,
    missingRequirements,
    sourceCount: content.sourceDiscovery.length,
    evidenceCount: content.probateEvidence.citations.length + content.sourceDiscovery.length,
    mediaCount: content.propertyMedia.filter((m) => m.mediaUrl && !m.unavailableReason).length,
    contactCount: content.contactCandidates.length,
    confidenceSummary,
    generatedAt: now(),
    updatedAt: now(),
    generatedBy: session.userName,
  };

  const store = ensurePacketStore();
  store.unshift(record);
  persistLocalState();

  return record;
}

export function markLeadPacketArchived(packetId: string): LeadPacketRecord | null {
  const store = ensurePacketStore();
  const idx = store.findIndex((p) => p.id === packetId);
  if (idx === -1) return null;
  store[idx] = { ...store[idx], packetStatus: "archived", updatedAt: now() };
  persistLocalState();
  return store[idx];
}
