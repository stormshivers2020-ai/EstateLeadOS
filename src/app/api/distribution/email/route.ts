import { NextResponse } from "next/server";
import {
  renderEmailTemplate,
  validateEmailSend,
  sendDistributionEmail,
  getEmailDistributions,
  seedExternalRecipientsFromBuyers,
  getExternalRecipients,
} from "@/lib/services/distribution/index";

export async function GET() {
  seedExternalRecipientsFromBuyers();
  return NextResponse.json({
    recipients: getExternalRecipients(),
    logs: getEmailDistributions(),
    templates: (await import("@/lib/constants/distribution-templates")).EMAIL_TEMPLATES,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body.action === "preview") {
    const rendered = renderEmailTemplate(body.templateId ?? "buyer_opportunity", body.vars ?? {});
    const validation = validateEmailSend({
      leadId: body.leadId,
      distributionPacketId: body.distributionPacketId,
      recipientEmail: body.recipientEmail,
      recipientId: body.recipientId,
      subject: rendered.subject,
      body: rendered.body,
      userApprovedPreview: false,
    });
    return NextResponse.json({ ...rendered, validation });
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
      return NextResponse.json({ result });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Send failed" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
