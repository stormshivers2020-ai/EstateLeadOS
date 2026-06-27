export {
  VERIFICATION_DISCLAIMER,
  PERSON_ROLE_LABELS,
  CONTACT_STATUS_LABELS,
} from "./constants";
export { formatEvidenceCitation, annotateCitations } from "./citation";
export { buildProofChain, assembleVerificationBundle } from "./proof-chain";
export { buildVerificationFromCandidate } from "./evidence-builder";
export {
  getLeadVerificationBundle,
  persistVerificationForCandidateAsync,
  updatePersonVerification,
  updateContactCandidate,
  getEmptyVerificationState,
} from "./persistence";
