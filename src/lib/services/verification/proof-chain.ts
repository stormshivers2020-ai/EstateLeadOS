import { PROOF_CHAIN_TITLES } from "./constants";
import type {
  ContactCandidate,
  EvidenceSource,
  LeadVerificationBundle,
  PersonVerification,
  ProofChainStep,
} from "@/lib/types/verification";

interface ProofChainInput {
  propertyAddress: string;
  ownerName?: string | null;
  parcelId?: string | null;
  evidenceSources: EvidenceSource[];
  persons: PersonVerification[];
  contacts: ContactCandidate[];
}

function findEvidenceByType(sources: EvidenceSource[], pattern: RegExp): EvidenceSource[] {
  return sources.filter(
    (s) => pattern.test(s.sourceType) || pattern.test(s.sourceName) || pattern.test(s.citationLabel ?? "")
  );
}

export function buildProofChain(input: ProofChainInput): ProofChainStep[] {
  const steps: ProofChainStep[] = [];
  const deedEvidence = findEvidenceByType(input.evidenceSources, /deed|recorder|transfer/i);
  const probateEvidence = findEvidenceByType(input.evidenceSources, /probate|estate|wills|court/i);
  const ownerEvidence = findEvidenceByType(input.evidenceSources, /owner|assessor|tax|parcel/i);
  const addressEvidence = input.evidenceSources.filter((s) =>
    (s.sourceExcerpt ?? "").toLowerCase().includes(input.propertyAddress.toLowerCase().slice(0, 12))
  );

  steps.push({
    id: "step-address",
    kind: "property_address",
    title: PROOF_CHAIN_TITLES.property_address,
    description: input.propertyAddress,
    status: input.propertyAddress ? "complete" : "missing",
    evidenceIds: addressEvidence.length > 0 ? addressEvidence.map((e) => e.id) : input.evidenceSources.slice(0, 1).map((e) => e.id),
  });

  steps.push({
    id: "step-owner",
    kind: "owner_record",
    title: PROOF_CHAIN_TITLES.owner_record,
    description: input.ownerName ?? "Owner not confirmed — attach assessor or deed record.",
    status: input.ownerName ? (ownerEvidence.length > 0 ? "complete" : "partial") : "missing",
    confidenceScore: input.ownerName ? 55 : undefined,
    evidenceIds: ownerEvidence.map((e) => e.id),
  });

  steps.push({
    id: "step-deed",
    kind: "deed_record",
    title: PROOF_CHAIN_TITLES.deed_record,
    description:
      deedEvidence.length > 0
        ? "Deed or transfer record linked from search."
        : "No deed record attached yet.",
    status: deedEvidence.length > 0 ? "complete" : "missing",
    evidenceIds: deedEvidence.map((e) => e.id),
  });

  steps.push({
    id: "step-probate",
    kind: "probate_estate_record",
    title: PROOF_CHAIN_TITLES.probate_estate_record,
    description:
      probateEvidence.length > 0
        ? "Probate or estate record cited from search results."
        : "Probate/estate filing not yet confirmed.",
    status: probateEvidence.length > 0 ? "complete" : "partial",
    evidenceIds: probateEvidence.map((e) => e.id),
  });

  for (const person of input.persons) {
    steps.push({
      id: `step-person-${person.id}`,
      kind: "possible_person",
      title: PROOF_CHAIN_TITLES.possible_person,
      description: `${person.personName} — ${person.connectionRationale ?? "Connection inferred from search signals."}`,
      status:
        person.verificationStatus === "manually_approved"
          ? "complete"
          : person.verificationStatus === "rejected"
            ? "missing"
            : "partial",
      confidenceScore: person.confidenceScore,
      evidenceIds: input.evidenceSources.slice(0, 2).map((e) => e.id),
      personId: person.id,
    });
  }

  if (input.persons.length === 0) {
    steps.push({
      id: "step-person-placeholder",
      kind: "possible_person",
      title: PROOF_CHAIN_TITLES.possible_person,
      description: "No person connection identified yet.",
      status: "missing",
      evidenceIds: [],
    });
  }

  for (const contact of input.contacts) {
    steps.push({
      id: `step-contact-${contact.id}`,
      kind: "contact_candidate",
      title: PROOF_CHAIN_TITLES.contact_candidate,
      description: `${contact.contactType.replace(/_/g, " ")}: ${contact.contactValue}`,
      status:
        contact.verificationStatus === "verified" || contact.verificationStatus === "likely_match"
          ? "partial"
          : "missing",
      confidenceScore: contact.confidenceScore,
      evidenceIds: [],
      contactId: contact.id,
    });
  }

  const approvedPerson = input.persons.find((p) => p.verificationStatus === "manually_approved");
  steps.push({
    id: "step-manual-approval",
    kind: "manual_approval",
    title: PROOF_CHAIN_TITLES.manual_approval,
    description: approvedPerson
      ? `Manually approved: ${approvedPerson.personName}`
      : "Awaiting operator review — never contact without manual approval.",
    status: approvedPerson ? "complete" : "pending_approval",
    evidenceIds: approvedPerson ? input.evidenceSources.slice(0, 1).map((e) => e.id) : [],
    personId: approvedPerson?.id,
  });

  return steps;
}

export function assembleVerificationBundle(
  leadId: string,
  partial: Omit<LeadVerificationBundle, "leadId" | "proofChain"> & {
    propertyAddress: string;
    ownerName?: string | null;
    parcelId?: string | null;
  }
): LeadVerificationBundle {
  const proofChain = buildProofChain({
    propertyAddress: partial.propertyAddress,
    ownerName: partial.ownerName,
    parcelId: partial.parcelId,
    evidenceSources: partial.evidenceSources,
    persons: partial.persons,
    contacts: partial.contactCandidates,
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
