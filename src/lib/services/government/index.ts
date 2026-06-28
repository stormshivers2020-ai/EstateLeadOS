export { classifySourceUrl, isGovernmentHostname, isRejectedMarketplaceDomain } from "./source-filter";
export { getSourceRegistry, getAllowedGovernmentSources } from "./source-registry";
export { runGovernmentConnectors, isGovernmentSearchConfigured } from "./connectors";
export { governmentRecordsToCandidates } from "./candidate-mapper";
export { evaluateGovernmentVerification, statusFromGovernmentRecords } from "./verification-engine";
export {
  evaluateSourceCertainty,
  applyCertaintyToNormalizedRecord,
  filterRecordsWithSourceProof,
  MIN_CERTAINTY_FOR_LEAD_QUEUE,
  MIN_CERTAINTY_FOR_PIPELINE_ITEM,
} from "./source-certainty";
export { enrichRecordWithLiveFetch, fetchOfficialSource } from "./live-fetch";
export { extractRecordFields } from "./field-extractor";
export {
  isGovernmentSourcesOnlyEnabled,
  setGovernmentSourcesOnly,
  logRejectedHits,
  getRejectedSources,
} from "./rejected-sources";
