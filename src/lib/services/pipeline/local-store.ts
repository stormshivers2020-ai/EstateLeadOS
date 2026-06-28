import { getSessionContext } from "@/lib/config/session";
import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { MARYLAND_COUNTIES } from "@/lib/record-sources/maryland/counties";
import { getActiveSourceIdsForCounty } from "@/lib/constants/maryland-pipeline-sources";
import type {
  AutomationRunRecord,
  CountyPipelineConfig,
  CountyPipelineStatus,
  LeadPipelineEvent,
  LeadPipelineItem,
  LeadPipelineStage,
} from "@/lib/types/pipeline";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function seedMarylandCountyConfigs(orgId: string): CountyPipelineConfig[] {
  return MARYLAND_COUNTIES.map((county) => {
    const isHarford = county === "Harford";
    const isMajor = county === "Montgomery" || county === "Baltimore" || county === "Baltimore City";
    return {
      id: `cpc-md-${county.toLowerCase().replace(/[^a-z]/g, "-")}`,
      organizationId: orgId,
      stateAbbr: "MD",
      countyName: county,
      status: isHarford ? "active" : isMajor ? "configured" : "configured",
      automationMode: "supervised",
      isPaused: false,
      isProofEngine: isHarford,
      activeSourceIds: getActiveSourceIdsForCounty(county),
      signalsFound: 0,
      estateMatches: 0,
      propertyMatches: 0,
      readyForReview: 0,
      verifiedLeads: 0,
      rejectedLeads: 0,
      lastRunAt: null,
      lastRunId: null,
      notes: isHarford ? "Maryland proof engine — first active county" : "Statewide MD sources registered",
      createdAt: now(),
      updatedAt: now(),
    };
  });
}

/** Activate and register sources for every Maryland county pipeline */
export function activateAllMarylandPipelines(): CountyPipelineConfig[] {
  const state = ensurePipelineState();
  const orgId = getSessionContext().organizationId;
  const existing = new Map((state.countyPipelineConfigs ?? []).map((c) => [c.countyName, c]));
  const next: CountyPipelineConfig[] = [];

  for (const county of MARYLAND_COUNTIES) {
    const isHarford = county === "Harford";
    const sourceIds = getActiveSourceIdsForCounty(county);
    const prev = existing.get(county);
    if (prev) {
      next.push({
        ...prev,
        activeSourceIds: sourceIds,
        status: prev.isPaused ? prev.status : isHarford ? "active" : prev.status === "active" ? "active" : "configured",
        isProofEngine: isHarford,
        notes: prev.notes ?? (isHarford ? "Maryland proof engine" : "Statewide MD sources registered"),
        updatedAt: now(),
      });
    } else {
      next.push({
        id: `cpc-md-${county.toLowerCase().replace(/[^a-z]/g, "-")}`,
        organizationId: orgId,
        stateAbbr: "MD",
        countyName: county,
        status: isHarford ? "active" : "configured",
        automationMode: "supervised",
        isPaused: false,
        isProofEngine: isHarford,
        activeSourceIds: sourceIds,
        signalsFound: 0,
        estateMatches: 0,
        propertyMatches: 0,
        readyForReview: 0,
        verifiedLeads: 0,
        rejectedLeads: 0,
        lastRunAt: null,
        lastRunId: null,
        notes: isHarford ? "Maryland proof engine — first active county" : "Statewide MD sources registered",
        createdAt: now(),
        updatedAt: now(),
      });
    }
  }

  state.countyPipelineConfigs = next;
  persistLocalState();
  return next;
}

function ensurePipelineState() {
  const state = getLocalState() as ReturnType<typeof getLocalState> & {
    countyPipelineConfigs?: CountyPipelineConfig[];
    leadPipelineItems?: LeadPipelineItem[];
    leadPipelineEvents?: LeadPipelineEvent[];
    automationRuns?: AutomationRunRecord[];
  };

  if (!state.countyPipelineConfigs || state.countyPipelineConfigs.length === 0) {
    state.countyPipelineConfigs = seedMarylandCountyConfigs(getSessionContext().organizationId);
  } else if (state.countyPipelineConfigs.length < MARYLAND_COUNTIES.length) {
    activateAllMarylandPipelines();
  }
  if (!state.leadPipelineItems) state.leadPipelineItems = [];
  if (!state.leadPipelineEvents) state.leadPipelineEvents = [];
  if (!state.automationRuns) state.automationRuns = [];
  return state;
}

export function getCountyPipelineConfigs(): CountyPipelineConfig[] {
  return ensurePipelineState().countyPipelineConfigs ?? [];
}

export function getCountyConfig(stateAbbr: string, countyName: string): CountyPipelineConfig | null {
  return getCountyPipelineConfigs().find((c) => c.stateAbbr === stateAbbr && c.countyName === countyName) ?? null;
}

