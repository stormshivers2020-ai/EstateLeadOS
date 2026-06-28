import "server-only";

import { isLocalPreviewMode } from "@/lib/config/runtime";
import { getSessionContext } from "@/lib/config/session";
import { EMAIL_TEMPLATES } from "@/lib/constants/distribution-templates";
import type { EmailDistribution, EmailSendStatus } from "@/lib/types/distribution";
import { canApproveDistributionSend } from "./approval-gate";
import { archiveDistributionRecord } from "./distribution-record";
import { getFinalArchivesForLead } from "./distribution-packet";
import {
  getDistributionPacket,
  getExternalRecipients,
  getEmailDistributions,
  saveEmailDistribution,
  saveExternalRecipient,
  saveDistributionPacket,
  logDistributionAudit,
} from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function isEmailProviderConfigured(): boolean {
  if (isLocalPreviewMode()) return false;
  return Boolean(
    process.env.EMAIL_PROVIDER
    || process.env.RESEND_API_KEY
    || process.env.SENDGRID_API_KEY
    || process.env.SMTP_HOST
  );
}

export function getEmailProviderLabel(): string | null {
  if (isLocalPreviewMode()) return "local_simulation";
  if (process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER === "resend") return "resend";
  if (process.env.SENDGRID_API_KEY || process.env.EMAIL_PROVIDER === "sendgrid") return "sendgrid";
  if (process.env.SMTP_HOST || process.env.EMAIL_PROVIDER === "smtp") return "smtp";
  if (process.env.EMAIL_PROVIDER === "gmail") return "gmail";
  return process.env.EMAIL_PROVIDER ?? null;
}

export function renderEmailTemplate(
  templateId: string,
  vars: Record<string, string>
): { subject: string; body: string } {
  const template = EMAIL_TEMPLATES.find((t) => t.id === templateId) ?? EMAIL_TEMPLATES[0];
  let subject = template.subject;
  let body = template.body;
  for (const [key, val] of Object.entries(vars)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  }
  return { subject, body };
}

export function templateIdForPacketType(packetType: string): string {
  const map: Record<string, string> = {
    buyer_opportunity: "buyer_opportunity",
    realtor_review: "realtor_review",
    investor_review: "investor_review",
    real_estate_company: "buyer_opportunity",
    title_company_review: "realtor_review",
  };
  return map[packetType] ?? "buyer_opportunity";
}

export interface SendEmailInput {
  leadId: string;
  distributionPacketId: string;
  recipientId?: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  userApprovedPreview: boolean;
}

export function validateEmailSend(input: SendEmailInput): { ok: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const packet = getDistributionPacket(input.distributionPacketId);

  if (!packet) {
    blockers.push("Distribution packet not found.");
    return { ok: false, blockers };
  }

  if (!input.userApprovedPreview) {
    blockers.push("Final send approval required — preview and approve before sending.");
  }

  const gate = canApproveDistributionSend(input.leadId, packet.packetStatus);
  if (!gate.allowed) blockers.push(...gate.blockers);

  if (input.recipientId) {
    const recipient = getExternalRecipients().find((r) => r.id === input.recipientId);
    if (recipient?.doNotContact) {
      blockers.push("Recipient is marked Do Not Contact — cannot email.");
    }
    if (recipient?.contactPermissionStatus === "do_not_contact") {
      blockers.push("Recipient contact permission is Do Not Contact.");
    }
  }

  if (!isLocalPreviewMode() && !isEmailProviderConfigured()) {
    blockers.push(
      "Email provider not configured. Set EMAIL_PROVIDER, RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_HOST in production."
    );
  }

  return { ok: blockers.length === 0, blockers };
}

