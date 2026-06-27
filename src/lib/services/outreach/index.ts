import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { STARTER_OUTREACH_TEMPLATES, BLOCKED_PHRASES } from "@/lib/constants/outreach-templates";
import {
  checkOutreachSafetyGuard,
  canProceedWithOutreach,
  type OutreachGuardContext,
} from "@/lib/engines/outreach-safety-guard";
import type { OutreachTemplate, OutreachSafetyCheckResult } from "@/lib/types/crm";

export function getOutreachTemplates(): OutreachTemplate[] {
  if (!shouldLoadSeedData()) {
    return STARTER_OUTREACH_TEMPLATES.filter((t) => t.active);
  }
  return STARTER_OUTREACH_TEMPLATES;
}

export function getTemplatesByCategory(category: string): OutreachTemplate[] {
  return getOutreachTemplates().filter((t) => t.category === category);
}

export function getTemplateById(id: string): OutreachTemplate | undefined {
  return getOutreachTemplates().find((t) => t.id === id);
}

export function getBlockedPhrases() {
  return BLOCKED_PHRASES;
}

export function applyTemplateVariables(
  body: string,
  vars: Record<string, string>
): string {
  let result = body;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

export function checkTemplateSafety(
  content: string,
  context: OutreachGuardContext
): OutreachSafetyCheckResult {
  return checkOutreachSafetyGuard(content, context);
}

export function canUseTemplate(
  content: string,
  context: OutreachGuardContext
): boolean {
  return canProceedWithOutreach(context, content);
}

export const DNC_REMINDER_TEXT =
  "I understand I am responsible for following applicable call, text, email, mail, consent, and Do Not Contact requirements before contacting this person.";

export const SMS_CONSENT_WARNING =
  "SMS outreach requires documented consent where applicable. Confirm you are responsible for compliance before logging SMS outreach.";

export const EMAIL_OPT_OUT_REMINDER =
  "Include opt-out instructions in email outreach. Confirm mailing list permissions before sending.";

export const CALL_DNC_REMINDER =
  "Screen against Do Not Call lists before calling. Confirm call recording consent requirements for this state.";
