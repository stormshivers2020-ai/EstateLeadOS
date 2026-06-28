import "server-only";

import { createHash } from "crypto";
import { classifySourceUrl } from "./source-filter";
import { extractRecordFields } from "./field-extractor";

export interface LiveFetchResult {
  ok: boolean;
  url: string;
  statusCode: number | null;
  contentHash: string | null;
  fetchedAt: string;
  extractedText: string;
  fetchMethod: "live_http" | "snippet_only" | "arcgis_api";
  error?: string;
}

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 512_000;

function hashContent(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 24);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

/** Fetch official government URL and extract text for certainty verification. */
export async function fetchOfficialSource(url: string): Promise<LiveFetchResult> {
  const fetchedAt = new Date().toISOString();
  const classification = classifySourceUrl(url, true);
  if (!classification.allowed) {
    return {
      ok: false,
      url,
      statusCode: null,
      contentHash: null,
      fetchedAt,
      extractedText: "",
      fetchMethod: "snippet_only",
      error: classification.rejectionReason ?? "URL not allowed",
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/json,text/plain",
        "User-Agent": "EstateLeadOS-GovernmentPipeline/1.0 (official-record-verification)",
      },
      redirect: "follow",
    });
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") ?? "";
    const raw = await res.text();
    const truncated = raw.slice(0, MAX_BYTES);
    const extractedText = contentType.includes("json")
      ? truncated
      : stripHtml(truncated);

    return {
      ok: res.ok && extractedText.length > 40,
      url,
      statusCode: res.status,
      contentHash: hashContent(truncated),
      fetchedAt,
      extractedText,
      fetchMethod: "live_http",
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      statusCode: null,
      contentHash: null,
      fetchedAt,
      extractedText: "",
      fetchMethod: "snippet_only",
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

/** Enrich a record snippet with live-fetched content when possible. */
export async function enrichRecordWithLiveFetch(input: {
  url: string;
  title: string;
  snippet: string;
  state: string;
}): Promise<{
  liveFetch: LiveFetchResult;
  mergedText: string;
  fields: ReturnType<typeof extractRecordFields>;
}> {
  const liveFetch = await fetchOfficialSource(input.url);
  const mergedText = liveFetch.ok
    ? `${input.title}. ${liveFetch.extractedText}`
    : `${input.title}. ${input.snippet}`;
  const fields = extractRecordFields(mergedText, input.state);
  return { liveFetch, mergedText, fields };
}