export function updateCountyConfig(
  stateAbbr: string,
  countyName: string,
  patch: Partial<CountyPipelineConfig>
): CountyPipelineConfig | null {
  const state = ensurePipelineState();
  const idx = state.countyPipelineConfigs!.findIndex((c) => c.stateAbbr === stateAbbr && c.countyName === countyName);
  if (idx === -1) return null;
  state.countyPipelineConfigs![idx] = { ...state.countyPipelineConfigs![idx], ...patch, updatedAt: now() };
  persistLocalState();
  return state.countyPipelineConfigs![idx];
}

export function setCountyStatus(stateAbbr: string, countyName: string, status: CountyPipelineStatus) {
  return updateCountyConfig(stateAbbr, countyName, { status });
}

export function toggleCountyPause(stateAbbr: string, countyName: string, paused: boolean) {
  return updateCountyConfig(stateAbbr, countyName, {
    isPaused: paused,
    status: paused ? "paused" : "active",
  });
}

export function getPipelineItems(filters?: { countyName?: string; stage?: LeadPipelineStage }) {
  const items = ensurePipelineState().leadPipelineItems ?? [];
  return items.filter((i) => {
    if (filters?.countyName && i.countyName !== filters.countyName) return false;
    if (filters?.stage && i.pipelineStage !== filters.stage) return false;
    return true;
  });
}

export function createPipelineItem(input: Omit<LeadPipelineItem, "id" | "createdAt" | "updatedAt">): LeadPipelineItem {
  const state = ensurePipelineState();
  const item: LeadPipelineItem = {
    ...input,
    id: uid("lpi"),
    createdAt: now(),
    updatedAt: now(),
  };
  state.leadPipelineItems!.unshift(item);
  persistLocalState();
  return item;
}

export function updatePipelineItem(id: string, patch: Partial<LeadPipelineItem>): LeadPipelineItem | null {
  const state = ensurePipelineState();
  const idx = state.leadPipelineItems!.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  state.leadPipelineItems![idx] = { ...state.leadPipelineItems![idx], ...patch, updatedAt: now() };
  persistLocalState();
  return state.leadPipelineItems![idx];
}

export function logPipelineEvent(
  event: Omit<LeadPipelineEvent, "id" | "createdAt">
): LeadPipelineEvent {
  const state = ensurePipelineState();
  const row: LeadPipelineEvent = { ...event, id: uid("lpe"), createdAt: now() };
  state.leadPipelineEvents!.unshift(row);
  if (state.leadPipelineEvents!.length > 1000) state.leadPipelineEvents!.length = 1000;
  persistLocalState();
  return row;
}

export function createAutomationRun(input: Omit<AutomationRunRecord, "id" | "createdAt" | "startedAt">): AutomationRunRecord {
  const state = ensurePipelineState();
  const run: AutomationRunRecord = {
    ...input,
    id: uid("ar"),
    startedAt: now(),
    createdAt: now(),
  };
  state.automationRuns!.unshift(run);
  persistLocalState();
  return run;
}

export function completeAutomationRun(
  id: string,
  patch: Partial<AutomationRunRecord>
): AutomationRunRecord | null {
  const state = ensurePipelineState();
  const idx = state.automationRuns!.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  state.automationRuns![idx] = {
    ...state.automationRuns![idx],
    ...patch,
    status: patch.status ?? "completed",
    completedAt: now(),
  };
  persistLocalState();
  return state.automationRuns![idx];
}

export function getAutomationRuns(countyName?: string): AutomationRunRecord[] {
  const runs = ensurePipelineState().automationRuns ?? [];
  return countyName ? runs.filter((r) => r.countyName === countyName) : runs;
}

export function getPipelineEvents(pipelineItemId?: string): LeadPipelineEvent[] {
  const events = ensurePipelineState().leadPipelineEvents ?? [];
  return pipelineItemId ? events.filter((e) => e.pipelineItemId === pipelineItemId) : events;
}

export function getPipelineDashboard() {
  const configs = getCountyPipelineConfigs();
  const items = getPipelineItems();
  return {
    counties: configs,
    totals: {
      active: configs.filter((c) => c.status === "active").length,
      signals: items.length,
      estate: items.filter((i) => /estate|decedent/i.test(i.pipelineStage)).length,
      property: items.filter((i) => /property/i.test(i.pipelineStage)).length,
      ready: items.filter((i) => i.pipelineStage === "ready_for_manual_review").length,
      verified: items.filter((i) => i.pipelineStage === "verified_government_lead").length,
      rejected: items.filter((i) => i.pipelineStage.startsWith("rejected")).length,
    },
    recentRuns: getAutomationRuns().slice(0, 10),
    recentEvents: getPipelineEvents().slice(0, 20),
  };
}
