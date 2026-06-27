"use client";

import { useState, useMemo } from "react";
import { US_STATES } from "@/lib/constants/us-states";
import { DEAL_TYPES, ACQUISITION_STRATEGIES } from "@/lib/types/compliance";
import type { DealType, AcquisitionStrategy } from "@/lib/types/compliance";
import { USER_ROLES } from "@/lib/constants/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskBadge, StateSupportBadge, CountySupportBadge } from "./ComplianceBadges";
import {
  GettingStartedPanel,
  EquipmentChecklistPanel,
  DocumentChecklistPanel,
} from "./ChecklistPanel";
import { WorkflowBlockerPanel } from "./WorkflowBlockerPanel";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { AlertTriangle, ExternalLink } from "lucide-react";
import {
  buildStateDealKit,
  runLeadComplianceCheck,
} from "@/lib/services/compliance";
import { buildDealKitDocuments } from "@/lib/services/documents";
import { ReadinessBadge } from "@/components/documents/DocumentBadges";
import Link from "next/link";
import type { StateProfile, CountyProfile } from "@/lib/types/compliance";

interface StateDealKitClientProps {
  states: StateProfile[];
  countiesByState: Record<string, CountyProfile[]>;
  isDemo: boolean;
}

export function StateDealKitClient({
  states,
  countiesByState,
  isDemo,
}: StateDealKitClientProps) {
  const [stateAbbr, setStateAbbr] = useState("TX");
  const [countyName, setCountyName] = useState("Harris");
  const [dealType, setDealType] = useState<DealType>("direct_purchase");
  const [userRole, setUserRole] = useState("solo_investor");
  const [strategy, setStrategy] = useState<AcquisitionStrategy>("direct_acquisition");

  const state = states.find((s) => s.stateAbbreviation === stateAbbr);
  const counties = countiesByState[stateAbbr] ?? [];
  const county = counties.find((c) => c.countyName === countyName);

  const kit = useMemo(
    () =>
      buildStateDealKit({
        stateAbbr,
        countyName: countyName || null,
        dealType,
        userRole,
        acquisitionStrategy: strategy,
      }),
    [stateAbbr, countyName, dealType, userRole, strategy]
  );

  const docAutomation = useMemo(
    () =>
      buildDealKitDocuments({
        stateAbbr,
        countyName: countyName || null,
        dealType,
      }),
    [stateAbbr, countyName, dealType]
  );

  const checkResult = useMemo(
    () =>
      runLeadComplianceCheck({
        stateAbbr,
        countyName: countyName || null,
        dealType,
        acquisitionStrategy: strategy,
      }),
    [stateAbbr, countyName, dealType, strategy]
  );

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          Demo compliance data is fictional and for product demonstration only.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configure State Deal Kit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-400">State</label>
              <select
                value={stateAbbr}
                onChange={(e) => {
                  setStateAbbr(e.target.value);
                  const newCounties = countiesByState[e.target.value] ?? [];
                  setCountyName(newCounties[0]?.countyName ?? "");
                }}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              >
                {US_STATES.map((s) => (
                  <option key={s.abbreviation} value={s.abbreviation}>
                    {s.name} ({s.abbreviation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">County</label>
              <select
                value={countyName}
                onChange={(e) => setCountyName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                disabled={counties.length === 0}
              >
                {counties.length === 0 ? (
                  <option value="">No counties configured — select state with demo data</option>
                ) : (
                  counties.map((c) => (
                    <option key={c.id} value={c.countyName}>
                      {c.countyName}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Deal Type</label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value as DealType)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              >
                {DEAL_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">User Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              >
                {USER_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Acquisition Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as AcquisitionStrategy)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              >
                {ACQUISITION_STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {state && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {state.stateName} Profile
                <StateSupportBadge status={state.supportedStatus} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Rating</span>
                <RiskBadge risk={state.riskRating} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data Availability</span>
                <span className="capitalize text-slate-200">
                  {state.dataAvailabilityRating.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compliance Review</span>
                <span className="capitalize text-slate-200">
                  {state.complianceReviewStatus.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-slate-400">{state.wholesalingDisclosureNotes}</p>
            </CardContent>
          </Card>

          {county ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {county.countyName} County
                  <CountySupportBadge status={county.supportedStatus} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">County Risk</span>
                  <RiskBadge risk={county.countyRiskRating} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reliability</span>
                  <span className="text-slate-200">{county.dataReliabilityScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Freshness</span>
                  <span className="text-slate-200">{county.dataFreshnessScore}/100</span>
                </div>
                <p className="text-xs text-slate-400">{county.countyNotes}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-slate-400">
                No county profile available. Configure counties in SCS Nova Admin or enable demo mode.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {kit && (
        <>
          {kit.riskWarnings.length > 0 && (
            <Card className="border-amber-700/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {kit.riskWarnings.map((w, i) => (
                    <li key={i} className="text-sm text-amber-100/90">• {w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border-sky-700/30">
            <CardHeader>
              <CardTitle>Attorney / Title Review Reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">{kit.attorneyReviewReminder}</p>
            </CardContent>
          </Card>

          <GettingStartedPanel items={kit.gettingStarted} />

          <Card className="border-emerald-700/30">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>Document Workflow Readiness</span>
                <ReadinessBadge score={docAutomation.readinessScore} band={docAutomation.readinessBand} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-xs text-slate-500">
                Document Workflow Readiness — not legal compliance. Score reflects required documents, templates, variables, and acknowledgements.
              </p>
              {docAutomation.missingTemplates.length > 0 && (
                <p className="text-xs text-amber-300">
                  Missing templates flagged: {docAutomation.missingTemplates.slice(0, 3).join(", ")}
                </p>
              )}
              {docAutomation.complianceWarnings.map((w, i) => (
                <p key={i} className="text-xs text-slate-400">• {w}</p>
              ))}
              <Link href="/documents" className="inline-block text-xs text-sky-400 hover:underline">
                Open Document Center →
              </Link>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <EquipmentChecklistPanel items={kit.equipmentChecklist} />
            <DocumentChecklistPanel items={kit.documentChecklist} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <WorkflowSection title="Outreach Rules" items={kit.outreachRules} />
            <WorkflowSection title="Contract Workflow" items={kit.contractWorkflow} />
            <WorkflowSection title="Disclosure Workflow" items={kit.disclosureWorkflow} />
            <WorkflowSection title="Assignment Workflow" items={kit.assignmentWorkflow} />
            <WorkflowSection title="Title Company Workflow" items={kit.titleCompanyWorkflow} />
            <WorkflowSection title="Closing Workflow" items={kit.closingWorkflow} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Source Links</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {kit.sourceLinks.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {checkResult && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Compliance Rules Engine Result
                    <RiskBadge risk={checkResult.riskLevel} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-slate-300">{checkResult.explanation}</p>
                  {checkResult.requiredActions.length > 0 && (
                    <div>
                      <p className="font-medium text-slate-200">Required Actions</p>
                      <ul className="mt-1 space-y-1 text-slate-400">
                        {checkResult.requiredActions.map((a, i) => (
                          <li key={i}>• {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Allowed: {checkResult.allowedStages.join(", ") || "none"}</span>
                    <span>Blocked: {checkResult.blockedStages.join(", ") || "none"}</span>
                  </div>
                </CardContent>
              </Card>
              <WorkflowBlockerPanel blockers={checkResult.activeBlockers} />
            </>
          )}

          <p className="text-xs leading-relaxed text-slate-500">{GLOBAL_DISCLAIMER}</p>
        </>
      )}
    </div>
  );
}

function WorkflowSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-slate-300">• {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
