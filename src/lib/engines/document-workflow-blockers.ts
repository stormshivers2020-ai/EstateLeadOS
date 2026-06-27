import type { CrmPipelineStage } from "@/lib/types/crm";
import type { DocumentRecord, DocumentWorkflowBlocker } from "@/lib/types/documents";

const UNDER_CONTRACT_REQUIREMENTS = [
  "owner_heir_verification",
  "property_research_worksheet",
  "lead_source_record",
  "purchase_offer_worksheet",
  "seller_disclosure_ack",
  "compliance_acknowledgement",
  "state_risk_acknowledgement",
  "source_document_packet",
];

const ASSIGNMENT_REQUIREMENTS = [
  "assignment_disclosure_checklist",
  "buyer_assignee_disclosure_ack",
  "assignment_agreement_checklist",
  "buyer_profile_sheet",
  "proof_of_funds_record",
  "title_company_intake",
];

const CLOSING_REQUIREMENTS = [
  "closing_checklist",
  "title_company_intake",
  "communication_log_export",
  "source_document_packet",
  "deal_memo",
];

const COMPLETE_STATUSES = new Set([
  "generated", "uploaded", "signed", "reviewed", "approved",
]);

function isComplete(doc: DocumentRecord): boolean {
  return COMPLETE_STATUSES.has(doc.status) || doc.status === "not_required";
}

function findDoc(docs: DocumentRecord[], typeId: string): DocumentRecord | undefined {
  return docs.find((d) => d.documentTypeId === typeId && !d.archived);
}

export function checkDocumentBlockers(
  toStage: CrmPipelineStage,
  documents: DocumentRecord[],
  leadId: string,
  orgId = "demo-org"
): DocumentWorkflowBlocker[] {
  const blockers: DocumentWorkflowBlocker[] = [];
  const now = new Date().toISOString();

  const addBlocker = (
    typeId: string,
    name: string,
    stage: string,
    message: string
  ) => {
    const doc = findDoc(documents, typeId);
    blockers.push({
      id: `dwb-${leadId}-${typeId}-${stage}`,
      organizationId: orgId,
      leadId,
      documentRecordId: doc?.id ?? null,
      workflowStage: stage,
      blockerType: "missing_document",
      blockerMessage: message,
      requiredAction: `Complete or acknowledge ${name} in Document Center`,
      severity: "high",
      status: "active",
      createdAt: now,
    });
  };

  if (toStage === "under_contract") {
    for (const typeId of UNDER_CONTRACT_REQUIREMENTS) {
      const doc = findDoc(documents, typeId);
      if (!doc || !isComplete(doc)) {
        addBlocker(typeId, doc?.documentName ?? typeId.replace(/_/g, " "), "under_contract",
          `Required document missing or incomplete before Under Contract: ${typeId.replace(/_/g, " ")}`);
      }
    }
    const hasProbateLead = documents.some((d) => d.documentTypeId === "probate_status_checklist");
    if (hasProbateLead) {
      const probate = findDoc(documents, "probate_status_checklist");
      if (probate && !isComplete(probate)) {
        addBlocker("probate_status_checklist", "Probate Status Checklist", "under_contract",
          "Probate status checklist incomplete for probate-related lead");
      }
    }
    const purchaseChecklist = findDoc(documents, "purchase_agreement_checklist");
    if (purchaseChecklist && !isComplete(purchaseChecklist)) {
      addBlocker("purchase_agreement_checklist", "Purchase Agreement Checklist", "under_contract",
        "Purchase agreement checklist must be complete or acknowledged");
    }
    const attorneyAck = documents.filter((d) => d.attorneyReviewFlag && d.attorneyReviewStatus !== "acknowledged" && d.attorneyReviewStatus !== "not_required");
    for (const d of attorneyAck) {
      if (!isComplete(d)) {
        blockers.push({
          id: `dwb-${leadId}-attorney-${d.id}`,
          organizationId: orgId,
          leadId,
          documentRecordId: d.id,
          workflowStage: "under_contract",
          blockerType: "attorney_review",
          blockerMessage: `Attorney/title review tracking needed: ${d.documentName}`,
          requiredAction: "Acknowledge attorney/title review reminder or resolve review item",
          severity: "medium",
          status: "active",
          createdAt: now,
        });
      }
    }
  }

  if (toStage === "assignment_sent") {
    for (const typeId of ASSIGNMENT_REQUIREMENTS) {
      const doc = findDoc(documents, typeId);
      if (!doc || !isComplete(doc)) {
        addBlocker(typeId, doc?.documentName ?? typeId.replace(/_/g, " "), "assignment_sent",
          `Required document missing before Assignment Sent: ${typeId.replace(/_/g, " ")}`);
      }
    }
    const unresolvedAttorney = documents.filter(
      (d) => d.attorneyReviewFlag && !["acknowledged", "reviewed", "not_required"].includes(d.attorneyReviewStatus)
    );
    for (const d of unresolvedAttorney) {
      blockers.push({
        id: `dwb-${leadId}-assign-attorney-${d.id}`,
        organizationId: orgId,
        leadId,
        documentRecordId: d.id,
        workflowStage: "assignment_sent",
        blockerType: "attorney_review",
        blockerMessage: `Attorney review flag unresolved: ${d.documentName}`,
        requiredAction: "Resolve or acknowledge attorney review item",
        severity: "high",
        status: "active",
        createdAt: now,
      });
    }
  }

  if (toStage === "closing_scheduled") {
    for (const typeId of CLOSING_REQUIREMENTS) {
      const doc = findDoc(documents, typeId);
      if (!doc || !isComplete(doc)) {
        addBlocker(typeId, doc?.documentName ?? typeId.replace(/_/g, " "), "closing_scheduled",
          `Required document missing before Closing Scheduled: ${typeId.replace(/_/g, " ")}`);
      }
    }
    const signedNeeded = documents.filter(
      (d) => d.signatureNeededFlag && !["signed", "not_required"].includes(d.signatureStatus)
    );
    for (const d of signedNeeded) {
      blockers.push({
        id: `dwb-${leadId}-sig-${d.id}`,
        organizationId: orgId,
        leadId,
        documentRecordId: d.id,
        workflowStage: "closing_scheduled",
        blockerType: "signature_needed",
        blockerMessage: `Signature needed: ${d.documentName}`,
        requiredAction: "Upload signed copy or mark signature status",
        severity: "high",
        status: "active",
        createdAt: now,
      });
    }
  }

  return blockers;
}

export function getMissingDocumentsForStage(
  toStage: CrmPipelineStage,
  documents: DocumentRecord[]
): string[] {
  return checkDocumentBlockers(toStage, documents, "temp").map((b) => b.blockerMessage);
}
