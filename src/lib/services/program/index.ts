import "server-only";

import { getSessionContext } from "@/lib/config/session";
import type { LeadPacketType, ProgramAutomationMode, ProgramRunAction } from "@/lib/types/program";
import { runCountyPipeline } from "@/lib/services/pipeline/index";
import { getCountyConfig } from "@/lib/services/pipeline/local-store";
import { runDocumentFinder } from "./document-finder";
import { buildLeadPacket, getPacketTypes } from "./packet-builder";
import { archivePacket } from "./archive";
import { evaluateAssignmentReadiness } from "./assignment-readiness";
import { rebuildReviewQueue } from "./review-queue";
import { getProgramPackets } from "./local-store";

export interface ProgramRunResult {
  action: ProgramRunAction;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export async function runEstateLeadOS(input: {
  action: ProgramRunAction;
  mode?: ProgramAutomationMode;
  leadId?: string;
  countyName?: string;
  stateAbbr?: string;
  packetType?: LeadPacketType;
}): Promise<ProgramRunResult> {
  const mode = input.mode ?? "supervised";
  const session = getSessionContext();

  switch (input.action) {
    case "find_government_leads": {
      const county = input.countyName ?? "Harford";
      const state = input.stateAbbr ?? "MD";
      const config = getCountyConfig(state, county);
      if (!config) return { action: input.action, success: false, message: `No pipeline config for ${county}, ${state}` };
      if (config.isPaused) return { action: input.action, success: false, message: "County pipeline is paused" };
      const result = await runCountyPipeline(state, county);
      rebuildReviewQueue();
      return {
        action: input.action,
        success: true,
        message: `Found ${result.recordsFound} government record(s), created ${result.itemsCreated} pipeline item(s). Stopped at manual review.`,
        details: { ...result, mode },
      };
    }

    case "complete_research": {
      if (!input.leadId) return { action: input.action, success: false, message: "leadId required" };
      const docResult = await runDocumentFinder(input.leadId);
      rebuildReviewQueue();
      return {
        action: input.action,
        success: true,
        message: `Research updated: ${docResult.attachedCount} attached, ${docResult.missingCount} missing.`,
        details: { ...docResult, mode },
      };
    }

    case "find_missing_documents": {
      if (!input.leadId) return { action: input.action, success: false, message: "leadId required" };
      const docResult = await runDocumentFinder(input.leadId);
      rebuildReviewQueue();
      return {
        action: input.action,
        success: true,
        message: `${docResult.missingCount} missing document(s) identified for government proof chain.`,
        details: docResult,
      };
    }

    case "build_printable_packets": {
      if (!input.leadId) return { action: input.action, success: false, message: "leadId required" };
      const packetType = input.packetType ?? "internal_review";
      const ar = evaluateAssignmentReadiness(input.leadId);
      const packet = await buildLeadPacket({ leadId: input.leadId, packetType, assignmentReadiness: ar });
      rebuildReviewQueue();
      return {
        action: input.action,
        success: true,
        message: `Packet v${packet.packetVersion} built (${packet.packetStatus}). Ready for print — manual approval required before outreach.`,
        details: { packetId: packet.id, status: packet.packetStatus },
      };
    }

    case "prepare_assignment_readiness": {
      if (!input.leadId) return { action: input.action, success: false, message: "leadId required" };
      const ar = evaluateAssignmentReadiness(input.leadId);
      const packet = await buildLeadPacket({
        leadId: input.leadId,
        packetType: "assignment_readiness",
        assignmentReadiness: ar,
      });
      rebuildReviewQueue();
      return {
        action: input.action,
        success: true,
        message: `Assignment-readiness review prepared (${ar.status}). Professional review recommended — not legal approval.`,
        details: { packetId: packet.id, status: ar.status },
      };
    }

    case "match_buyers": {
      if (!input.leadId) return { action: input.action, success: false, message: "leadId required" };
      const packet = await buildLeadPacket({
        leadId: input.leadId,
        packetType: "buyer_investor_opportunity",
      });
      rebuildReviewQueue();
      return {
        action: input.action,
        success: true,
        message: "Buyer/investor opportunity packet prepared. Manual review required before sharing — never auto-sent.",
        details: { packetId: packet.id },
      };
    }

    case "archive_packets": {
      if (!input.leadId) return { action: input.action, success: false, message: "leadId required" };
      const packets = getProgramPackets({ leadId: input.leadId });
      if (packets.length === 0) return { action: input.action, success: false, message: "No packets to archive" };
      const archived = archivePacket(packets[0]);
      rebuildReviewQueue();
      return {
        action: input.action,
        success: true,
        message: `Packet v${packets[0].packetVersion} archived.`,
        details: { archiveId: archived.id },
      };
    }

    case "full_lead_to_packet_workflow": {
      if (!input.leadId && !input.countyName) {
        return { action: input.action, success: false, message: "leadId or countyName required" };
      }
      const steps: string[] = [];

      if (input.countyName && !input.leadId) {
        const county = input.countyName;
        const state = input.stateAbbr ?? "MD";
        const pipelineResult = await runCountyPipeline(state, county);
        steps.push(`Pipeline: ${pipelineResult.itemsCreated} item(s)`);
        rebuildReviewQueue();
        return {
          action: input.action,
          success: true,
          message: `Full workflow started for ${county}. Stopped at manual review gate.`,
          details: { steps, mode },
        };
      }

      if (input.leadId) {
        const docResult = await runDocumentFinder(input.leadId);
        steps.push(`Documents: ${docResult.attachedCount} attached, ${docResult.missingCount} missing`);
        const ar = evaluateAssignmentReadiness(input.leadId);
        const packet = await buildLeadPacket({
          leadId: input.leadId,
          packetType: "full_lead_archive",
          assignmentReadiness: ar,
        });
        steps.push(`Packet v${packet.packetVersion} built`);
        if (mode === "full_automation" && packet.packetStatus !== "compliance_blocked") {
          const archived = archivePacket(packet);
          steps.push(`Archived: ${archived.id}`);
        } else {
          steps.push("Stopped before archive — approval gate");
        }
        rebuildReviewQueue();
        return {
          action: input.action,
          success: true,
          message: `Full lead-to-packet workflow complete. Stopped at required approval gates.`,
          details: { steps, packetId: packet.id, operator: session.userName },
        };
      }

      return { action: input.action, success: false, message: "Workflow could not start" };
    }

    default:
      return { action: input.action, success: false, message: "Unknown action" };
  }
}

export { getPacketTypes, runDocumentFinder, buildLeadPacket, evaluateAssignmentReadiness, rebuildReviewQueue };
export { generateDraftSignatureDocuments } from "./draft-signature-builder";
export { getArchiveOverview, recordPacketPrint, archivePacket } from "./archive";
export {
  getArchiveHubData,
  saveToInitialReviewArchive,
  saveToFinalAttorneyArchive,
  lockArchiveVersion,
} from "./archive-hub";
export { getProgramPackets, getLeadArchives, getDraftSignatureDocuments, getArchiveFiles } from "./local-store";
export { getReviewQueueOverview } from "./review-queue";
export { getRequiredDocuments, getAssignmentReadiness } from "./local-store";
export { updateAssignmentFees } from "./assignment-readiness";
