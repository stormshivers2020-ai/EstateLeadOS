import type { NormalizedGovernmentRecord } from "@/lib/record-sources/types";
import type { LeadPipelineStage } from "@/lib/types/pipeline";

export interface ConfidenceBreakdown {
  total: number;
  items: Array<{ label: string; points: number }>;
}

export function scorePipelineRecord(record: NormalizedGovernmentRecord): ConfidenceBreakdown {
  const items: Array<{ label: string; points: number }> = [];
  let total = 0;

  function add(label: string, points: number) {
    if (points <= 0) return;
    items.push({ label, points });
    total += points;
  }

  if (/probate|estate|wills/i.test(record.source_type) && record.estate_case_number) {
    add("Official estate/probate case match", 25);
  } else if (/probate|estate|wills/i.test(record.source_type) && record.decedent_name) {
    add("Official estate/probate signal", 20);
  }

  if (record.decedent_name && record.owner_name && record.decedent_name === record.owner_name) {
    add("Decedent name matches property owner", 25);
  }

  if (/property_assessment|tax_record|gis/i.test(record.source_type) && record.property_address) {
    add("Property address on official assessment/tax/GIS", 20);
  }

  if (record.deed_reference || /deed|land_record/i.test(record.source_type)) {
    add("Deed/transfer record found", 15);
  }

  if (record.personal_representative) {
    add("Personal representative in official estate source", 20);
  }

  if (/gis|assessor/i.test(record.source_type) && record.media_url) {
    add("Property visual from official GIS/assessor", 10);
  }

  if (record.mailing_address && /official|gov|probate|assessor|deed/i.test(record.source_type)) {
    add("Mailing address from official source", 10);
  }

  if (/enrichment|people-search/i.test(record.source_type)) {
    add("Phone/email enrichment only (unverified cap)", Math.min(5, record.confidence_score));
  }

  return { total: Math.min(100, total), items };
}

export function derivePipelineStage(
  records: NormalizedGovernmentRecord[],
  confidence: number
): LeadPipelineStage {
  const types = records.map((r) => r.source_type).join(" ");
  const hasEstate = /probate|estate/i.test(types) || records.some((r) => r.decedent_name);
  const hasProperty = records.some((r) => r.property_address && /property|tax|gis|assessment/i.test(r.source_type));
  const hasDeed = records.some((r) => r.deed_reference || /deed|land/i.test(r.source_type));
  const hasPerson = records.some((r) => r.personal_representative || r.decedent_name);
  const hasContact = records.some((r) => r.mailing_address);
  const hasVisual = records.some((r) => r.media_url || /gis/i.test(r.source_type));

  if (confidence >= 85 && hasEstate && hasProperty && hasDeed && hasPerson) {
    return "ready_for_manual_review";
  }
  if (hasContact) return "contact_candidate_found";
  if (hasVisual) return "property_visual_added";
  if (hasPerson) return "possible_heir_or_representative_found";
  if (hasDeed) return "deed_transfer_checked";
  if (hasProperty) return "property_match_found";
  if (records.some((r) => r.decedent_name)) return "decedent_identified";
  if (hasEstate) return "estate_signal_found";
  return "new_government_signal";
}

export function canVerifyGovernmentLead(input: {
  confidence: number;
  hasEstateSource: boolean;
  hasPropertySource: boolean;
  hasDeedCheck: boolean;
  hasPerson: boolean;
  hasVisual: boolean;
  hasCitations: boolean;
  manuallyApproved: boolean;
}): boolean {
  return (
    input.confidence >= 85 &&
    input.hasEstateSource &&
    input.hasPropertySource &&
    input.hasDeedCheck &&
    input.hasPerson &&
    input.hasVisual &&
    input.hasCitations &&
    input.manuallyApproved
  );
}
