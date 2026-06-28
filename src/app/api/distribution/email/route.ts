import { NextResponse } from "next/server";
import {
  renderEmailTemplate,
  validateEmailSend,
  sendDistributionEmail,
  getEmailDistributions,
  seedExternalRecipientsFromBuyers,
  getExternalRecipients,
  scheduleEmailFollowUp,
  archiveEmailDistributionRecord,
  isEmailProviderConfigured,
  getEmailProviderLabel,
  updateRecipientResponse,
  templateIdForPacketType,
  getDistributionPacket,
} from "@/lib/services/distribution/index";
import { isLocalPreviewMode } from "@/lib/config/runtime";

export async function GET(request: Request) {
  seedExternalRecipientsFromBuyers();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId") ?? undefined;
  return NextResponse.json({
    recipients: getExternalRecipients(),
    logs: getEmailDistributions(leadId ? { leadId } : undefined),
    templates: (await import("@/lib/constants/distribution-templates")).EMAIL_TEMPLATES,
    providerConfigured: isEmailProviderConfigured(),
    providerLabel: getEmailProviderLabel(),
    localPreview: isLocalPreviewMode(),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body.action === "preview") {
    const packet = body.distributionPacketId ? getDistributionPacket(body.distributionPacketId) : null;
    const templateId = body.templateId ?? (packet ? templateIdForPacketType(packet.packetType) : "buyer_opportunity");
    const rendered = renderEmailTemplate(templateId, body.vars ?? {});
    const validation = validateEmailSend({
      leadId: body.leadId,
      distributionPacketId: body.distributionPacketId,
      recipientEmail: body.recipientEmail,
      recipientId: body.recipientId,
      subject: rendered.subject,
      body: rendered.body,
      userApprovedPreview: false,
    });
    return NextResponse.json({ ...rendered, validation, templateId });
  }

  if (body.action === "send") {
    try {
      const result = await sendDistributionEmail({
        leadId: body.leadId,
        distributionPacketId: body.distributionPacketId,
        recipientId: body.recipientId,
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName,
        subject: body.subject,
        body: body.body,
        userApprovedPreview: body.userApprovedPreview === true,
      });
      return NextResponse.json({ result, message: result.simulated ? "Email simulated (Local Preview Mode)" : "Email sent" });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Send failed" },
        { status: 400 }
      );
    }
  }

  if (body.action === "schedule_follow_up") {
    try {
      const result = scheduleEmailFollowUp(body.emailId, body.followUpAt);
      return NextResponse.json({ result, message: "Follow-up scheduled." });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
    }
  }

  if (body.action === "archive_record") {
    try {
      const result = archiveEmailDistributionRecord(body.emailId);
      return NextResponse.json({ result, message: "Distribution record archived to Final Archive." });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
    }
  }

  if (body.action === "update_response") {
    try {
      updateRecipientResponse(body.recipientId, body.responseStatus);
      return NextResponse.json({ message: "Response status updated." });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
