import type { FullLeadDetail } from "@/lib/types/crm";
import { REQUIRED_DOCUMENT_TYPES } from "./automationSourceRunner";

export interface DocumentDiscoveryResult {
  documentsFound: string[];
  documentsMissing: string[];
  documentsRequiringUpload: string[];
  sourceLinksFound: { name: string; url: string | null }[];
  sourceWarnings: string[];
  manualResearchTasks: string[];
  approvalRequired: boolean;
  approvalReason: string | null;
}

export function runDocumentDiscovery(lead: FullLeadDetail | null, isLocal: boolean): DocumentDiscoveryResult {
  if (!lead) {
    return {
      documentsFound: [],
      documentsMissing: [...REQUIRED_DOCUMENT_TYPES],
      documentsRequiringUpload: [...REQUIRED_DOCUMENT_TYPES],
      sourceLinksFound: [],
      sourceWarnings: ["No lead selected — intake required before document discovery."],
      manualResearchTasks: ["Complete New Lead Intake Wizard"],
      approvalRequired: true,
      approvalReason: "Lead must exist before document discovery can continue.",
    };
  }

  const found: string[] = [];
  const missing: string[] = [];
  const upload: string[] = [];
  const manualTasks: string[] = [];
  const warnings: string[] = [];

  if (lead.deedType) found.push("Deed record");
  else { missing.push("Deed record"); upload.push("Deed record"); }

  if (lead.lastTransferDate) found.push("Transfer record");
  else { missing.push("Transfer record"); manualTasks.push(`Verify transfer record for ${lead.county}, ${lead.state}`); }

  if (lead.taxAssessedValue) found.push("Tax assessor record");
  else missing.push("Tax assessor record");

  found.push("Property record");
  if (lead.primaryLeadType.includes("probate")) {
    missing.push("Probate court record");
    manualTasks.push(`Research probate court records for ${lead.county}, ${lead.state}`);
  }

  if (lead.ownerHeir.ownerVerificationStatus === "verified") found.push("Owner verification checklist");
  else { missing.push("Owner verification checklist"); upload.push("Owner verification checklist"); }

  missing.push("Probate status checklist", "State risk acknowledgement", "Compliance acknowledgement", "Property research sheet");

  const sourceLinks = lead.sourceRecords.map((s) => ({
    name: s.sourceName,
    url: s.sourceUrl ?? null,
  }));

  for (const src of lead.sourceRecords) {
    if (src.permissionStatus === "blocked" || src.permissionStatus === "unknown") {
      warnings.push(`${src.sourceName} is not approved for automated access.`);
    }
    if (src.permissionStatus === "research_only") {
      warnings.push(`${src.sourceName} is research-only — manual review required.`);
    }
  }

  const approvalRequired = warnings.length > 0 || missing.length > 3;
  const approvalReason = approvalRequired
    ? warnings[0] ?? "Missing documents require user upload or manual research approval."
    : null;

  if (isLocal) {
    warnings.push("Local Preview Mode uses simulated document discovery — no live records connected.");
  }

  return {
    documentsFound: found,
    documentsMissing: missing,
    documentsRequiringUpload: upload,
    sourceLinksFound: sourceLinks,
    sourceWarnings: warnings,
    manualResearchTasks: manualTasks,
    approvalRequired,
    approvalReason,
  };
}
