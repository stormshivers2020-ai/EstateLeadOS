import type {
  Assignment,
  Buyer,
  BuyerContactLog,
  BuyerImportBatch,
  BuyerMatch,
  DealCalculation,
  DealPotentialScoreRecord,
  DealWorkflowAuditLog,
} from "@/lib/deal-calculator/dealCalculatorTypes";

const ts = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString();

export const DEMO_BUYERS: Buyer[] = [
  {
    id: "buyer-1", organizationId: "demo-org", buyerName: "Jordan Blake",
    company: "Blake Capital RE", email: "j.blake@example-capital.test", phone: "(555) 201-4401",
    preferredStates: ["TX", "FL"], preferredCounties: ["Harris", "Duval", "Orange"],
    preferredCities: ["Houston", "Jacksonville"], preferredZipCodes: ["77009", "32204"],
    propertyTypes: ["Single Family", "Duplex"], maxPrice: 350000, minimumSpread: 15000,
    cashBuyer: true, proofOfFundsOnFile: true, proofOfFundsStatus: "on_file",
    closingSpeed: "7-14 days", buyBoxNotes: "Cash buyer — light rehab, absentee seller leads",
    lastContacted: ts(5), status: "preferred", tags: ["cash", "fast-close", "probate"],
    source: "demo_data", notes: "Fictional demo buyer", createdAt: ts(90), updatedAt: ts(5),
  },
  {
    id: "buyer-2", organizationId: "demo-org", buyerName: "Taylor Chen",
    company: "Chen Home Buyers LLC", email: "t.chen@example-hb.test", phone: "(555) 302-8812",
    preferredStates: ["TX", "NC", "GA"], preferredCounties: ["Harris", "Wake", "Fulton"],
    preferredCities: [], preferredZipCodes: [],
    propertyTypes: ["Single Family", "Townhome"], maxPrice: 280000, minimumSpread: 12000,
    cashBuyer: true, proofOfFundsOnFile: false, proofOfFundsStatus: "requested",
    closingSpeed: "14-21 days", buyBoxNotes: "Prefers estate and inherited property leads",
    lastContacted: ts(12), status: "active", tags: ["estate", "inherited"],
    source: "referral", notes: null, createdAt: ts(60), updatedAt: ts(12),
  },
  {
    id: "buyer-3", organizationId: "demo-org", buyerName: "Morgan Ellis",
    company: null, email: "m.ellis@example-invest.test", phone: null,
    preferredStates: ["FL"], preferredCounties: ["Duval"],
    preferredCities: ["Jacksonville"], preferredZipCodes: ["32204"],
    propertyTypes: ["Single Family"], maxPrice: 200000, minimumSpread: 8000,
    cashBuyer: false, proofOfFundsOnFile: false, proofOfFundsStatus: "unknown",
    closingSpeed: "30+ days", buyBoxNotes: "New contact — needs POF",
    lastContacted: null, status: "new", tags: ["fl-market"],
    source: "manual_entry", notes: "Missing phone — review required", createdAt: ts(3), updatedAt: ts(3),
  },
  {
    id: "buyer-4", organizationId: "demo-org", buyerName: "Riley Park",
    company: "Park Dispositions", email: "r.park@example-disp.test", phone: "(555) 404-2290",
    preferredStates: ["TX", "OH"], preferredCounties: [],
    preferredCities: [], preferredZipCodes: [],
    propertyTypes: ["Multi-Family", "Single Family"], maxPrice: 500000, minimumSpread: 25000,
    cashBuyer: true, proofOfFundsOnFile: true, proofOfFundsStatus: "on_file",
    closingSpeed: "7 days", buyBoxNotes: "High-volume buyer — assignment focus",
    lastContacted: ts(2), status: "preferred", tags: ["assignment", "volume"],
    source: "prior_deal", notes: null, createdAt: ts(120), updatedAt: ts(2),
  },
  {
    id: "buyer-5", organizationId: "demo-org", buyerName: "Casey Wright",
    company: "Wright Holdings", email: "c.wright@example-hold.test", phone: "(555) 505-7733",
    preferredStates: ["NC"], preferredCounties: ["Mecklenburg", "Wake"],
    preferredCities: ["Charlotte"], preferredZipCodes: [],
    propertyTypes: ["Single Family"], maxPrice: 320000, minimumSpread: 18000,
    cashBuyer: true, proofOfFundsOnFile: true, proofOfFundsStatus: "expired",
    closingSpeed: "14 days", buyBoxNotes: "POF expired — needs refresh",
    lastContacted: ts(45), status: "needs_review", tags: ["pof-expired"],
    source: "csv_import", notes: "POF on file but expired", createdAt: ts(200), updatedAt: ts(45),
  },
];

