import type { GovernmentNormalizedRecord } from "@/lib/types/government";
import type { LeadSearchCandidate } from "@/lib/services/lead-discovery/types";
import { statusFromGovernmentRecords } from "./verification-engine";

export function governmentRecordsToCandidates(
  records: GovernmentNormalizedRecord[],
  market: { state: string; county: string; city?: string }
): LeadSearchCandidate[] {
  const candidates: LeadSearchCandidate[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    if (record.hasSourceProof === false) continue;
    if ((record.sourceCertaintyScore ?? record.confidenceScore) < 50) continue;

    const address =
      record.propertyAddress ??
      (record.decedentName ? `Estate research — ${market.county}, ${market.state}` : null);
    if (!address) continue;

    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const signals: string[] = [];
    if (record.estateCaseNumber) signals.push(`Estate case ${record.estateCaseNumber}`);
    if (record.deedReference) signals.push(`Deed/instrument ${record.deedReference}`);
    if (record.decedentName) signals.push(`Decedent: ${record.decedentName}`);
    if (record.personalRepresentative) signals.push(`Personal representative: ${record.personalRepresentative}`);
    signals.push(`Official source: ${record.sourceName}`);
    if (record.sourceCertaintyScore) signals.push(`Source certainty: ${record.sourceCertaintyScore}/100`);
    if (record.fetchMethod === "live_http") signals.push("Live official URL verified");
    if (record.fetchMethod === "arcgis_api") signals.push("ArcGIS live parcel data");

    const govStatus = statusFromGovernmentRecords([record.sourceType, record.recordType]);

    candidates.push({
      propertyAddress: address,
      ownerName: record.decedentName ?? record.ownerName ?? record.personalRepresentative ?? null,
      state: market.state,
      county: market.county,
      city: market.city ?? null,
      leadType: record.sourceType.includes("probate") ? "possible_probate_lead" : "government_record_lead",
      sourceUrl: record.sourceUrl,
      sourceTitle: record.title,
      snippet: record.snippet,
      estateLeadScore: record.confidenceScore,
      dealPotentialScore: Math.min(85, record.confidenceScore - 5),
      complianceRiskScore: 35,
      dataConfidenceScore: record.confidenceScore,
      signals,
      governmentRecord: record,
      governmentVerificationStatus: govStatus,
      isGovernmentSource: true,
    });
  }

  return candidates.sort((a, b) => b.estateLeadScore - a.estateLeadScore);
}
