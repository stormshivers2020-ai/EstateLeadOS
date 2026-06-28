import "server-only";

import type { NormalizedGovernmentRecord } from "../types";

/** Harford County MD public ArcGIS parcel layer — live structured government records. */
const HARFORD_PARCEL_LAYER =
  "https://gis.harfordcountymd.gov/arcgis/rest/services/Property/Parcels/MapServer/0/query";

export async function fetchHarfordParcels(input: {
  county: string;
  state: string;
  limit?: number;
}): Promise<NormalizedGovernmentRecord[]> {
  if (input.county !== "Harford" || input.state !== "MD") return [];

  const params = new URLSearchParams({
    where: "1=1",
    outFields: "PARCEL_ID,ADDRESS,OWNER_NAME,ACCT_ID,TAX_MAP,MAILING_ADDRESS",
    returnGeometry: "false",
    f: "json",
    resultRecordCount: String(input.limit ?? 8),
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(`${HARFORD_PARCEL_LAYER}?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return [];

    const json = (await res.json()) as {
      features?: Array<{
        attributes?: Record<string, string | number | null>;
      }>;
    };

    const records: NormalizedGovernmentRecord[] = [];
    for (const feature of json.features ?? []) {
      const a = feature.attributes ?? {};
      const address = String(a.ADDRESS ?? "").trim();
      const owner = String(a.OWNER_NAME ?? "").trim();
      const parcelId = String(a.PARCEL_ID ?? a.TAX_MAP ?? "").trim();
      if (!address && !parcelId) continue;

      records.push({
        source_name: "Harford County GIS Parcel Map (ArcGIS Live)",
        source_type: "gis_parcel_map",
        jurisdiction_state: "MD",
        jurisdiction_county: "Harford",
        source_url: `https://gis.harfordcountymd.gov/`,
        record_type: "gis_parcel_map",
        property_address: address || null,
        owner_name: owner || null,
        decedent_name: null,
        estate_case_number: null,
        personal_representative: null,
        interested_persons: [],
        mailing_address: String(a.MAILING_ADDRESS ?? "").trim() || null,
        transfer_date: null,
        deed_reference: null,
        parcel_id: parcelId || null,
        tax_account_id: String(a.ACCT_ID ?? "").trim() || null,
        media_url: parcelId
          ? `https://gis.harfordcountymd.gov/arcgis/rest/services/Property/Parcels/MapServer/0?parcel=${encodeURIComponent(parcelId)}`
          : null,
        confidence_score: 78,
        source_certainty_score: 88,
        has_source_proof: true,
        fetch_method: "arcgis_api",
        content_hash: null,
        certainty_factors: ["ArcGIS live parcel query", "Official GIS hostname", "Parcel ID extracted"],
        raw_payload: { arcgis: a, fetchMethod: "arcgis_api" },
        title: `Harford GIS Parcel ${parcelId || address}`,
        snippet: `Owner: ${owner || "—"} · Address: ${address || "—"} · Parcel: ${parcelId || "—"}`,
      });
    }
    return records;
  } catch {
    return [];
  }
}
