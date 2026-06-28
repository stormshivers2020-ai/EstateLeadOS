import { PROOF_CHAIN_TITLES } from "./constants";
import type {
  ContactCandidate,
  EvidenceSource,
  LeadVerificationBundle,
  PersonVerification,
  PropertyMedia,
  ProofChainStep,
  ProofChainStepKind,
} from "@/lib/types/verification";

interface ProofChainInput {
  propertyAddress: string;
  ownerName?: string | null;
  parcelId?: string | null;
  evidenceSources: EvidenceSource[];
  persons: PersonVerification[];
  contacts: ContactCandidate[];
  propertyMedia: PropertyMedia[];
  leadManuallyApproved?: boolean;
}

function findEvidenceByType(sources: EvidenceSource[], pattern: RegExp): EvidenceSource[] {
  return sources.filter(
    (s) =>
      pattern.test(s.sourceType)
      || pattern.test(s.sourceName)
      || pattern.test(s.citationLabel ?? "")
      || pattern.test(s.sourceExcerpt ?? ""),
  );
}

function isOfficialGovernmentSource(source: EvidenceSource): boolean {
  const blob = `${source.sourceType} ${source.sourceName} ${source.sourceUrl ?? ""}`;
  if (/internet_search|signal_match|people.?search|zillow|realtor|redfin/i.test(blob)) return false;
  return /\.gov|assessor|probate|estate|deed|recorder|register|court|gis|parcel|tax|sdat|land.?record/i.test(blob);
}

function step(
  stepNumber: number,
  kind: ProofChainStepKind,
  title: string,
  description: string,
  status: ProofChainStep["status"],
  evidenceIds: string[],
  extra?: Partial<ProofChainStep>,
): ProofChainStep {
  return {
    id: `proof-step-${stepNumber}`,
    stepNumber,
    kind,
    title,
    description,
    status,
    evidenceIds,
    ...extra,
  };
}