export const DEMO_DEAL_CALCULATIONS: DealCalculation[] = [
  {
    id: "calc-1", organizationId: "demo-org", leadId: "lead-demo-1", createdBy: "Alex Morgan",
    estimatedArv: 285000, estimatedCurrentValue: 245000, taxAssessedValue: 198500,
    estimatedRepairs: 35000, investorDiscountPercentage: 70, holdingCosts: 4500,
    closingCosts: 6000, targetAssignmentSpread: 18000, riskBuffer: 5000,
    buyerType: "Cash investor", investorMaxOffer: 133000, suggestedSellerOffer: 115000,
    offerRangeLow: 110000, offerRangeHigh: 120000, estimatedSpread: 18000,
    confidenceLevel: "moderate", dealPotentialScore: 68,
    notes: "Sample calculation — fictional property", assumptions: [
      "ARV: $285,000 (user-entered)", "Investor discount: 70%", "Repairs: $35,000",
    ], warnings: ["These numbers are estimates based on user-entered assumptions."],
    createdAt: ts(7), updatedAt: ts(7),
  },
  {
    id: "calc-2", organizationId: "demo-org", leadId: "lead-demo-1", createdBy: "Alex Morgan",
    estimatedArv: 290000, estimatedCurrentValue: 245000, taxAssessedValue: 198500,
    estimatedRepairs: 30000, investorDiscountPercentage: 72, holdingCosts: 4000,
    closingCosts: 5500, targetAssignmentSpread: 20000, riskBuffer: 4000,
    buyerType: "Cash investor", investorMaxOffer: 149900, suggestedSellerOffer: 129900,
    offerRangeLow: 125900, offerRangeHigh: 133900, estimatedSpread: 20000,
    confidenceLevel: "high", dealPotentialScore: 74,
    notes: "Updated ARV assumption", assumptions: ["ARV increased to $290,000"],
    warnings: ["Estimates only — not guaranteed profit."],
    createdAt: ts(2), updatedAt: ts(2),
  },
  {
    id: "calc-3", organizationId: "demo-org", leadId: "lead-demo-2", createdBy: "Alex Morgan",
    estimatedArv: 195000, estimatedCurrentValue: 165000, taxAssessedValue: 142000,
    estimatedRepairs: 28000, investorDiscountPercentage: 68, holdingCosts: 3500,
    closingCosts: 5000, targetAssignmentSpread: 12000, riskBuffer: 3000,
    buyerType: "Assignment buyer", investorMaxOffer: 91640, suggestedSellerOffer: 79640,
    offerRangeLow: 76640, offerRangeHigh: 82640, estimatedSpread: 12000,
    confidenceLevel: "low", dealPotentialScore: 52,
    notes: "FL elevated compliance — review required", assumptions: ["FL assignment workflow"],
    warnings: ["Elevated compliance risk in FL"],
    createdAt: ts(10), updatedAt: ts(10),
  },
];

export const DEMO_DEAL_POTENTIAL: DealPotentialScoreRecord[] = [
  {
    id: "dps-1", organizationId: "demo-org", leadId: "lead-demo-1",
    score: 74, scoreBand: "Strong Potential",
    positiveFactors: ["Estimated equity appears strong", "Vacancy signal present", "Buyer demand appears strong", "High data confidence"],
    negativeFactors: ["Heir contact not verified"],
    missingData: ["Probate case number"],
    riskFactors: ["User-entered assumptions"],
    confidenceLevel: "moderate", calculatedAt: ts(2), calculatedBy: "Alex Morgan",
  },
  {
    id: "dps-2", organizationId: "demo-org", leadId: "lead-demo-2",
    score: 52, scoreBand: "Moderate Potential",
    positiveFactors: ["Out-of-state owner signal"],
    negativeFactors: ["Compliance risk is elevated", "Buyer demand unknown"],
    missingData: ["Repair estimate confirmation"],
    riskFactors: ["FL assignment disclosure requirements"],
    confidenceLevel: "low", calculatedAt: ts(10), calculatedBy: "Alex Morgan",
  },
];

export const DEMO_BUYER_MATCHES: BuyerMatch[] = [
  {
    id: "match-1", organizationId: "demo-org", leadId: "lead-demo-1", buyerId: "buyer-1",
    matchScore: 88, matchBand: "Priority Match",
    whyMatched: ["State match: TX", "County fit: Harris", "Proof of funds on file", "Cash buyer"],
    missingInfo: [], proofOfFundsStatus: "on_file", lastContacted: ts(5),
    suggestedNextStep: "Contact buyer about potential contract interest — use contract-interest language.",
    createdAt: ts(5), updatedAt: ts(5),
  },
  {
    id: "match-2", organizationId: "demo-org", leadId: "lead-demo-1", buyerId: "buyer-4",
    matchScore: 76, matchBand: "Strong Match",
    whyMatched: ["State match: TX", "Cash buyer", "Recently contacted"],
    missingInfo: ["County not in preferred list"],
    proofOfFundsStatus: "on_file", lastContacted: ts(2),
    suggestedNextStep: "Review buy box fit and confirm buyer interest.",
    createdAt: ts(5), updatedAt: ts(5),
  },
  {
    id: "match-3", organizationId: "demo-org", leadId: "lead-demo-2", buyerId: "buyer-3",
    matchScore: 45, matchBand: "Possible Match",
    whyMatched: ["State match: FL", "County fit: Duval"],
    missingInfo: ["Proof of funds status unknown", "Buyer max price not confirmed"],
    proofOfFundsStatus: "unknown", lastContacted: null,
    suggestedNextStep: "Request proof of funds before sharing contract interest details.",
    createdAt: ts(8), updatedAt: ts(8),
  },
];

