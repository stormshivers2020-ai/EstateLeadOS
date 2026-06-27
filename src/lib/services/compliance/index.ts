import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { getDataProvider } from "@/lib/data/dataProviderFactory";
import {
  buildDocumentChecklist,
  buildEquipmentChecklist,
  buildGettingStartedChecklist,
} from "@/lib/constants/compliance-templates";
import { runComplianceCheck } from "@/lib/engines/compliance-rules-engine";
import {
  generateAllStateProfiles,
} from "@/lib/seed/demo-compliance";

const p = () => getDataProvider();
import type {
  AcquisitionStrategy,
  ComplianceAcknowledgement,
  ComplianceAuditLogEntry,
  ComplianceCheckResult,
  CountyProfile,
  DealType,
  LeadComplianceContext,
  StateDealKit,
  StateProfile,
  WorkflowBlocker,
} from "@/lib/types/compliance";

const stateProfiles = generateAllStateProfiles();

export function getStateProfiles(): StateProfile[] {
  return stateProfiles;
}

export function getStateProfile(abbr: string): StateProfile | undefined {
  return stateProfiles.find((s) => s.stateAbbreviation === abbr);
}

export function getCountiesForState(abbr: string): CountyProfile[] {
  if (!shouldLoadSeedData()) {
    return [];
  }
  return p().compliance.getCounties().filter((c) => c.stateAbbreviation === abbr);
}

export function getCountyProfile(stateAbbr: string, countyName: string): CountyProfile | undefined {
  return getCountiesForState(stateAbbr).find(
    (c) => c.countyName.toLowerCase() === countyName.toLowerCase()
  );
}

