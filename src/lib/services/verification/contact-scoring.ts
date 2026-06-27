import type { ContactVerificationStatus } from "@/lib/types/verification";

export interface ContactScoringInput {
  personName?: string | null;
  contactType: "phone" | "email" | "mailing_address";
  contactValue: string;
  sourceType: string;
  sourceName?: string | null;
  matchedPersonName?: string | null;
  hasEstateRole?: boolean;
  matchedMailingAddress?: boolean;
}

export function scoreContactCandidate(input: ContactScoringInput): {
  confidenceScore: number;
  verificationStatus: ContactVerificationStatus;
  rationale: string;
} {
  const officialSource =
    /probate|register of wills|court|clerk|assessor|recorder|deed|estate/i.test(
      `${input.sourceType} ${input.sourceName ?? ""}`
    );

  if (input.contactType === "mailing_address" && officialSource) {
    if (input.hasEstateRole && input.matchedPersonName) {
      return {
        confidenceScore: 88,
        verificationStatus: "verified",
        rationale: "Mailing address from official estate/court/property source with matching name and estate role.",
      };
    }
    if (input.matchedPersonName && input.matchedMailingAddress) {
      return {
        confidenceScore: 78,
        verificationStatus: "likely_match",
        rationale: "Same name and mailing address from official source.",
      };
    }
    return {
      confidenceScore: 72,
      verificationStatus: "likely_match",
      rationale: "Mailing address from official estate/court/property source.",
    };
  }

  if (input.contactType === "phone" || input.contactType === "email") {
    return {
      confidenceScore: 35,
      verificationStatus: "unverified",
      rationale: "Phone or email from enrichment source — needs manual verification before outreach.",
    };
  }

  if (input.matchedPersonName && !input.matchedMailingAddress) {
    return {
      confidenceScore: 42,
      verificationStatus: "weak_match",
      rationale: "Same name only — weak match until address or court role is confirmed.",
    };
  }

  return {
    confidenceScore: 28,
    verificationStatus: "unverified",
    rationale: "Contact candidate requires manual verification.",
  };
}
