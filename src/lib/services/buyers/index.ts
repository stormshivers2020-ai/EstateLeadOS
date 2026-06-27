import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { getDataProvider } from "@/lib/data/dataProviderFactory";

const p = () => getDataProvider();
import { matchBuyersToLead } from "@/lib/engines/buyer-matching-engine";
import { validateBuyerMatchingStage } from "@/lib/engines/assignment-workflow-guard";
import { BUYER_OUTREACH_TEMPLATES } from "@/lib/constants/buyer-outreach-templates";
import { checkOutreachSafetyGuard } from "@/lib/engines/outreach-safety-guard";
import type { Buyer, BuyerImportBatch, BuyerMatch, BuyerContactLog } from "@/lib/deal-calculator/dealCalculatorTypes";
import {
  DEMO_BUYER_IMPORT_BATCH,
  DEMO_BUYER_CONTACTS,
} from "@/lib/seed/demo-deal-workflow";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLatestCalculation } from "@/lib/services/deal-calculator";
import { validateDocumentStageChange } from "@/lib/services/documents";
import { runLeadComplianceCheck, getLeadComplianceContext } from "@/lib/services/compliance";
import type { DealType, AcquisitionStrategy } from "@/lib/types/compliance";

export function getBuyers(filters?: {
  status?: string;
  state?: string;
  needsPof?: boolean;
  view?: string;
}): Buyer[] {
  let buyers = shouldLoadSeedData() ? [...p().dealWorkflow.getBuyers()] : [];

  if (filters?.status) buyers = buyers.filter((b) => b.status === filters.status);
  if (filters?.state) buyers = buyers.filter((b) => b.preferredStates.includes(filters.state!));
  if (filters?.needsPof) buyers = buyers.filter((b) => b.proofOfFundsStatus !== "on_file");
  if (filters?.view === "active") buyers = buyers.filter((b) => b.status === "active" || b.status === "preferred");
  if (filters?.view === "preferred") buyers = buyers.filter((b) => b.status === "preferred");
  if (filters?.view === "inactive") buyers = buyers.filter((b) => b.status === "inactive" || b.status === "archived");
  if (filters?.view === "recent") {
    buyers = buyers.filter((b) => b.lastContacted).sort(
      (a, b) => new Date(b.lastContacted!).getTime() - new Date(a.lastContacted!).getTime()
    );
  }

  return buyers.filter((b) => b.status !== "archived");
}

export function getBuyerById(id: string): Buyer | null {
  return getBuyers().find((b) => b.id === id) ?? null;
}

export function getBuyerMatchesForLead(leadId: string): BuyerMatch[] {
  if (shouldLoadSeedData()) {
    return p().dealWorkflow.getBuyerMatches().filter((m) => m.leadId === leadId);
  }
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) return [];
  const latest = getLatestCalculation(leadId);
  const matches = matchBuyersToLead(getBuyers(), lead, latest?.estimatedArv);
  const now = new Date().toISOString();
  return matches.map((m, i) => ({
    ...m,
    id: `match-live-${i}`,
    organizationId: lead.organizationId,
    createdAt: now,
    updatedAt: now,
  }));
}

export function getBuyerImportBatches(): BuyerImportBatch[] {
  return shouldLoadSeedData() ? [DEMO_BUYER_IMPORT_BATCH] : [];
}

export function getBuyerContactLogs(buyerId?: string): BuyerContactLog[] {
  const logs = shouldLoadSeedData() ? DEMO_BUYER_CONTACTS : [];
  return buyerId ? logs.filter((l) => l.buyerId === buyerId) : logs;
}

export function getBuyerOutreachTemplates() {
  return BUYER_OUTREACH_TEMPLATES.filter((t) => t.active);
}

export function checkBuyerOutreachSafety(content: string) {
  return checkOutreachSafetyGuard(content, {
    doNotContact: false,
    stateOutreachWarningReviewed: true,
    dncReminderAcknowledged: true,
    contactSourceAttached: true,
    consentStatus: "unknown",
    templateToneApproved: true,
  });
}

export function validateBuyerMatchingForLead(leadId: string): {
  allowed: boolean;
  message: string | null;
  missingItems: string[];
} {
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) return { allowed: false, message: "Lead not found", missingItems: [] };

  const ctx = getLeadComplianceContext(leadId);
  let complianceCheck = null;
  if (ctx) {
    complianceCheck = runLeadComplianceCheck({
      stateAbbr: lead.state,
      countyName: lead.county,
      dealType: (ctx.dealType ?? "assignment_of_contract") as DealType,
      acquisitionStrategy: (ctx.acquisitionStrategy ?? "assignment") as AcquisitionStrategy,
      leadId,
      ownerIdentityVerified: ctx.ownerIdentityVerified,
      sourceDocumentsAttached: ctx.sourceDocumentsAttached,
      communicationLogActive: true,
      acknowledgementsComplete: ctx.acknowledgements.length > 0,
    });
  }

  const docCheck = validateDocumentStageChange(leadId, "buyer_matching");
  const docBlockers = docCheck.allowed ? 0 : docCheck.blockers.length;

  return validateBuyerMatchingStage({
    complianceCheck,
    documentBlockers: docBlockers,
    acknowledgementsComplete: ctx?.acknowledgements.length ? true : false,
  });
}

export function getBuyerNetworkOverview() {
  const buyers = getBuyers();
  return {
    totalBuyers: buyers.length,
    activeBuyers: buyers.filter((b) => b.status === "active" || b.status === "preferred").length,
    needsPof: buyers.filter((b) => b.proofOfFundsStatus !== "on_file").length,
    preferredBuyers: buyers.filter((b) => b.status === "preferred").length,
  };
}

export interface BuyerCsvRow {
  buyerName: string;
  company?: string;
  email?: string;
  phone?: string;
  preferredStates?: string;
  preferredCounties?: string;
  propertyTypes?: string;
  maxPrice?: string;
  minimumSpread?: string;
  cashBuyer?: string;
  proofOfFundsStatus?: string;
  closingSpeed?: string;
  tags?: string;
  notes?: string;
}

export function simulateBuyerCsvImport(rows: BuyerCsvRow[]): BuyerImportBatch {
  let valid = 0;
  let invalid = 0;
  let missingContact = 0;
  let pofMissing = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.buyerName) {
      invalid++;
      errors.push(`Row ${i + 1}: missing buyer name`);
      continue;
    }
    if (!row.email && !row.phone) {
      missingContact++;
    }
    if (!row.proofOfFundsStatus || row.proofOfFundsStatus === "unknown") {
      pofMissing++;
    }
    if (row.email && !row.email.includes("@")) {
      invalid++;
      errors.push(`Row ${i + 1}: invalid email`);
      continue;
    }
    valid++;
  }

  return {
    id: `import-${Date.now()}`,
    organizationId: "demo-org",
    uploadedBy: "demo-user",
    fileName: "upload.csv",
    totalRows: rows.length,
    validRows: valid,
    invalidRows: invalid,
    buyersCreated: valid,
    buyersUpdated: 0,
    duplicatesFound: 0,
    missingContactInfo: missingContact,
    proofOfFundsMissing: pofMissing,
    rowsRequiringReview: missingContact + pofMissing,
    errors,
    createdAt: new Date().toISOString(),
  };
}
