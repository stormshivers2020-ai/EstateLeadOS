import "server-only";

import { getSessionContext } from "@/lib/config/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import { runCountyConnectors } from "@/lib/record-sources/maryland";
import { governmentRecordsToCandidates } from "@/lib/services/government/candidate-mapper";
import type { GovernmentNormalizedRecord } from "@/lib/types/government";
import type { NormalizedGovernmentRecord } from "@/lib/record-sources/types";
import { derivePipelineStage, scorePipelineRecord } from "./confidence-scoring";
import * as local from "./local-store";
import type { LeadPipelineStage } from "@/lib/types/pipeline";
import { queuePendingLocally } from "@/lib/services/lead-discovery/approval";
import { persistVerificationForCandidateAsync } from "@/lib/services/verification";

function toGovRecord(r: NormalizedGovernmentRecord): GovernmentNormalizedRecord {
  return {
    sourceName: r.source_name,
    sourceType: r.source_type,
    sourceUrl: r.source_url,
    jurisdiction: `${r.jurisdiction_county} County, ${r.jurisdiction_state}`,
    recordType: r.record_type,
    propertyAddress: r.property_address,
    ownerName: r.owner_name,
    transferDate: r.transfer_date,
    deedReference: r.deed_reference,
    estateCaseNumber: r.estate_case_number,
    decedentName: r.decedent_name,
    personalRepresentative: r.personal_representative,
    interestedPersons: r.interested_persons,
    mailingAddress: r.mailing_address,
    confidenceScore: r.confidence_score,
    rawPayload: r.raw_payload,
    title: r.title,
    snippet: r.snippet,
  };
}

export async function runCountyPipeline(stateAbbr: string, countyName: string) {
  const session = getSessionContext();
  const config = local.getCountyConfig(stateAbbr, countyName);

  if (!config) {
    throw new Error(`County pipeline config not found: ${countyName}, ${stateAbbr}`);
  }
  if (config.isPaused) {
    throw new Error(`County pipeline is paused: ${countyName}`);
  }

  const run = local.createAutomationRun({
    organizationId: session.organizationId,
    countyConfigId: config.id,
    stateAbbr,
    countyName,
    runType: "county_pipeline",
    status: "running",
    automationMode: config.automationMode,
    sourcesQueried: 0,
    signalsFound: 0,
    itemsCreated: 0,
    itemsRejected: 0,
    errors: 0,
    summary: null,
  });

  local.logPipelineEvent({
    organizationId: session.organizationId,
    countyConfigId: config.id,
    automationRunId: run.id,
    actorUserId: session.userId,
    actorUserName: session.userName,
    eventType: "pipeline_run_started",
    reason: `County pipeline run for ${countyName}, ${stateAbbr}`,
  });

  try {
    const result = await runCountyConnectors({ stateAbbr, countyName, maxPerConnector: 4 });

    for (const task of result.manualReviewTasks) {
      local.logPipelineEvent({
        organizationId: session.organizationId,
        countyConfigId: config.id,
        automationRunId: run.id,
        actorUserId: session.userId,
        actorUserName: session.userName,
        eventType: "manual_review_required",
        sourceName: task.sourceName,
        reason: task.reason,
      });
    }

    const grouped = new Map<string, NormalizedGovernmentRecord[]>();
    for (const record of result.records) {
      const key = (record.property_address ?? record.decedent_name ?? record.title).toLowerCase();
      const arr = grouped.get(key) ?? [];
      arr.push(record);
      grouped.set(key, arr);
    }

    let itemsCreated = 0;
    const searchId = `pipeline-${run.id}`;

    for (const [, records] of grouped) {
      const primary = records[0];
      const scoring = scorePipelineRecord(primary);
      const stage = derivePipelineStage(records, scoring.total);

      if (stage === "rejected_non_government_source") continue;

      const item = local.createPipelineItem({
        organizationId: session.organizationId,
        countyConfigId: config.id,
        stateAbbr,
        countyName,
        pipelineStage: stage,
        propertyAddress: primary.property_address,
        decedentName: primary.decedent_name,
        personalRepresentative: primary.personal_representative,
        confidenceScore: scoring.total,
        governmentSourcesOnly: true,
        manualApprovalRequired: true,
        manuallyApproved: false,
        approvedBy: null,
        approvedAt: null,
        notes: scoring.items.map((i) => `${i.label}: +${i.points}`).join("; "),
        leadId: null,
      });

      local.logPipelineEvent({
        organizationId: session.organizationId,
        pipelineItemId: item.id,
        countyConfigId: config.id,
        automationRunId: run.id,
        actorUserId: session.userId,
        actorUserName: session.userName,
        eventType: "stage_assigned",
        newStage: stage,
        sourceName: primary.source_name,
        sourceUrl: primary.source_url,
        confidenceScore: scoring.total,
        reason: "Government record normalized and staged",
      });

      if (stage === "ready_for_manual_review" || stage === "estate_signal_found" || stage === "property_match_found") {
        const candidates = governmentRecordsToCandidates(
          records.map(toGovRecord),
          { state: stateAbbr, county: countyName }
        );
        if (candidates.length > 0 && !isSupabaseMode()) {
          const queued = queuePendingLocally(candidates.slice(0, 1), searchId);
          for (const p of queued) {
            await persistVerificationForCandidateAsync(p.id, p.candidate, searchId);
            local.updatePipelineItem(item.id, { leadId: p.id });
          }
        }
      }

      itemsCreated++;
    }

    const updatedConfig = local.updateCountyConfig(stateAbbr, countyName, {
      status: config.status === "not_started" ? "configured" : config.status,
      lastRunAt: new Date().toISOString(),
      lastRunId: run.id,
      signalsFound: config.signalsFound + result.records.length,
      estateMatches: config.estateMatches + itemsCreated,
      readyForReview: local.getPipelineItems({ countyName, stage: "ready_for_manual_review" as LeadPipelineStage }).length,
    });

    local.completeAutomationRun(run.id, {
      status: "completed",
      sourcesQueried: result.sourcesQueried,
      signalsFound: result.records.length,
      itemsCreated,
      summary: `${itemsCreated} pipeline item(s) from ${result.records.length} government record(s)`,
    });

    return {
      runId: run.id,
      config: updatedConfig,
      recordsFound: result.records.length,
      itemsCreated,
      manualReviewTasks: result.manualReviewTasks,
      queries: result.queries,
    };
  } catch (error) {
    local.completeAutomationRun(run.id, {
      status: "failed",
      errors: 1,
      summary: error instanceof Error ? error.message : "Pipeline run failed",
    });
    throw error;
  }
}