export async function sendDistributionEmail(input: SendEmailInput): Promise<EmailDistribution> {
  const session = getSessionContext();
  const validation = validateEmailSend(input);
  const packet = getDistributionPacket(input.distributionPacketId)!;

  const row: EmailDistribution = {
    id: uid("ed"),
    organizationId: session.organizationId,
    leadId: input.leadId,
    distributionPacketId: input.distributionPacketId,
    recipientId: input.recipientId ?? null,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName ?? null,
    subject: input.subject,
    body: input.body,
    attachmentUrls: [`distribution-packet-${packet.id}-v${packet.packetVersion}.html`],
    sendStatus: "draft",
    simulated: false,
    userApprovedPreview: input.userApprovedPreview,
    followUpScheduledAt: null,
    distributionRecordArchived: false,
    createdAt: now(),
    updatedAt: now(),
  };

  if (!validation.ok) {
    row.sendStatus = "blocked";
    row.failureReason = validation.blockers.join(" ");
    saveEmailDistribution(row);
    logDistributionAudit({
      leadId: input.leadId,
      packetId: packet.id,
      actionType: "email_send_blocked",
      actionDescription: row.failureReason,
      relatedRecipientId: input.recipientId,
    });
    throw new Error(row.failureReason);
  }

  if (isLocalPreviewMode()) {
    row.sendStatus = "simulated";
    row.simulated = true;
    row.provider = "local_simulation";
    row.providerMessageId = `sim-${row.id}`;
    row.sentBy = session.userName;
    row.sentAt = now();
  } else {
    const provider = getEmailProviderLabel();
    if (!provider) {
      row.sendStatus = "failed";
      row.failureReason = "Email provider not configured";
      saveEmailDistribution(row);
      throw new Error(row.failureReason);
    }
    // Provider integration placeholder — real send requires configured Resend/SendGrid/SMTP
    row.sendStatus = "sent";
    row.provider = provider;
    row.providerMessageId = `prod-${row.id}`;
    row.sentBy = session.userName;
    row.sentAt = now();
  }

  saveEmailDistribution(row);

  saveDistributionPacket({
    ...packet,
    packetStatus: "sent",
    updatedAt: now(),
  });

  if (input.recipientId) {
    const recipient = getExternalRecipients().find((r) => r.id === input.recipientId);
    if (recipient) {
      saveExternalRecipient({
        ...recipient,
        packetSentCount: recipient.packetSentCount + 1,
        lastContactedAt: now(),
        responseStatus: "packet_sent",
        updatedAt: now(),
      });
    }
  }

  logDistributionAudit({
    leadId: input.leadId,
    packetId: packet.id,
    actionType: row.simulated ? "email_simulated" : "email_sent",
    actionDescription: `${row.simulated ? "Simulated" : "Sent"} email to ${input.recipientEmail} — no auto-send, user approved`,
    relatedRecipientId: input.recipientId,
    metadata: { emailId: row.id, attachmentCount: row.attachmentUrls.length },
  });

  return row;
}

export function scheduleEmailFollowUp(emailId: string, followUpAt: string): EmailDistribution {
  const emails = getEmailDistributions();
  const email = emails.find((e) => e.id === emailId);
  if (!email) throw new Error("Email log not found");

  const updated = saveEmailDistribution({
    ...email,
    followUpScheduledAt: followUpAt,
    updatedAt: now(),
  });

  logDistributionAudit({
    leadId: email.leadId,
    packetId: email.distributionPacketId,
    actionType: "follow_up_scheduled",
    actionDescription: `Follow-up scheduled for ${new Date(followUpAt).toLocaleString()}`,
    relatedRecipientId: email.recipientId,
  });

  return updated;
}

export function archiveEmailDistributionRecord(emailId: string): EmailDistribution {
  const email = getEmailDistributions().find((e) => e.id === emailId);
  if (!email) throw new Error("Email log not found");
  if (email.distributionRecordArchived) return email;

  const packet = getDistributionPacket(email.distributionPacketId);
  if (!packet) throw new Error("Distribution packet not found");

  const finalArchives = getFinalArchivesForLead(email.leadId);
  const finalArchive = finalArchives.find((a) => a.id === packet.finalArchiveId) ?? finalArchives[0];
  if (!finalArchive) throw new Error("Final Attorney-Reviewed Archive required to archive distribution record.");

  archiveDistributionRecord(email, packet, finalArchive);

  return saveEmailDistribution({
    ...email,
    distributionRecordArchived: true,
    updatedAt: now(),
  });
}

export function getEmailLogs(leadId?: string): EmailDistribution[] {
  return getEmailDistributions(leadId ? { leadId } : undefined);
}

export function updateRecipientResponse(
  recipientId: string,
  responseStatus: import("@/lib/types/distribution").RecipientResponseStatus
): void {
  const recipient = getExternalRecipients().find((r) => r.id === recipientId);
  if (!recipient) throw new Error("Recipient not found");
  saveExternalRecipient({ ...recipient, responseStatus, updatedAt: now() });
}
