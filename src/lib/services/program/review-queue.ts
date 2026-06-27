import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getPipelineItems } from "@/lib/services/pipeline/local-store";
import type { ReviewQueueItem, ReviewQueueType } from "@/lib/types/program";
import { getProgramPackets } from "@/lib/services/program/local-store";
import { getAttorneyReview } from "@/lib/services/distribution/local-store";
import { getRequiredDocuments } from "./local-store";
import { getAssignmentReadiness } from "./local-store";
import { upsertReviewQueueItem, removeReviewQueueItem, getReviewQueueItems } from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function rebuildReviewQueue(): ReviewQueueItem[] {
  const session = getSessionContext();
  const items: ReviewQueueItem[] = [];

  // Pipeline items ready for manual review
  for (const pi of getPipelineItems({ stage: "ready_for_manual_review" })) {
    items.push(makeQueueItem(session, {
      leadId: pi.leadId ?? pi.id,
      queueType: "leads_ready_for_manual_review",
      priority: 10,
      nextAction: "Approve or reject government lead",
      countyName: pi.countyName,
      stateAbbr: pi.stateAbbr,
      currentStage: pi.pipelineStage,
      confidenceScore: pi.confidenceScore,
    }));
  }

  // Packets ready to print
  for (const packet of getProgramPackets()) {
    if (["ready_for_internal_review", "assignment_review_ready", "ready_for_buyer_review"].includes(packet.packetStatus)) {
      items.push(makeQueueItem(session, {
        leadId: packet.leadId,
        packetId: packet.id,
        queueType: "packets_ready_to_print",
        priority: 20,
        nextAction: "Print and archive packet",
        packetStatus: packet.packetStatus,
        confidenceScore: packet.confidenceScore,
      }));
    }
    if (packet.packetStatus === "missing_documents") {
      items.push(makeQueueItem(session, {
        leadId: packet.leadId,
        packetId: packet.id,
        queueType: "missing_documents",
        priority: 30,
        nextAction: "Run Document Finder",
        missingDocumentCount: packet.sections.flatMap((s) => s.missingItems).length,
        packetStatus: packet.packetStatus,
      }));
    }
  }

  // Assignment review
  const leads = new Set(getProgramPackets().map((p) => p.leadId));
  for (const leadId of leads) {
    const ar = getAssignmentReadiness(leadId);
    if (ar?.status === "assignment_review_needed") {
      items.push(makeQueueItem(session, {
        leadId,
        queueType: "assignment_review_needed",
        priority: 25,
        nextAction: "Review assignment-readiness checklist",
      }));
    }
    const missing = getRequiredDocuments(leadId).filter((d) => d.status === "missing");
    if (missing.length > 0) {
      items.push(makeQueueItem(session, {
        leadId,
        queueType: "missing_documents",
        priority: 35,
        nextAction: "Resolve missing documents",
        missingDocumentCount: missing.length,
      }));
    }
  }

  // Attorney review needed
  for (const leadId of new Set(getProgramPackets().map((p) => p.leadId))) {
    const ar = getAttorneyReview(leadId);
    if (ar && !["approved", "approved_with_notes"].includes(ar.reviewStatus) && !ar.manualOverrideAcknowledged) {
      items.push(makeQueueItem(session, {
        leadId,
        queueType: "attorney_review_needed",
        priority: 15,
        nextAction: "Complete attorney review or upload reviewed file",
      }));
    }
  }

  // Dedupe and persist
  const existing = getReviewQueueItems();
  for (const item of items) {
    upsertReviewQueueItem(item);
  }

  return getReviewQueueItems();
}

function makeQueueItem(
  session: ReturnType<typeof getSessionContext>,
  partial: Partial<ReviewQueueItem> & { leadId: string; queueType: ReviewQueueType; nextAction: string }
): ReviewQueueItem {
  const lead = getFullLeadByIdSync(partial.leadId);
  return {
    id: uid("rq"),
    organizationId: session.organizationId,
    leadId: partial.leadId,
    packetId: partial.packetId ?? null,
    queueType: partial.queueType,
    priority: partial.priority ?? 50,
    status: "open",
    assignedTo: session.userName,
    nextAction: partial.nextAction,
    blockerCount: partial.blockerCount ?? 0,
    missingDocumentCount: partial.missingDocumentCount ?? 0,
    countyName: partial.countyName ?? lead?.county ?? null,
    stateAbbr: partial.stateAbbr ?? lead?.state ?? null,
    currentStage: partial.currentStage ?? null,
    confidenceScore: partial.confidenceScore ?? lead?.dataConfidenceScore ?? null,
    packetStatus: partial.packetStatus ?? null,
    leadTitle: lead?.propertyAddress ?? lead?.ownerName ?? partial.leadId,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function getReviewQueueOverview() {
  const items = rebuildReviewQueue();
  const byType: Record<string, number> = {};
  for (const item of items) {
    byType[item.queueType] = (byType[item.queueType] ?? 0) + 1;
  }
  return { items, byType, total: items.length };
}

export function dismissQueueItem(id: string) {
  removeReviewQueueItem(id);
}