export function buildStateDealKit(params: {
  stateAbbr: string;
  countyName: string | null;
  dealType: DealType;
  userRole: string;
  acquisitionStrategy: AcquisitionStrategy;
}): StateDealKit | null {
  const state = getStateProfile(params.stateAbbr);
  if (!state) return null;

  const county = params.countyName
    ? getCountyProfile(params.stateAbbr, params.countyName)
    : null;

  const stateRiskElevated = ["elevated", "high", "restricted", "attorney_review_required"].includes(
    state.riskRating
  );

  const equipment = buildEquipmentChecklist(params.dealType, stateRiskElevated);
  const documents = buildDocumentChecklist(params.dealType);
  const gettingStarted = buildGettingStartedChecklist();

  const warnings = [...state.userWarnings];
  if (county) {
    if (county.supportedStatus === "manual_upload_only") {
      warnings.push(`County ${county.countyName} is manual upload only. Use CSV import.`);
    }
    if (["blocked", "unknown", "research_only"].includes(county.supportedStatus)) {
      warnings.push(`County ${county.countyName} blocks automated data pulling.`);
    }
  }

  return {
    id: `kit-${params.stateAbbr}-${params.countyName ?? "all"}-${params.dealType}`,
    stateProfileId: state.id,
    countyProfileId: county?.id ?? null,
    stateAbbreviation: params.stateAbbr,
    countyName: params.countyName,
    dealType: params.dealType,
    userRole: params.userRole,
    acquisitionStrategy: params.acquisitionStrategy,
    riskLevel: county ? maxRisk(state.riskRating, county.countyRiskRating) : state.riskRating,
    supportStatus: state.supportedStatus,
    gettingStarted,
    equipmentChecklist: equipment,
    documentChecklist: documents,
    outreachRules: [
      "Use respectful, non-predatory language in all outreach",
      "Never reference grief or death directly in initial contact",
      "Screen against Do Not Call lists before calling",
      state.outreachCaution,
    ],
    contractWorkflow: [
      "Verify owner/heir authority before contract",
      "Select appropriate purchase or assignment workflow",
      "Review disclosure requirements with qualified professional",
      state.assignmentContractNotes,
    ],
    disclosureWorkflow: [
      ...state.sellerDisclosureChecklist.map((d) => `Seller: ${d}`),
      ...state.buyerAssigneeDisclosureChecklist.map((d) => `Buyer/Assignee: ${d}`),
    ],
    titleCompanyWorkflow: [
      "Select licensed title company",
      state.titleCompanyNotes,
      "Submit title company intake form",
      "Confirm recording requirements with title company",
    ],
    assignmentWorkflow: [
      state.marketingContractInterestWarning,
      "Complete assignment disclosure checklist",
      "Confirm buyer/assignee disclosures where applicable",
      "Market contract interest only — not the property",
    ],
    closingWorkflow: [
      "Review closing checklist",
      "Confirm all required documents signed",
      "Export communication log",
      "Attach source document packet",
    ],
    riskWarnings: warnings,
    attorneyReviewReminder:
      "Attorney/title company review is strongly recommended. EstateLeadOS cannot confirm legal compliance. Confirm with a qualified professional before proceeding.",
    sourceLinks: [
      ...state.legalSourceLinks,
      ...(county?.sourceLinks ?? []),
    ],
    auditTrailRequirements: [
      "Log all outreach attempts",
      "Record compliance acknowledgements",
      "Attach source documents",
      "Track document status changes",
      "Record workflow stage changes",
    ],
    warnings,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function maxRisk(
  a: StateProfile["riskRating"],
  b: CountyProfile["countyRiskRating"]
): StateProfile["riskRating"] {
  const order = ["low", "moderate", "elevated", "high", "restricted", "attorney_review_required"];
  return order.indexOf(a) >= order.indexOf(b) ? a : (b as StateProfile["riskRating"]);
}

export function runLeadComplianceCheck(params: {
  stateAbbr: string;
  countyName: string | null;
  dealType: DealType;
  acquisitionStrategy: AcquisitionStrategy;
  leadId?: string;
  ownerIdentityVerified?: boolean;
  sourceDocumentsAttached?: boolean;
  communicationLogActive?: boolean;
  acknowledgementsComplete?: boolean;
}): ComplianceCheckResult | null {
  const state = getStateProfile(params.stateAbbr);
  if (!state) return null;

  const county = params.countyName
    ? getCountyProfile(params.stateAbbr, params.countyName)
    : null;

  const kit = buildStateDealKit({
    stateAbbr: params.stateAbbr,
    countyName: params.countyName,
    dealType: params.dealType,
    userRole: "solo_investor",
    acquisitionStrategy: params.acquisitionStrategy,
  });
  if (!kit) return null;

  return runComplianceCheck({
    state,
    county: county ?? null,
    dealType: params.dealType,
    acquisitionStrategy: params.acquisitionStrategy,
    equipmentChecklist: kit.equipmentChecklist,
    documentChecklist: kit.documentChecklist,
    ownerIdentityVerified: params.ownerIdentityVerified ?? false,
    sourceDocumentsAttached: params.sourceDocumentsAttached ?? false,
    communicationLogActive: params.communicationLogActive ?? false,
    acknowledgementsComplete: params.acknowledgementsComplete ?? false,
    unknownSourceTerms: county?.supportedStatus === "unknown",
    leadId: params.leadId,
    organizationId: "demo-org",
    checkedBy: "demo-user",
  });
}

export function getComplianceOverview() {
  const demo = shouldLoadSeedData();
  return {
    leadsNeedingReview: demo ? 3 : 0,
    elevatedRiskLeads: demo ? 2 : 0,
    highRiskLeads: demo ? 1 : 0,
    restrictedLeads: demo ? 1 : 0,
    attorneyReviewRequired: demo ? 2 : 0,
    missingAcknowledgements: demo ? 2 : 0,
    missingDocuments: demo ? 3 : 0,
    missingEquipment: demo ? 2 : 0,
    unknownRules: demo ? 1 : 0,
    sourceWarnings: demo ? 4 : 0,
    assignmentBlockers: demo ? 1 : 0,
    outreachBlockers: demo ? 1 : 0,
  };
}

export function getActiveBlockers(): WorkflowBlocker[] {
  return shouldLoadSeedData() ? p().compliance.getBlockers() : [];
}

export function getAcknowledgements(): ComplianceAcknowledgement[] {
  return shouldLoadSeedData() ? p().compliance.getAcknowledgements() : [];
}

export function getComplianceAuditLog(): ComplianceAuditLogEntry[] {
  return shouldLoadSeedData() ? [] : [];
}

export function getLeadComplianceContext(leadId: string): LeadComplianceContext | null {
  if (!shouldLoadSeedData()) return null;
  return p().compliance.getLeadCompliance().find((l) => l.leadId === leadId) ?? null;
}


export function getStateRiskMap() {
  return getStateProfiles().map((s) => ({
    state: s.stateAbbreviation,
    stateName: s.stateName,
    supportedStatus: s.supportedStatus,
    complianceReviewStatus: s.complianceReviewStatus,
    riskRating: s.riskRating,
    dataAvailability: s.dataAvailabilityRating,
    lastReviewedAt: s.lastReviewedAt,
    attorneyReviewStatus: s.attorneyReviewStatus,
    activeLeads: shouldLoadSeedData()
      ? p().compliance.getLeadCompliance().filter((l) => l.stateAbbreviation === s.stateAbbreviation).length
      : 0,
    blockedLeads: shouldLoadSeedData()
      ? p().compliance.getBlockers().filter(
          (b) => b.stateProfileId === s.id && b.status === "active"
        ).length
      : 0,
  }));
}
