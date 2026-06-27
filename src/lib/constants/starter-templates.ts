import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import type { DocumentTemplate } from "@/lib/types/documents";

const DISCLAIMER = GLOBAL_DISCLAIMER;
const ATTORNEY_REMINDER = "Attorney/title company review is strongly recommended. EstateLeadOS cannot confirm legal compliance. Confirm with a qualified professional before proceeding.";
const ts = "2025-10-01T00:00:00Z";

function tpl(
  id: string,
  documentTypeId: string,
  name: string,
  category: DocumentTemplate["category"],
  body: string,
  checklistItems: string[],
  opts: Partial<DocumentTemplate> = {}
): DocumentTemplate {
  return {
    id,
    organizationId: null,
    templateName: name,
    documentTypeId,
    category,
    stateId: null,
    countyId: null,
    dealType: null,
    requiredPlan: null,
    variables: ["property_address", "owner_name", "state", "county", "date", "disclaimer", "attorney_review_reminder"],
    body,
    disclaimer: DISCLAIMER,
    reviewStatus: "approved",
    lastReviewedAt: ts,
    version: 1,
    active: true,
    attorneyReviewed: opts.attorneyReviewed ?? false,
    attorneyReviewNotes: null,
    internalNotes: "SCS Nova starter workflow template — not legal advice",
    purpose: opts.purpose ?? `Workflow template for ${name}`,
    checklistItems,
    ...opts,
  };
}

