import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { appendPlatformAudit } from "@/lib/local/localAudit";
import { getSessionContext } from "@/lib/config/session";
import type { FullLeadDetail } from "@/lib/types/crm";
import { DEMO_FULL_LEADS } from "@/lib/seed/demo-crm";

export interface CsvImportPreview {
  columns: string[];
  rows: Record<string, string>[];
  suggestedMappings: Record<string, string>;
  missingFields: string[];
  duplicateCount: number;
}

export interface CsvImportResult {
  batchId: string;
  imported: number;
  duplicates: number;
  errors: number;
  leads: FullLeadDetail[];
}

const SAMPLE_CSV = `property_address,owner_name,state,county,lead_type
1234 Oak Lane,Henry Walker,TX,Harris,probate
5678 Maple Dr,Sandra Mills,FL,Duval,inherited_property`;

export function getSampleCsvContent(): string {
  return SAMPLE_CSV;
}

export function parseCsvPreview(csvText: string): CsvImportPreview {
  const lines = csvText.trim().split("\n").filter(Boolean);
  const columns = lines[0]?.split(",").map((c) => c.trim()) ?? [];
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    return columns.reduce<Record<string, string>>((acc, col, i) => {
      acc[col] = values[i]?.trim() ?? "";
      return acc;
    }, {});
  });

  const suggestedMappings: Record<string, string> = {};
  columns.forEach((col) => {
    if (col.includes("address")) suggestedMappings[col] = "propertyAddress";
    else if (col.includes("owner")) suggestedMappings[col] = "ownerName";
    else if (col === "state") suggestedMappings[col] = "state";
    else if (col.includes("county")) suggestedMappings[col] = "county";
    else suggestedMappings[col] = "unmapped";
  });

  const required = ["property_address", "owner_name", "state", "county"];
  const missingFields = required.filter((r) => !columns.includes(r));

  const existing = getLocalState().leads.map((l) => l.propertyAddress.toLowerCase());
  const duplicateCount = rows.filter((r) =>
    existing.includes((r.property_address ?? "").toLowerCase())
  ).length;

  return { columns, rows, suggestedMappings, missingFields, duplicateCount };
}

export function importCsvLocally(csvText: string, markAsDemo = false): CsvImportResult {
  const preview = parseCsvPreview(csvText);
  const session = getSessionContext();
  const state = getLocalState();
  const now = new Date().toISOString();
  const batchId = `import-${Date.now()}`;
  const leads: FullLeadDetail[] = [];
  let duplicates = 0;
  let errors = 0;

  for (const row of preview.rows) {
    if (!row.property_address || !row.state) {
      errors += 1;
      continue;
    }
    if (state.leads.some((l) => l.propertyAddress.toLowerCase() === row.property_address.toLowerCase())) {
      duplicates += 1;
      continue;
    }
    const template = DEMO_FULL_LEADS[0];
    const lead: FullLeadDetail = {
      ...template,
      id: `lead-import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      organizationId: session.organizationId,
      propertyAddress: row.property_address,
      ownerName: row.owner_name ?? "Unknown Owner",
      state: row.state,
      county: row.county ?? "Unknown",
      primaryLeadType: (row.lead_type as FullLeadDetail["primaryLeadType"]) ?? "probate",
      origin: markAsDemo ? "demo" : "csv_imported",
      pipelineStage: "new_lead",
      estateLeadScore: 55 + Math.floor(Math.random() * 30),
      dealPotentialScore: 40 + Math.floor(Math.random() * 35),
      complianceRiskScore: 35,
      dataConfidenceScore: 60,
      createdAt: now,
      updatedAt: now,
      demoRecord: markAsDemo,
    } as FullLeadDetail & { demoRecord?: boolean };
    leads.push(lead);
  }

  state.leads = [...leads, ...state.leads];
  state.demoMode = state.demoMode || markAsDemo;
  state.importBatches = [
    {
      id: batchId,
      organizationId: session.organizationId,
      fileName: "upload.csv",
      rowCount: preview.rows.length,
      importedCount: leads.length,
      duplicateCount: duplicates,
      errorCount: errors,
      createdAt: now,
      demoRecord: markAsDemo,
    },
    ...state.importBatches,
  ];
  persistLocalState();

  appendPlatformAudit({
    eventType: "csv_import",
    eventDescription: `CSV import completed: ${leads.length} leads imported locally`,
    relatedModule: "lead_discovery",
    relatedRecordId: batchId,
  });

  return { batchId, imported: leads.length, duplicates, errors, leads };
}
