import type { FullLeadDetail } from "@/lib/types/crm";

export interface ComplianceRunResult {
  riskLevel: "low" | "moderate" | "elevated" | "high" | "restricted";
  blockersCreated: string[];
  acknowledgementsRequired: string[];
  pauseRequired: boolean;
  pauseReason: string | null;
}

export function runComplianceCheck(lead: FullLeadDetail | null): ComplianceRunResult {
  if (!lead) {
    return {
      riskLevel: "moderate",
      blockersCreated: ["Lead intake incomplete"],
      acknowledgementsRequired: ["Compliance disclaimer acknowledgement"],
      pauseRequired: true,
      pauseReason: "Compliance review required before workflow can continue.",
    };
  }

  const score = lead.complianceRiskScore;
  const riskLevel =
    score >= 80 ? "restricted" :
    score >= 60 ? "high" :
    score >= 40 ? "elevated" :
    score >= 20 ? "moderate" : "low";

  const blockers: string[] = [];
  const acks: string[] = [];

  if (lead.doNotContact) blockers.push("Do Not Contact active — outreach disabled");
  if (lead.ownerHeir.ownerVerificationStatus !== "verified") blockers.push("Owner verification incomplete");
  if (lead.ownerHeir.consentStatus === "unknown") acks.push("Contact consent status unknown");
  if (lead.missingData.length > 0) blockers.push(`${lead.missingData.length} missing data field(s)`);
  acks.push("State workflow acknowledgement");

  const pauseRequired = riskLevel === "elevated" || riskLevel === "high" || riskLevel === "restricted" || blockers.length > 0;
  const pauseReason = pauseRequired
    ? `Compliance risk is ${riskLevel}. Review required before continuing.`
    : null;

  return { riskLevel, blockersCreated: blockers, acknowledgementsRequired: acks, pauseRequired, pauseReason };
}

export interface OutreachPrepResult {
  safeToPrepare: boolean;
  dncActive: boolean;
  consentStatus: string;
  templatePrepared: boolean;
  autoSendBlocked: true;
  pauseRequired: boolean;
  pauseReason: string | null;
}

export function runOutreachPreparation(lead: FullLeadDetail | null): OutreachPrepResult {
  if (!lead) {
    return {
      safeToPrepare: false,
      dncActive: false,
      consentStatus: "unknown",
      templatePrepared: false,
      autoSendBlocked: true,
      pauseRequired: true,
      pauseReason: "Outreach preparation requires a lead record and user approval before any contact.",
    };
  }

  const dnc = lead.doNotContact;
  return {
    safeToPrepare: !dnc && lead.complianceRiskScore < 80,
    dncActive: dnc,
    consentStatus: lead.ownerHeir.consentStatus,
    templatePrepared: !dnc,
    autoSendBlocked: true,
    pauseRequired: true,
    pauseReason: "Outreach templates prepared but not sent. User approval required before any outreach action.",
  };
}
