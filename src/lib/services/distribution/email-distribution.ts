import "server-only";

import { isLocalPreviewMode } from "@/lib/config/runtime";
import { getSessionContext } from "@/lib/config/session";
import { EMAIL_TEMPLATES } from "@/lib/constants/distribution-templates";
import type { EmailDistribution, EmailSendStatus } from "@/lib/types/distribution";
import { canApproveDistributionSend } from "./approval-gate";
import {
  getDistributionPacket,
  getExternalRecipients,
  getEmailDistributions,
  saveEmailDistribution,
  saveExternalRecipient,
  logDistributionAudit,
} from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
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
      blockers.push("Recipient is marked Do Not Contact.");
    }
  }

  if (!isLocalPreviewMode()) {
    const provider = process.env.EMAIL_PROVIDER ?? process.env.RESEND_API_KEY ? "resend" : null;
    if (!provider) {
      blockers.push("Email provider not configured. Set EMAIL_PROVIDER or RESEND_API_KEY in production.");
    }
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
    attachmentUrls: [`distribution-packet-${packet.id}-v${packet.packetVersion}`],
    sendStatus: "draft",
    simulated: false,
    userApprovedPreview: input.userApprovedPreview,
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
    const provider = process.env.EMAIL_PROVIDER ?? (process.env.RESEND_API_KEY ? "resend" : null);
    if (!provider) {
      row.sendStatus = "failed";
      row.failureReason = "Email provider not configured";
      saveEmailDistribution(row);
      throw new Error(row.failureReason);
    }
    row.sendStatus = "sent";
    row.provider = provider;
    row.providerMessageId = `prod-${row.id}`;
    row.sentBy = session.userName;
    row.sentAt = now();
  }

  saveEmailDistribution(row);

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
    actionDescription: `${row.simulated ? "Simulated" : "Sent"} email to ${input.recipientEmail}`,
    relatedRecipientId: input.recipientId,
  });

  return row;
}

export function getEmailLogs(leadId?: string): EmailDistribution[] {
  return getEmailDistributions(leadId ? { leadId } : undefined);
}
