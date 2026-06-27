import { BLOCKED_PHRASES } from "@/lib/constants/outreach-templates";
import type { OutreachSafetyCheckResult, SafetyStatus } from "@/lib/types/crm";

const BLOCKED_PATTERNS = [
  /i know someone died/i,
  /you probably need to sell/i,
  /before the bank takes it/i,
  /act fast/i,
  /last chance/i,
  /you must sell/i,
  /guaranteed cash/i,
  /guaranteed profit/i,
  /i legally handle probate/i,
  /i am selling your property/i,
  /i can solve your probate/i,
  /guaranteed sale/i,
];

const RISK_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bprobate\b/i, reason: "References probate — may need professional review" },
  { pattern: /\bdeceased\b/i, reason: "References death — use respectful, no-pressure language" },
  { pattern: /\bheir\b/i, reason: "References heir — ensure respectful framing" },
  { pattern: /\bestate\b/i, reason: "References estate — review for pressure tone" },
  { pattern: /\burgent\b/i, reason: "Urgency language detected" },
  { pattern: /\bforeclosure\b/i, reason: "Fear-based distress language" },
  { pattern: /\bmust sell\b/i, reason: "Pressure language" },
  { pattern: /\bguaranteed\b/i, reason: "Guarantee language" },
  { pattern: /\blegal\b/i, reason: "Legal claim language" },
  { pattern: /\bbroker\b/i, reason: "Brokerage implication" },
  { pattern: /\bcommission\b/i, reason: "Brokerage/fee implication" },
];

export interface OutreachGuardContext {
  doNotContact: boolean;
  stateOutreachWarningReviewed: boolean;
  dncReminderAcknowledged: boolean;
  contactSourceAttached: boolean;
  consentStatus: string;
  templateToneApproved: boolean;
}

export function checkOutreachSafetyGuard(
  content: string,
  context: OutreachGuardContext
): OutreachSafetyCheckResult {
  const flaggedPhrases: string[] = [];
  const riskReasons: string[] = [];
  const feedback: string[] = [];
  let blocked = false;
  let safetyStatus: SafetyStatus = "approved";

  if (context.doNotContact) {
    return {
      safetyStatus: "blocked",
      blocked: true,
      flaggedPhrases: ["Do Not Contact active"],
      riskReasons: ["Lead is marked Do Not Contact"],
      suggestedRewrite: null,
      feedback: ["Outreach is disabled. Internal notes only."],
    };
  }

  if (!context.dncReminderAcknowledged) {
    feedback.push("DNC reminder must be acknowledged before outreach.");
    safetyStatus = "requires_user_acknowledgement";
  }

  if (!context.stateOutreachWarningReviewed) {
    feedback.push("State outreach warning must be reviewed.");
    safetyStatus = "requires_state_warning";
  }

  if (!context.contactSourceAttached) {
    feedback.push("Contact source should be attached or acknowledged as missing.");
    if (safetyStatus === "approved") safetyStatus = "needs_review";
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern)?.[0] ?? "blocked phrase";
      flaggedPhrases.push(match);
      blocked = true;
    }
  }

  for (const bp of BLOCKED_PHRASES) {
    if (content.toLowerCase().includes(bp.phrase)) {
      flaggedPhrases.push(bp.phrase);
      riskReasons.push(bp.reason);
      blocked = true;
      feedback.push(`Blocked: "${bp.phrase}" — ${bp.reason}. Try: "${bp.alternative}"`);
    }
  }

  if (!blocked) {
    for (const rp of RISK_PATTERNS) {
      if (rp.pattern.test(content)) {
        riskReasons.push(rp.reason);
        flaggedPhrases.push(content.match(rp.pattern)?.[0] ?? "risk phrase");
      }
    }
    if (riskReasons.length > 0 && safetyStatus === "approved") {
      safetyStatus = "needs_review";
      feedback.push("Risk language detected. Review wording for respectful, no-pressure tone.");
    }
  }

  if (blocked) {
    safetyStatus = "blocked";
  }

  if (context.consentStatus === "consent_needed" || context.consentStatus === "do_not_contact") {
    safetyStatus = "requires_compliance_review";
    feedback.push("Consent requirements must be addressed before this outreach method.");
  }

  return {
    safetyStatus,
    blocked,
    flaggedPhrases: [...new Set(flaggedPhrases)],
    riskReasons: [...new Set(riskReasons)],
    suggestedRewrite: blocked
      ? "I'm reaching out about the property at [address] to see if selling it as-is is something you would ever consider. No pressure either way."
      : null,
    feedback,
  };
}

export function canProceedWithOutreach(context: OutreachGuardContext, content: string): boolean {
  const result = checkOutreachSafetyGuard(content, context);
  return !result.blocked && result.safetyStatus !== "requires_compliance_review";
}