export function buildProofChain(input: ProofChainInput): ProofChainStep[] {
  const govSources = input.evidenceSources.filter(isOfficialGovernmentSource);
  const allSources = input.evidenceSources;
  const deedEvidence = findEvidenceByType(allSources, /deed|recorder|transfer|land/i);
  const probateEvidence = findEvidenceByType(allSources, /probate|estate|wills|court|inherit/i);
  const propertyEvidence = findEvidenceByType(allSources, /assessor|assessment|sdat|property|gis|parcel|tax/i);
  const hasGovSignal = govSources.length > 0 || allSources.length > 0;
  const decedentPerson = input.persons.find((p) =>
    /estate|decedent|heir|representative|executor/i.test(p.connectionRationale ?? "")
    || p.roleLabel !== "needs_verification",
  ) ?? input.persons[0];
  const representative = input.persons.find((p) =>
    p.roleLabel === "possible_personal_representative" || /representative|executor/i.test(p.connectionRationale ?? ""),
  );
  const approvedPerson = input.persons.find((p) => p.verificationStatus === "manually_approved");
  const hasVisual = input.propertyMedia.some((m) =>
    /gis|parcel|assessor|county|map|photo|screenshot/i.test(m.mediaType),
  );

  return [
    step(
      1,
      "government_signal",
      PROOF_CHAIN_TITLES.government_signal,
      hasGovSignal
        ? `${govSources.length || allSources.length} official or pipeline government signal(s) attached.`
        : "No government signal yet — run Government Pipeline or official record search.",
      hasGovSignal ? (govSources.length > 0 ? "complete" : "partial") : "missing",
      (govSources.length > 0 ? govSources : allSources).slice(0, 3).map((e) => e.id),
    ),
    step(
      2,
      "estate_probate_signal",
      PROOF_CHAIN_TITLES.estate_probate_signal,
      probateEvidence.length > 0
        ? "Estate / probate / inheritance signal found in official records."
        : "Estate or probate signal not confirmed — check register of wills or court records.",
      probateEvidence.length > 0 ? "complete" : "missing",
      probateEvidence.map((e) => e.id),
    ),
    step(
      3,
      "decedent_estate_party",
      PROOF_CHAIN_TITLES.decedent_estate_party,
      decedentPerson
        ? `${decedentPerson.personName} identified — ${decedentPerson.roleLabel.replace(/_/g, " ")}.`
        : "Decedent or estate party not yet identified from official records.",
      decedentPerson ? (decedentPerson.verificationStatus === "manually_approved" ? "complete" : "partial") : "missing",
      probateEvidence.slice(0, 2).map((e) => e.id),
      { personId: decedentPerson?.id, confidenceScore: decedentPerson?.confidenceScore },
    ),
    step(
      4,
      "property_match",
      PROOF_CHAIN_TITLES.property_match,
      input.propertyAddress
        ? `Property match: ${input.propertyAddress}${input.parcelId ? ` (parcel ${input.parcelId})` : ""}.`
        : "Property record not matched to an official assessor/GIS source.",
      input.propertyAddress && propertyEvidence.length > 0
        ? "complete"
        : input.propertyAddress
          ? "partial"
          : "missing",
      propertyEvidence.map((e) => e.id),
    ),
    step(
      5,
      "deed_transfer_checked",
      PROOF_CHAIN_TITLES.deed_transfer_checked,
      deedEvidence.length > 0
        ? "Deed / transfer record checked against land records."
        : "Deed or transfer record not yet attached.",
      deedEvidence.length > 0 ? "complete" : "missing",
      deedEvidence.map((e) => e.id),
    ),
    step(
      6,
      "representative_party",
      PROOF_CHAIN_TITLES.representative_party,
      representative
        ? `Possible representative: ${representative.personName}.`
        : decedentPerson
          ? `Party identified; representative role needs confirmation.`
          : "No possible responsible party / representative identified.",
      representative || decedentPerson ? "partial" : "missing",
      [...probateEvidence, ...deedEvidence].slice(0, 2).map((e) => e.id),
      { personId: representative?.id ?? decedentPerson?.id },
    ),
    step(
      7,
      "property_visual",
      PROOF_CHAIN_TITLES.property_visual,
      hasVisual
        ? `${input.propertyMedia.length} property visual(s) from official or attributed sources.`
        : "Add GIS parcel map, assessor photo, or official property visual.",
      hasVisual ? "complete" : "missing",
      [],
    ),
    step(
      8,
      "evidence_citations",
      PROOF_CHAIN_TITLES.evidence_citations,
      allSources.length > 0
        ? `${allSources.length} evidence citation(s) attached — every claim must cite a source.`
        : "Attach evidence citations before verification.",
      allSources.length > 0 ? "complete" : "missing",
      allSources.map((e) => e.id),
    ),
    step(
      9,
      "contact_candidate",
      PROOF_CHAIN_TITLES.contact_candidate,
      input.contacts.length > 0
        ? `${input.contacts.length} contact candidate(s) saved separately from verified proof — low-confidence enrichment only.`
        : "No contact candidates yet (optional — cannot verify lead from people-search).",
      input.contacts.length > 0 ? "partial" : "missing",
      [],
      { contactId: input.contacts[0]?.id, confidenceScore: input.contacts[0]?.confidenceScore },
    ),
    step(
      10,
      "manual_review",
      PROOF_CHAIN_TITLES.manual_review,
      approvedPerson || input.leadManuallyApproved
        ? `Manual review recorded${approvedPerson ? `: ${approvedPerson.personName}` : ""}. Not legal approval.`
        : "Manual user review required before lead moves forward. EstateLeadOS does not auto-contact anyone.",
      approvedPerson || input.leadManuallyApproved ? "complete" : "pending_approval",
      approvedPerson ? allSources.slice(0, 1).map((e) => e.id) : [],
      { personId: approvedPerson?.id },
    ),
  ];
}

export function assembleVerificationBundle(
  leadId: string,
  partial: Omit<LeadVerificationBundle, "leadId" | "proofChain"> & {
    propertyAddress: string;
    ownerName?: string | null;
    parcelId?: string | null;
    leadManuallyApproved?: boolean;
  },
): LeadVerificationBundle {
  const proofChain = buildProofChain({
    propertyAddress: partial.propertyAddress,
    ownerName: partial.ownerName,
    parcelId: partial.parcelId,
    evidenceSources: partial.evidenceSources,
    persons: partial.persons,
    contacts: partial.contactCandidates,
    propertyMedia: partial.propertyMedia,
    leadManuallyApproved: partial.leadManuallyApproved,
  });

  return {
    leadId,
    recordHits: partial.recordHits,
    evidenceSources: partial.evidenceSources,
    persons: partial.persons,
    contactCandidates: partial.contactCandidates,
    propertyMedia: partial.propertyMedia,
    actionLogs: partial.actionLogs,
    proofChain,
  };
}
