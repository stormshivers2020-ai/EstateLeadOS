import type {
  ContactCandidate,
  EvidenceSource,
  PersonVerification,
  PropertyMedia,
  RecordHit,
  VerificationActionLog,
} from "@/lib/types/verification";

export interface LocalVerificationState {
  recordHits: RecordHit[];
  evidenceSources: EvidenceSource[];
  persons: PersonVerification[];
  contactCandidates: ContactCandidate[];
  propertyMedia: PropertyMedia[];
  actionLogs: VerificationActionLog[];
}

export function getEmptyVerificationState(): LocalVerificationState {
  return {
    recordHits: [],
    evidenceSources: [],
    persons: [],
    contactCandidates: [],
    propertyMedia: [],
    actionLogs: [],
  };
}