export function approvePipelineItem(itemId: string) {
  const session = getSessionContext();
  const item = local.getPipelineItems().find((i) => i.id === itemId);
  if (!item) return null;

  if (item.pipelineStage !== "ready_for_manual_review") {
    throw new Error(
      "Lead must reach ready_for_manual_review with full government proof chain before verification."
    );
  }
  if (item.confidenceScore < 85) {
    throw new Error("Confidence score must be at least 85 before verified_government_lead.");
  }
  if (!item.governmentSourcesOnly) {
    throw new Error("Non-government sources cannot be verified as government leads.");
  }

  const prior = item.pipelineStage;
  const updated = local.updatePipelineItem(itemId, {
    pipelineStage: "verified_government_lead",
    manuallyApproved: true,
    approvedBy: session.userName,
    approvedAt: new Date().toISOString(),
  });

  local.logPipelineEvent({
    organizationId: session.organizationId,
    pipelineItemId: itemId,
    countyConfigId: item.countyConfigId,
    actorUserId: session.userId,
    actorUserName: session.userName,
    eventType: "manual_approval",
    priorStage: prior,
    newStage: "verified_government_lead",
    confidenceScore: item.confidenceScore,
    reason: "Operator manually approved government lead",
  });

  if (item.countyConfigId) {
    const config = local.getCountyConfig(item.stateAbbr, item.countyName);
    if (config) {
      local.updateCountyConfig(item.stateAbbr, item.countyName, {
        verifiedLeads: config.verifiedLeads + 1,
      });
    }
  }

  return updated;
}

export {
  getCountyPipelineConfigs,
  getCountyConfig,
  getPipelineDashboard,
  getPipelineItems,
  getPipelineEvents,
  getAutomationRuns,
  updateCountyConfig,
  toggleCountyPause,
  setCountyStatus,
  seedMarylandCountyConfigs,
} from "./local-store";
