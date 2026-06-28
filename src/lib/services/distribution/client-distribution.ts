import { isLocalPreviewMode } from "@/lib/config/runtime";
import { buildAttorneyReviewFileClient } from "@/lib/services/distribution/client-attorney-review";
import { getOrCreateCompensation, updateCompensation } from "@/lib/services/distribution/attorney-compensation-store";
import { uploadAttorneyFile } from "@/lib/services/distribution/attorney-upload";
import {
  inferWorkflowSteps,
  selectPacketForAttorneyReview,
  moveReviewedFilesToFinalArchive,
  listLeadPacketsForReview,
} from "@/lib/services/distribution/attorney-review-workflow";
import {
  markSentToAttorney,
  updateAttorneyReview,
  acknowledgeManualOverride,
} from "@/lib/services/distribution/attorney-review-mutations";
import {
  getAttorneyReview,
  getAttorneyCompensation,
  getDistributionAuditLogs,
} from "@/lib/services/distribution/local-store";
import { getProgramPackets } from "@/lib/services/program/local-store";
import type {
  AttorneyCompensation,
  AttorneyReview,
  AttorneyReviewUpload,
  DistributionAuditLog,
} from "@/lib/types/distribution";
import type { LeadPacket } from "@/lib/types/program";

export interface AttorneyReviewData {
  review: AttorneyReview | null;
  compensation: AttorneyCompensation | null;
  audit: DistributionAuditLog[];
  packets: LeadPacket[];
  workflowSteps: ReturnType<typeof inferWorkflowSteps>;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? "Request failed");
  }
  return json as T;
}

function loadLocalAttorneyData(leadId: string): AttorneyReviewData {
  const review = getAttorneyReview(leadId);
  const compensation = getAttorneyCompensation(leadId);
  return {
    review,
    compensation,
    audit: getDistributionAuditLogs(leadId),
    packets: getProgramPackets({ leadId }),
    workflowSteps: inferWorkflowSteps(review, compensation),
  };
}

export async function loadAttorneyReviewData(leadId: string): Promise<AttorneyReviewData> {
  if (isLocalPreviewMode()) {
    return loadLocalAttorneyData(leadId);
  }
  const json = await fetchJson<Omit<AttorneyReviewData, "workflowSteps" | "packets"> & { packets?: LeadPacket[] }>(
    `/api/distribution/attorney-review/${leadId}`
  );
  return {
    ...json,
    packets: json.packets ?? [],
    workflowSteps: inferWorkflowSteps(json.review, json.compensation),
  };
}

export async function attorneyReviewAction(
  leadId: string,
  action: string,
  extra?: Record<string, unknown>
): Promise<{ error?: string; message?: string }> {
  if (isLocalPreviewMode()) {
    try {
      switch (action) {
        case "build_review_file":
          buildAttorneyReviewFileClient(leadId, extra?.packetId as string | undefined);
          return { message: "Attorney review file built." };
        case "mark_sent":
          markSentToAttorney(leadId);
          return { message: "Marked as sent / delivered manually." };
        case "update":
          updateAttorneyReview(leadId, (extra?.patch ?? {}) as Partial<AttorneyReview>);
          return { message: "Review updated." };
        case "select_packet":
          selectPacketForAttorneyReview(leadId, extra?.packetId as string);
          return { message: "Packet selected for attorney review." };
        case "upload":
          uploadAttorneyFile({
            leadId,
            fileName: extra?.fileName as string,
            fileUrl: extra?.fileUrl as string,
            fileType: (extra?.fileType as string) ?? "application/pdf",
            documentCategory: extra?.documentCategory as AttorneyReviewUpload["documentCategory"],
            notes: extra?.notes as string | undefined,
            packetId: extra?.packetId as string | undefined,
          });
          return { message: "File uploaded and versioned." };
        case "update_compensation": {
          const review = getAttorneyReview(leadId);
          if (!review) throw new Error("Start attorney review first");
          getOrCreateCompensation(leadId, review.id);
          updateCompensation(leadId, (extra?.patch ?? {}) as Partial<AttorneyCompensation>);
          return { message: "Compensation terms recorded (not legal advice)." };
        }
        case "move_final_archive": {
          const result = moveReviewedFilesToFinalArchive(leadId);
          return { message: result.message };
        }
        case "manual_override":
          acknowledgeManualOverride(leadId);
          return { message: "Manual override acknowledged." };
        default:
          return { error: "Invalid action" };
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Action failed" };
    }
  }

  const json = await fetchJson<{ error?: string; message?: string }>(`/api/distribution/attorney-review/${leadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  return json;
}

export function getReviewPackets(leadId: string): LeadPacket[] {
  if (isLocalPreviewMode()) {
    return listLeadPacketsForReview(leadId);
  }
  return [];
}
