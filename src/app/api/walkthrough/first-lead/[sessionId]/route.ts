import { NextResponse } from "next/server";
import {
  bindWalkthroughLead,
  continueWalkthrough,
  createWalkthroughArchive,
  createWalkthroughLead,
  generateWalkthroughPacket,
  getWalkthroughSessionById,
  goToWalkthroughStep,
  markPacketReviewed,
  saveWalkthroughDraft,
  updateWalkthroughSession,
} from "@/lib/services/walkthrough/session-store";
import type { WalkthroughStepData, WalkthroughStepId } from "@/lib/types/walkthrough";
import { canContinue } from "@/lib/services/walkthrough/engine";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = getWalkthroughSessionById(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const validation = canContinue(session);
  return NextResponse.json({ session, validation });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await req.json();
  const action = body.action as string;

  let session = getWalkthroughSessionById(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  switch (action) {
    case "save_draft": {
      session = saveWalkthroughDraft(sessionId, body.stepData as WalkthroughStepData) ?? session;
      break;
    }
    case "update_step_data": {
      session = updateWalkthroughSession(sessionId, { stepData: body.stepData }) ?? session;
      break;
    }
    case "create_lead": {
      const lead = createWalkthroughLead(body);
      session =
        bindWalkthroughLead(sessionId, lead.id, {
          estateName: body.estateName,
          county: body.county,
          state: body.state,
          createNew: true,
          selectedLeadId: lead.id,
        }) ?? session;
      break;
    }
    case "select_lead": {
      session =
        bindWalkthroughLead(sessionId, body.leadId, {
          estateName: body.estateName,
          county: body.county,
          state: body.state,
          createNew: false,
          selectedLeadId: body.leadId,
        }) ?? session;
      break;
    }
    case "generate_packet": {
      session = (await generateWalkthroughPacket(sessionId)) ?? session;
      break;
    }
    case "mark_packet_reviewed": {
      session = markPacketReviewed(sessionId) ?? session;
      break;
    }
    case "create_archive": {
      session = createWalkthroughArchive(sessionId) ?? session;
      break;
    }
    case "continue": {
      if (body.stepData) {
        session = updateWalkthroughSession(sessionId, { stepData: body.stepData }) ?? session;
      }

      if (session.currentStep === "start") {
        const start = session.stepData.start;
        if (!start?.estateName || !start.county || !start.state) {
          return NextResponse.json({ error: "Step incomplete", validation: canContinue(session), session }, { status: 400 });
        }
        if (start.createNew !== false && !session.leadId) {
          const lead = createWalkthroughLead({
            estateName: start.estateName,
            county: start.county,
            state: start.state,
          });
          session =
            bindWalkthroughLead(sessionId, lead.id, {
              ...start,
              createNew: true,
              selectedLeadId: lead.id,
            }) ?? session;
        } else if (start.selectedLeadId && !session.leadId) {
          session =
            bindWalkthroughLead(sessionId, start.selectedLeadId, start) ?? session;
        }
      }

      const validation = canContinue(session);
      if (!validation.valid) {
        return NextResponse.json({ error: "Step incomplete", validation, session }, { status: 400 });
      }

      if (session.currentStep === "final_archive") {
        session = createWalkthroughArchive(sessionId) ?? session;
      } else if (session.currentStep === "packet_builder" && !session.stepData.packet_builder?.packetId) {
        session = (await generateWalkthroughPacket(sessionId)) ?? session;
        if (session.stepData.packet_builder?.packetId && !session.stepData.packet_builder.reviewed) {
          return NextResponse.json({ session, validation: canContinue(session), message: "Packet generated — review and check the box to continue." });
        }
      } else {
        session = continueWalkthrough(sessionId) ?? session;
      }
      break;
    }
    case "go_back": {
      const step = body.step as WalkthroughStepId;
      session = goToWalkthroughStep(sessionId, step) ?? session;
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const validation = canContinue(session);
  return NextResponse.json({ session, validation });
}