export const DEMO_ASSIGNMENTS: Assignment[] = [
  {
    id: "asgn-1", organizationId: "demo-org", leadId: "lead-demo-1", buyerId: "buyer-1",
    sellerName: "Estate of M. Richardson",
    originalPurchasePrice: 115000, buyerAssignmentPrice: 133000,
    estimatedAssignmentSpread: 18000, actualAssignmentFee: null,
    earnestMoney: 2000, titleCompany: "Lone Star Title Co.",
    closingDate: null, requiredDisclosures: ["Assignment disclosure", "Seller disclosure ack"],
    signedDocuments: ["Compliance acknowledgement"],
    complianceStatus: "acknowledged", attorneyTitleReviewStatus: "recommended",
    assignmentStage: "buyer_interest_confirmed", notes: "Demo assignment — estimated spread only",
    assignedUserName: "Alex Morgan", hasBlocker: true,
    createdAt: ts(14), updatedAt: ts(3),
  },
  {
    id: "asgn-2", organizationId: "demo-org", leadId: "lead-demo-2", buyerId: "buyer-3",
    sellerName: "Heirs of J. Whitfield",
    originalPurchasePrice: 79640, buyerAssignmentPrice: 91640,
    estimatedAssignmentSpread: 12000, actualAssignmentFee: null,
    earnestMoney: null, titleCompany: null,
    closingDate: null, requiredDisclosures: ["FL assignment disclosure", "Buyer assignee disclosure"],
    signedDocuments: [],
    complianceStatus: "needs_review", attorneyTitleReviewStatus: "required",
    assignmentStage: "buyer_match_started", notes: "FL elevated risk — attorney review recommended",
    assignedUserName: "Alex Morgan", hasBlocker: true,
    createdAt: ts(20), updatedAt: ts(5),
  },
  {
    id: "asgn-3", organizationId: "demo-org", leadId: "lead-demo-3", buyerId: null,
    sellerName: "Estate of R. Patterson",
    originalPurchasePrice: null, buyerAssignmentPrice: null,
    estimatedAssignmentSpread: null, actualAssignmentFee: null,
    earnestMoney: null, titleCompany: null,
    closingDate: null, requiredDisclosures: [],
    signedDocuments: [],
    complianceStatus: "not_started", attorneyTitleReviewStatus: "not_required",
    assignmentStage: "lead_under_contract", notes: "Early stage — no buyer selected",
    assignedUserName: "Alex Morgan", hasBlocker: false,
    createdAt: ts(1), updatedAt: ts(1),
  },
];

export const DEMO_BUYER_IMPORT_BATCH: BuyerImportBatch = {
  id: "import-1", organizationId: "demo-org", uploadedBy: "Alex Morgan",
  fileName: "demo-buyers-import.csv", totalRows: 8, validRows: 6, invalidRows: 2,
  buyersCreated: 3, buyersUpdated: 2, duplicatesFound: 1, missingContactInfo: 2,
  proofOfFundsMissing: 3, rowsRequiringReview: 2,
  errors: ["Row 4: invalid email format", "Row 7: duplicate buyer name"],
  createdAt: ts(30),
};

export const DEMO_BUYER_CONTACTS: BuyerContactLog[] = [
  {
    id: "bcl-1", organizationId: "demo-org", leadId: "lead-demo-1", buyerId: "buyer-1",
    userId: "demo-user", contactMethod: "email", templateUsedId: "bot-new-opportunity",
    messageSnapshot: "Contract interest at 1842 Oakwood Dr...",
    outcome: "sent_message", notes: "Used contract-interest language", createdAt: ts(5),
  },
];

export const DEMO_DEAL_WORKFLOW_AUDIT: DealWorkflowAuditLog[] = [
  {
    id: "dwa-1", organizationId: "demo-org", userId: "demo-user", userName: "Alex Morgan",
    leadId: "lead-demo-1", assignmentId: "asgn-1", buyerId: "buyer-1",
    actionType: "calculation_saved", actionDescription: "Deal calculation saved — estimated spread $18,000",
    previousValue: null, newValue: "calc-2", timestamp: ts(2),
  },
  {
    id: "dwa-2", organizationId: "demo-org", userId: "demo-user", userName: "Alex Morgan",
    leadId: "lead-demo-1", assignmentId: "asgn-1", buyerId: "buyer-1",
    actionType: "buyer_matched", actionDescription: "Buyer Jordan Blake matched to lead — Priority Match (88)",
    previousValue: null, newValue: "match-1", timestamp: ts(5),
  },
  {
    id: "dwa-3", organizationId: "demo-org", userId: "demo-user", userName: "Alex Morgan",
    leadId: "lead-demo-1", assignmentId: "asgn-1", buyerId: null,
    actionType: "assignment_stage", actionDescription: "Assignment moved to Buyer Interest Confirmed",
    previousValue: "buyer_match_started", newValue: "buyer_interest_confirmed", timestamp: ts(3),
  },
];
