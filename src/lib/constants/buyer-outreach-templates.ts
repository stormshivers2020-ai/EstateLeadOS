import type { BuyerOutreachTemplate } from "@/lib/deal-calculator/dealCalculatorTypes";

const CONTRACT_INTEREST_REMINDER =
  "Remember: market your contract interest, not the property itself if you do not own it.";

export const BUYER_OUTREACH_TEMPLATES: BuyerOutreachTemplate[] = [
  {
    id: "bot-new-opportunity",
    organizationId: null,
    templateName: "New Contract Opportunity",
    category: "new_contract_opportunity",
    channel: "email",
    body: `Hi {{buyer_name}},

I'm reaching out about a potential contract interest related to {{property_address}} in {{county}}, {{state}}.

If this fits your buy box, I can share more details for your review. This is contract interest — not a direct property sale listing.

Estimated ARV: {{estimated_arv}}
Estimated repairs: {{estimated_repairs}}

{{user_name}}
{{user_company_name}}
{{business_phone}}`,
    variables: ["buyer_name", "property_address", "state", "county", "estimated_arv", "estimated_repairs", "user_name", "user_company_name", "business_phone"],
    safetyStatus: "approved",
    disclosureReminderFlag: true,
    assignmentRiskReminderFlag: true,
    reviewStatus: "approved",
    active: true,
  },
  {
    id: "bot-contract-interest",
    organizationId: null,
    templateName: "Contract Interest Available",
    category: "contract_interest_available",
    channel: "sms",
    body: `Hi {{buyer_name}} — potential contract interest at {{property_address}}, {{state}}. Fits buy box? Reply for details. Contract interest only — not selling the property directly. — {{user_name}}`,
    variables: ["buyer_name", "property_address", "state", "user_name"],
    safetyStatus: "approved",
    disclosureReminderFlag: true,
    assignmentRiskReminderFlag: false,
    reviewStatus: "approved",
    active: true,
  },
  {
    id: "bot-follow-up",
    organizationId: null,
    templateName: "Buyer Interest Follow-Up",
    category: "buyer_interest_follow_up",
    channel: "email",
    body: `Hi {{buyer_name}},

Following up on the potential contract interest at {{property_address}}. Estimated assignment price range: {{assignment_price}}. Projected spread is an estimate only — not guaranteed.

Let me know if you'd like to review terms with your team.

{{user_name}} | {{business_email}}`,
    variables: ["buyer_name", "property_address", "assignment_price", "user_name", "business_email"],
    safetyStatus: "approved",
    disclosureReminderFlag: true,
    assignmentRiskReminderFlag: true,
    reviewStatus: "approved",
    active: true,
  },
  {
    id: "bot-pof-request",
    organizationId: null,
    templateName: "Proof of Funds Request",
    category: "proof_of_funds_request",
    channel: "email",
    body: `Hi {{buyer_name}},

Before sharing full contract interest details for {{property_address}}, could you confirm proof of funds status? This helps ensure we're aligned on closing capability.

Thank you,
{{user_name}}
{{user_company_name}}`,
    variables: ["buyer_name", "property_address", "user_name", "user_company_name"],
    safetyStatus: "approved",
    disclosureReminderFlag: false,
    assignmentRiskReminderFlag: false,
    reviewStatus: "approved",
    active: true,
  },
  {
    id: "bot-inspection",
    organizationId: null,
    templateName: "Showing/Inspection Scheduling",
    category: "showing_inspection_scheduling",
    channel: "email",
    body: `Hi {{buyer_name}},

We may be able to schedule a property review for the contract interest at {{property_address}}. Confirm with all parties and follow local access requirements.

{{user_name}} | {{business_phone}}`,
    variables: ["buyer_name", "property_address", "user_name", "business_phone"],
    safetyStatus: "needs_review",
    disclosureReminderFlag: true,
    assignmentRiskReminderFlag: false,
    reviewStatus: "approved",
    active: true,
  },
  {
    id: "bot-assignment-reminder",
    organizationId: null,
    templateName: "Assignment Document Reminder",
    category: "assignment_document_reminder",
    channel: "email",
    body: `Hi {{buyer_name}},

Reminder: assignment-related documents for {{property_address}} need review. Title company: {{title_company}}. Closing target: {{closing_date}}.

Have your attorney review all documents. EstateLeadOS does not provide legal advice.

{{user_name}}`,
    variables: ["buyer_name", "property_address", "title_company", "closing_date", "user_name"],
    safetyStatus: "approved",
    disclosureReminderFlag: true,
    assignmentRiskReminderFlag: true,
    reviewStatus: "approved",
    active: true,
  },
  {
    id: "bot-closing-reminder",
    organizationId: null,
    templateName: "Closing Reminder",
    category: "closing_reminder",
    channel: "email",
    body: `Hi {{buyer_name}},

Closing reminder for contract interest at {{property_address}}. Target date: {{closing_date}}. Title: {{title_company}}.

{{user_name}} | {{business_phone}}`,
    variables: ["buyer_name", "property_address", "closing_date", "title_company", "user_name", "business_phone"],
    safetyStatus: "approved",
    disclosureReminderFlag: false,
    assignmentRiskReminderFlag: false,
    reviewStatus: "approved",
    active: true,
  },
];

export const BUYER_OUTREACH_BLOCKED_PHRASES = [
  "I am selling",
  "I am selling your property",
  "guaranteed profit",
  "guaranteed assignment fee",
  "guaranteed deal",
  "sell this property",
  "marketing the property as yours",
];

export const BUYER_OUTREACH_SAFETY_REMINDER = CONTRACT_INTEREST_REMINDER;
