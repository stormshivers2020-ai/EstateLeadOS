import type { LeadTypeId } from "@/lib/types/leads";

export interface LeadTypeDefinition {
  id: LeadTypeId;
  name: string;
  description: string;
  requiredSignals: string[];
  confidenceThreshold: number;
  suggestedNextAction: string;
  complianceWarningLevel: "low" | "moderate" | "elevated" | "high";
  manualReviewRequired: boolean;
}

export const LEAD_TYPE_DEFINITIONS: Record<LeadTypeId, LeadTypeDefinition> = {
  possible_probate_lead: {
    id: "possible_probate_lead",
    name: "Possible Probate Lead",
    description: "Signals suggest probate activity but require verification",
    requiredSignals: ["probate_case_match", "estate_notice_match", "executor_language"],
    confidenceThreshold: 50,
    suggestedNextAction: "Verify probate case status with county records",
    complianceWarningLevel: "moderate",
    manualReviewRequired: true,
  },
  confirmed_probate_lead: {
    id: "confirmed_probate_lead",
    name: "Confirmed Probate Lead",
    description: "Probate court or estate records match confirmed",
    requiredSignals: ["probate_case_match", "register_of_wills_match"],
    confidenceThreshold: 75,
    suggestedNextAction: "Review estate status and identify authorized contact",
    complianceWarningLevel: "elevated",
    manualReviewRequired: true,
  },
  possible_inherited_property: {
    id: "possible_inherited_property",
    name: "Possible Inherited Property",
    description: "Ownership transfer patterns suggest inheritance",
    requiredSignals: ["transfer_to_family", "long_ownership_transfer", "family_name_similarity"],
    confidenceThreshold: 50,
    suggestedNextAction: "Research ownership history and heir information",
    complianceWarningLevel: "moderate",
    manualReviewRequired: false,
  },
  estate_transfer_lead: {
    id: "estate_transfer_lead",
    name: "Estate Transfer Lead",
    description: "Deed references estate or executor transfer language",
    requiredSignals: ["estate_deed", "executor_language", "transfer_into_estate"],
    confidenceThreshold: 60,
    suggestedNextAction: "Confirm estate deed details and authorized parties",
    complianceWarningLevel: "elevated",
    manualReviewRequired: true,
  },
  trust_transfer_lead: {
    id: "trust_transfer_lead",
    name: "Trust Transfer Lead",
    description: "Property transferred via trust instrument",
    requiredSignals: ["trust_transfer"],
    confidenceThreshold: 55,
    suggestedNextAction: "Identify trust trustee and transfer authority",
    complianceWarningLevel: "moderate",
    manualReviewRequired: true,
  },
  family_transfer_lead: {
    id: "family_transfer_lead",
    name: "Family Transfer Lead",
    description: "Non-arm's-length transfer between family members",
    requiredSignals: ["transfer_to_family", "survivorship_transfer", "family_name_similarity"],
    confidenceThreshold: 45,
    suggestedNextAction: "Research family ownership chain and motivation signals",
    complianceWarningLevel: "low",
    manualReviewRequired: false,
  },
  absentee_heir_lead: {
    id: "absentee_heir_lead",
    name: "Absentee Heir Lead",
    description: "Owner or heir mailing address differs from property",
    requiredSignals: ["mailing_differs", "out_of_state_owner"],
    confidenceThreshold: 40,
    suggestedNextAction: "Verify heir location and property management status",
    complianceWarningLevel: "low",
    manualReviewRequired: false,
  },
  tax_distress_estate_lead: {
    id: "tax_distress_estate_lead",
    name: "Tax Distress Estate Lead",
    description: "Estate-related property with tax delinquency signals",
    requiredSignals: ["tax_delinquency"],
    confidenceThreshold: 35,
    suggestedNextAction: "Review tax status and ownership distress indicators",
    complianceWarningLevel: "moderate",
    manualReviewRequired: false,
  },
  vacant_estate_property: {
    id: "vacant_estate_property",
    name: "Vacant Estate Property",
    description: "Vacancy signal combined with estate transfer indicators",
    requiredSignals: ["vacancy_signal", "long_ownership_transfer"],
    confidenceThreshold: 45,
    suggestedNextAction: "Confirm vacancy status and ownership situation",
    complianceWarningLevel: "low",
    manualReviewRequired: false,
  },
  listed_inherited_property: {
    id: "listed_inherited_property",
    name: "Listed Inherited Property",
    description: "Inherited property signal with approved listing data",
    requiredSignals: ["below_market_listing"],
    confidenceThreshold: 50,
    suggestedNextAction: "Review listing details and ownership context",
    complianceWarningLevel: "moderate",
    manualReviewRequired: true,
  },
  low_confidence_lead: {
    id: "low_confidence_lead",
    name: "Low Confidence Lead",
    description: "Insufficient signals for confident estate classification",
    requiredSignals: [],
    confidenceThreshold: 0,
    suggestedNextAction: "Gather additional public records before outreach",
    complianceWarningLevel: "low",
    manualReviewRequired: true,
  },
  needs_manual_review: {
    id: "needs_manual_review",
    name: "Needs Manual Review",
    description: "Conflicting or incomplete data requires human review",
    requiredSignals: ["conflicting_records", "missing_fields"],
    confidenceThreshold: 25,
    suggestedNextAction: "Complete manual verification of all source records",
    complianceWarningLevel: "moderate",
    manualReviewRequired: true,
  },
};

export function getLeadTypeName(id: LeadTypeId): string {
  return LEAD_TYPE_DEFINITIONS[id]?.name ?? id;
}