export const STARTER_TEMPLATES: DocumentTemplate[] = [
  tpl("stpl-seller-intake", "seller_intake_form", "Seller Intake Form", "seller_documents",
    `# Seller Intake Form — Workflow Template\n\nProperty: {{property_address}}\nOwner: {{owner_name}}\nState/County: {{state}} / {{county}}\nDate: {{date}}\n\n## Intake Fields\n- [ ] Owner name verified\n- [ ] Contact method recorded\n- [ ] Property address confirmed\n- [ ] Mailing address confirmed\n- [ ] Motivation notes (user-entered)\n- [ ] Authorized contact confirmed\n\n{{disclaimer}}\n{{attorney_review_reminder}}`,
    ["Owner name verified", "Contact method recorded", "Property address confirmed"]),

  tpl("stpl-owner-heir", "owner_heir_verification", "Owner/Heir Verification Checklist", "compliance_documents",
    `# Owner/Heir Verification Checklist\n\nProperty: {{property_address}}\nOwner: {{owner_name}}\nPossible Heir: {{possible_heir_name}}\n\n## Verification Steps\n- [ ] Public record ownership verified\n- [ ] Probate status researched\n- [ ] Heir relationship documented\n- [ ] Authorized contact identified\n- [ ] Contact source attached\n- [ ] Conflicting data flagged\n\n{{disclaimer}}`,
    ["Public record verified", "Probate status researched", "Authorized contact identified"]),

  tpl("stpl-property-research", "property_research_worksheet", "Property Research Worksheet", "internal_worksheets",
    `# Property Research Worksheet\n\nAddress: {{property_address}}\nParcel: {{parcel_id}}\nState: {{state}} / {{county}}\n\n## Research Items\n- [ ] Tax assessed value: ___\n- [ ] Estimated ARV: {{estimated_arv}}\n- [ ] Estimated repairs: {{estimated_repairs}}\n- [ ] Vacancy status confirmed\n- [ ] Comparable sales reviewed\n- [ ] Source records attached\n\nEstate Lead Score: {{estate_lead_score}}/100\n\n{{disclaimer}}`,
    ["Tax value", "ARV estimate", "Repair estimate", "Comps reviewed"]),

  tpl("stpl-probate", "probate_status_checklist", "Probate Status Checklist", "compliance_documents",
    `# Probate Status Checklist\n\nProperty: {{property_address}}\nOwner: {{owner_name}}\nState: {{state}}\n\n## Probate Research\n- [ ] Probate case searched\n- [ ] Case number if found: ___\n- [ ] Executor identified\n- [ ] Court access method documented\n- [ ] Attorney review recommended\n\n{{disclaimer}}\n{{attorney_review_reminder}}`,
    ["Probate case searched", "Executor identified", "Court access documented"], { attorneyReviewed: true }),

  tpl("stpl-lead-source", "lead_source_record", "Lead Source Record", "source_records",
    `# Lead Source Record\n\nLead: {{property_address}}\nLead Type: {{lead_type}}\nData Confidence: {{data_confidence_score}}/100\n\n## Sources Used\n- [ ] Source name\n- [ ] Permission status\n- [ ] Retrieved date\n- [ ] Fields provided\n- [ ] Reliability score\n\n{{disclaimer}}`,
    ["Source documented", "Permission status recorded"]),

  tpl("stpl-purchase-offer", "purchase_offer_worksheet", "Purchase Offer Worksheet", "internal_worksheets",
    `# Purchase Offer Worksheet — NOT A BINDING CONTRACT\n\nProperty: {{property_address}}\nEstimated ARV: {{estimated_arv}}\nEstimated Repairs: {{estimated_repairs}}\nOffer Amount: {{offer_amount}}\n\n## Calculation Notes\n- User-entered assumptions only\n- Not a guaranteed offer\n- Review with qualified professional\n\n{{disclaimer}}`,
    ["ARV entered", "Repairs estimated", "Offer range calculated"]),

  tpl("stpl-repair", "repair_estimate_worksheet", "Repair Estimate Worksheet", "internal_worksheets",
    `# Repair Estimate Worksheet\n\nProperty: {{property_address}}\nEstimated Repairs: {{estimated_repairs}}\n\n## Repair Categories\n- [ ] Roof\n- [ ] HVAC\n- [ ] Plumbing\n- [ ] Electrical\n- [ ] Cosmetic\n- [ ] Structural (flag for inspection)\n\n{{disclaimer}}`,
    ["Repair categories estimated"]),

  tpl("stpl-comps", "comparable_sales_worksheet", "Comparable Sales Worksheet", "internal_worksheets",
    `# Comparable Sales Worksheet\n\nSubject: {{property_address}}\nState: {{state}} / {{county}}\n\n## Comparables\n| Address | Sale Date | Sale Price | Adjustments |\n|---------|-----------|------------|-------------|\n| Comp 1  |           |            |             |\n| Comp 2  |           |            |             |\n| Comp 3  |           |            |             |\n\n{{disclaimer}}`,
    ["3+ comparables identified"]),

  tpl("stpl-max-offer", "max_allowable_offer_worksheet", "Max Allowable Offer Worksheet", "internal_worksheets",
    `# Max Allowable Offer Worksheet\n\nARV: {{estimated_arv}} | Repairs: {{estimated_repairs}}\nMax Offer: ___ (user-calculated)\n\nPhase 6 Deal Calculator will expand this worksheet.\n\n{{disclaimer}}`,
    ["Max offer calculated from assumptions"]),

  tpl("stpl-purchase-checklist", "purchase_agreement_checklist", "Purchase Agreement Checklist", "seller_documents",
    `# PURCHASE AGREEMENT CHECKLIST — NOT A CONTRACT\n\nThis is a workflow checklist only. It is NOT a purchase agreement.\nReview all contract documents with a licensed attorney before use.\n\nProperty: {{property_address}} | State: {{state}}\n\n## Checklist\n- [ ] Purchase agreement drafted by attorney/title\n- [ ] Seller disclosures reviewed\n- [ ] Earnest money terms defined\n- [ ] Inspection period defined\n- [ ] Closing date defined\n- [ ] Title company selected: {{title_company}}\n- [ ] Attorney review complete\n\n{{disclaimer}}\n{{attorney_review_reminder}}`,
    ["Attorney-drafted agreement", "Disclosures reviewed", "Title company selected"], { attorneyReviewed: true }),

  tpl("stpl-assignment-disclosure", "assignment_disclosure_checklist", "Assignment Disclosure Checklist", "compliance_documents",
    `# Assignment Disclosure Checklist\n\nProperty: {{property_address}} | State: {{state}}\nCompliance Risk: {{compliance_risk_level}}\n\n## Disclosure Items\n- [ ] Assignment interest disclosed (not property sale)\n- [ ] Profit disclosure where applicable\n- [ ] Buyer/assignee disclosure completed\n- [ ] State-specific rules reviewed\n- [ ] Attorney review acknowledged\n\n{{disclaimer}}\n{{attorney_review_reminder}}`,
    ["Assignment interest disclosed", "State rules reviewed"], { attorneyReviewed: true }),

  tpl("stpl-seller-disclosure-ack", "seller_disclosure_ack", "Seller Disclosure Acknowledgement", "seller_documents",
    `# Seller Disclosure Acknowledgement — Workflow Template\n\nThis is a workflow acknowledgement template. It is NOT legal advice or a legally sufficient disclosure.\n\nProperty: {{property_address}}\nOwner: {{owner_name}}\nDate: {{date}}\n\nI acknowledge that I have been informed of relevant workflow disclosure requirements and understand that I should confirm all requirements with a qualified professional.\n\nSignature: _______________\n\n{{disclaimer}}`,
    ["Seller acknowledgement obtained"]),

  tpl("stpl-buyer-disclosure-ack", "buyer_assignee_disclosure_ack", "Buyer/Assignee Disclosure Acknowledgement", "buyer_assignee_documents",
    `# Buyer/Assignee Disclosure Acknowledgement — Workflow Template\n\nThis is a workflow acknowledgement. NOT legal advice.\n\nProperty: {{property_address}}\nBuyer: {{buyer_name}}\n\nI understand I am acquiring contract interest, not the property directly, unless otherwise agreed with qualified professionals.\n\n{{disclaimer}}\n{{attorney_review_reminder}}`,
    ["Buyer disclosure acknowledged"], { attorneyReviewed: true }),

  tpl("stpl-assignment-checklist", "assignment_agreement_checklist", "Assignment Agreement Checklist", "buyer_assignee_documents",
    `# ASSIGNMENT AGREEMENT CHECKLIST — NOT A CONTRACT\n\nThis is a checklist only. NOT an assignment agreement.\nHave a licensed attorney review all assignment documents.\n\nProperty: {{property_address}} | Buyer: {{buyer_name}}\nAssignment Fee Target: {{assignment_fee_target}}\n\n## Checklist\n- [ ] Assignment agreement drafted by attorney\n- [ ] Buyer disclosure complete\n- [ ] Title company engaged: {{title_company}}\n- [ ] Earnest money terms defined\n- [ ] Marketing contract interest only (not property)\n\n{{disclaimer}}\n{{attorney_review_reminder}}`,
    ["Attorney-drafted assignment", "Buyer disclosure", "Title company engaged"], { attorneyReviewed: true }),

  tpl("stpl-title-intake", "title_company_intake", "Title Company Intake Sheet", "title_company_documents",
    `# Title Company Intake Sheet\n\nProperty: {{property_address}}\nTitle Company: {{title_company}}\nSeller: {{owner_name}}\nBuyer: {{buyer_name}}\n\n## Intake Fields\n- [ ] Property address\n- [ ] Parcel ID: {{parcel_id}}\n- [ ] Seller contact\n- [ ] Buyer contact\n- [ ] Transaction type\n- [ ] Estimated closing date\n\n{{disclaimer}}`,
    ["Title company contact", "Transaction type", "Closing date"]),

  tpl("stpl-pof", "proof_of_funds_record", "Proof of Funds Record", "buyer_assignee_documents",
    `# Proof of Funds Record\n\nBuyer: {{buyer_name}}\nDate: {{date}}\n\n## Documentation\n- [ ] POF letter attached\n- [ ] Source verified\n- [ ] Date verified\n- [ ] Amount sufficient for transaction\n\n{{disclaimer}}`,
    ["POF attached", "Amount verified"]),

  tpl("stpl-buyer-profile", "buyer_profile_sheet", "Buyer Profile Sheet", "buyer_assignee_documents",
    `# Buyer Profile Sheet\n\nBuyer: {{buyer_name}}\nMarkets: {{state}} / {{county}}\n\n## Buy Box\n- [ ] Price range\n- [ ] Property types\n- [ ] Closing speed\n- [ ] Proof of funds on file\n- [ ] Cash buyer: Y/N\n\n{{disclaimer}}`,
    ["Buy box documented", "POF status"]),

  tpl("stpl-deal-memo", "deal_memo", "Deal Memo", "internal_worksheets",
    `# Deal Memo — Internal\n\nProperty: {{property_address}}\nLead Score: {{estate_lead_score}} | Deal Potential: {{deal_potential_score}}\nOffer: {{offer_amount}} | ARV: {{estimated_arv}}\n\n## Summary\n(User-entered deal summary)\n\n{{disclaimer}}`,
    ["Deal summary written"]),

  tpl("stpl-closing", "closing_checklist", "Closing Checklist", "title_company_documents",
    `# Closing Checklist\n\nProperty: {{property_address}}\nTitle: {{title_company}}\nState: {{state}}\n\n## Closing Items\n- [ ] Title search complete\n- [ ] Insurance obtained\n- [ ] Funds wired\n- [ ] Documents signed\n- [ ] Recording confirmed\n- [ ] Communication log exported\n\n{{disclaimer}}`,
    ["Title search", "Funds wired", "Recording confirmed"]),

  tpl("stpl-comm-export", "communication_log_export", "Communication Log Export", "audit_documents",
    `# Communication Log Export\n\nLead: {{property_address}}\nExport Date: {{date}}\n\n(Communication history attached from Outreach CRM)\n\n{{disclaimer}}`,
    ["Communication log attached"]),

  tpl("stpl-compliance-ack", "compliance_acknowledgement", "Compliance Acknowledgement", "compliance_documents",
    `# Compliance Acknowledgement\n\nProperty: {{property_address}} | State: {{state}}\nRisk Level: {{compliance_risk_level}}\n\nI understand EstateLeadOS does not provide legal, tax, brokerage, financial, or investment advice. I am responsible for confirming requirements with a qualified professional.\n\nSignature: _______________ Date: {{date}}\n\n{{disclaimer}}`,
    ["Compliance acknowledgement signed"]),

  tpl("stpl-attorney-confirm", "attorney_review_confirmation", "Attorney Review Confirmation", "compliance_documents",
    `# Attorney Review Confirmation — Tracking Only\n\nThis tracks that professional review was sought. It does NOT constitute legal approval.\n\nProperty: {{property_address}} | State: {{state}}\n\n- [ ] Attorney contacted\n- [ ] Title company consulted\n- [ ] Review notes attached\n- [ ] Date of consultation: ___\n\n{{disclaimer}}`,
    ["Professional review documented"], { attorneyReviewed: true }),

  tpl("stpl-state-risk", "state_risk_acknowledgement", "State Risk Acknowledgement", "compliance_documents",
    `# State Risk Acknowledgement\n\nState: {{state}} | County: {{county}}\nCompliance Risk: {{compliance_risk_level}}\n\nI understand this state/county workflow may involve elevated compliance risk. EstateLeadOS cannot confirm legal compliance.\n\nSignature: _______________\n\n{{disclaimer}}`,
    ["State risk acknowledged"]),

  tpl("stpl-source-packet", "source_document_packet", "Source Document Packet", "source_records",
    `# Source Document Packet\n\nLead: {{property_address}}\nParcel: {{parcel_id}}\n\n## Attached Sources\n- [ ] Deed records\n- [ ] Tax records\n- [ ] Probate search results\n- [ ] CSV import batch\n- [ ] Communication source records\n\n{{disclaimer}}`,
    ["Source documents compiled"]),
];
