import type { FullLeadDetail, CrmPipelineStage, OwnerHeirInfo } from "@/lib/types/crm";

export interface SupabaseLeadRow {
  id: string;
  organization_id: string;
  property_address: string | null;
  owner_name: string | null;
  state: string | null;
  county: string | null;
  city: string | null;
  zip_code: string | null;
  parcel_id: string | null;
  lead_type: string | null;
  estate_lead_score: number | null;
  deal_potential_score: number | null;
  compliance_risk_score: number | null;
  data_confidence_score: number | null;
  pipeline_status: string | null;
  assigned_user_id: string | null;
  next_action: string | null;
  source_name: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_OWNER_HEIR: OwnerHeirInfo = {
  currentOwnerName: null,
  priorOwnerName: null,
  possibleHeirName: null,
  executorName: null,
  mailingAddress: null,
  propertyAddress: "",
  ownerOccupiedStatus: "unknown",
  outOfStateOwner: "unknown",
  mailingDiffersFromProperty: "unknown",
  relationshipConfidence: 0,
  ownerVerificationStatus: "needs_research",
  heirVerificationStatus: "unknown",
  contactSource: "public_record",
  phone: null,
  email: null,
  consentStatus: "unknown",
  doNotContact: false,
  notes: null,
};

export function mapSupabaseLeadRow(row: SupabaseLeadRow): FullLeadDetail {
  const stage = (row.pipeline_status ?? "new_lead") as CrmPipelineStage;
  const score = row.estate_lead_score ?? 0;

  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyAddress: row.property_address ?? "Address pending",
    street: row.property_address ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    zip: row.zip_code ?? "",
    county: row.county ?? "",
    parcelId: row.parcel_id,
    propertyType: null,
    beds: null,
    baths: null,
    squareFeet: null,
    lotSize: null,
    yearBuilt: null,
    estimatedValue: null,
    taxAssessedValue: null,
    lastSaleDate: null,
    lastSaleAmount: null,
    lastTransferDate: null,
    transferType: null,
    deedType: null,
    mortgageStatus: null,
    mortgageAmount: null,
    mortgageDate: null,
    taxDelinquent: false,
    vacancySignal: false,
    listedStatus: false,
    ownerName: row.owner_name ?? "Owner pending verification",
    possibleHeirName: null,
    mailingAddress: null,
    primaryLeadType: row.lead_type ?? "probate_inherited",
    secondaryLeadTypes: [],
    estateLeadScore: score,
    dealPotentialScore: row.deal_potential_score ?? 0,
    complianceRiskScore: row.compliance_risk_score ?? 0,
    dataConfidenceScore: row.data_confidence_score ?? 0,
    scoreBand: score >= 75 ? "high" : score >= 50 ? "moderate" : "low",
    positiveFactors: [],
    negativeFactors: row.data_confidence_score != null && row.data_confidence_score < 70
      ? ["Source confidence below recommended threshold"]
      : [],
    missingData: ["Complete property research via Nova Guided Workflow"],
    manualVerificationNeeded: ["Owner identity verification"],
    signals: row.source_name
      ? [{ name: row.source_name, category: "source", explanation: "Recorded from approved source path.", confidence: row.data_confidence_score ?? 50 }]
      : [],
    sourceRecords: row.source_name
      ? [{
          id: `src-${row.id}`,
          sourceName: row.source_name,
          sourceType: "public_record",
          sourceUrl: null,
          retrievedAt: row.updated_at,
          reliabilityScore: row.data_confidence_score ?? 50,
          freshnessScore: row.data_confidence_score ?? 50,
          permissionStatus: "approved_manual",
          fieldsProvided: ["property_address", "owner_name"],
        }]
      : [],
    origin: "supabase",
    pipelineStage: stage,
    assignedUserId: row.assigned_user_id,
    assignedUserName: null,
    nextAction: row.next_action ?? "Run Nova Guided Workflow — research and compliance review",
    followUpDate: null,
    lastContactDate: null,
    doNotContact: stage === "do_not_contact",
    dncReason: stage === "do_not_contact" ? "Pipeline stage: do not contact" : null,
    ownerHeir: {
      ...DEFAULT_OWNER_HEIR,
      currentOwnerName: row.owner_name,
      propertyAddress: row.property_address ?? "Address pending",
    },
    demoRecord: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
