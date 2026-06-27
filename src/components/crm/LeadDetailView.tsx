import Link from "next/link";
import { LeadCompliancePanel } from "@/components/compliance/LeadCompliancePanel";
import { ScoreBadge, RiskBadge } from "@/components/compliance/ComplianceBadges";
import { PipelineStageBadge, DncBadge, ConsentBadge } from "./PipelineBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getLeadTypeName } from "@/lib/constants/lead-types";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { getStageName } from "@/lib/constants/pipeline-stages";
import type { FullLeadDetail, CommunicationLog, FollowUpReminder, LeadNote, CrmAuditEvent } from "@/lib/types/crm";
import type { ComplianceCheckResult, LeadComplianceContext } from "@/lib/types/compliance";
import type { LeadTypeId } from "@/lib/types/leads";
import { LeadPacketPanel } from "@/components/documents/LeadPacketPanel";
import { DealCalculatorPanel } from "@/components/deal-workflow/DealCalculatorPanel";
import { DealPotentialPanel } from "@/components/deal-workflow/DealPotentialPanel";
import { BuyerMatchingPanel } from "@/components/deal-workflow/BuyerMatchingPanel";
import { AssignmentTrackerPanel } from "@/components/deal-workflow/AssignmentTrackerPanel";
import { AutomationPayoutReadinessPanel } from "@/components/automation/AutomationPayoutReadinessPanel";
import { AutomationLogViewer } from "@/components/automation/AutomationLogViewer";
import { LeadDetailHeader } from "./LeadDetailHeader";
import { WhyLeadMattersCard } from "./WhyLeadMattersCard";
import {
  User, Home, Signal, MessageSquare, History, StickyNote, Shield,
} from "lucide-react";

interface LeadDetailViewProps {
  lead: FullLeadDetail;
  complianceContext: LeadComplianceContext | null;
  checkResult: ComplianceCheckResult | null;
  communications: CommunicationLog[];
  followUps: FollowUpReminder[];
  notes: LeadNote[];
  auditEvents: CrmAuditEvent[];
  stateSupportStatus?: string;
  countySupportStatus?: string;
  isDemo: boolean;
}

export function LeadDetailView({
  lead,
  complianceContext,
  checkResult,
  communications,
  followUps,
  notes,
  auditEvents,
  stateSupportStatus,
  countySupportStatus,
  isDemo,
}: LeadDetailViewProps) {
  const formatCurrency = (n: number | null) =>
    n ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";

  return (
    <div className="space-y-6">
      {lead.doNotContact && (
        <div className="rounded-lg border-2 border-[rgba(255,94,94,0.5)] bg-[rgba(255,94,94,0.08)] px-4 py-3 text-sm text-[var(--nova-text-primary)]">
          <strong>Do Not Contact is active for this lead.</strong> Outreach actions are disabled. Internal notes and compliance review remain available.
          {lead.dncReason && ` Reason: ${lead.dncReason}`}
        </div>
      )}

      <LeadDetailHeader
        leadId={lead.id}
        propertyAddress={lead.propertyAddress}
        leadType={lead.primaryLeadType}
        estateLeadScore={lead.estateLeadScore}
        dealPotentialScore={lead.dealPotentialScore}
        complianceRiskScore={lead.complianceRiskScore}
        pipelineStage={lead.pipelineStage}
        assignedUserName={lead.assignedUserName}
        nextAction={lead.nextAction}
        doNotContact={lead.doNotContact}
      />

      <WhyLeadMattersCard
        leadId={lead.id}
        signals={lead.signals}
        dataConfidenceScore={lead.dataConfidenceScore}
        complianceRiskScore={lead.complianceRiskScore}
        nextAction={lead.nextAction}
        missingItems={lead.negativeFactors.slice(0, 2)}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Lead Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-4 w-4 text-sky-400" />
                Lead Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <Field label="Property" value={lead.propertyAddress} />
                <Field label="Owner" value={lead.ownerName} />
                <Field label="Heir / New Owner" value={lead.possibleHeirName ?? "—"} />
                <Field label="State / County" value={`${lead.state} / ${lead.county}`} />
                <Field label="Parcel ID" value={lead.parcelId ?? "—"} />
                <Field label="Lead Type" value={getLeadTypeName(lead.primaryLeadType as LeadTypeId)} />
                <Field label="Next Action" value={lead.nextAction} />
                <Field label="Follow-Up" value={lead.followUpDate ?? "—"} />
                <Field label="Last Contact" value={lead.lastContactDate ?? "—"} />
              </div>
              {lead.secondaryLeadTypes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {lead.secondaryLeadTypes.map((t) => (
                    <Badge key={t} variant="default">{getLeadTypeName(t as LeadTypeId)}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card>
            <CardHeader><CardTitle>Property Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <Field label="Type" value={lead.propertyType ?? "—"} />
                <Field label="Beds / Baths" value={`${lead.beds ?? "—"} / ${lead.baths ?? "—"}`} />
                <Field label="Sq Ft" value={lead.squareFeet?.toLocaleString() ?? "—"} />
                <Field label="Lot Size" value={lead.lotSize ?? "—"} />
                <Field label="Year Built" value={lead.yearBuilt?.toString() ?? "—"} />
                <Field label="Est. Value" value={formatCurrency(lead.estimatedValue)} />
                <Field label="Tax Assessed" value={formatCurrency(lead.taxAssessedValue)} />
                <Field label="Last Sale" value={lead.lastSaleDate ?? "—"} />
                <Field label="Last Transfer" value={lead.lastTransferDate ?? "—"} />
                <Field label="Transfer Type" value={lead.transferType ?? "—"} />
                <Field label="Deed Type" value={lead.deedType ?? "—"} />
                <Field label="Mortgage" value={lead.mortgageStatus ?? "—"} />
                <Field label="Tax Delinquent" value={lead.taxDelinquent ? "Yes" : "No"} />
                <Field label="Vacant" value={lead.vacancySignal ? "Yes" : "No"} />
                <Field label="Listed" value={lead.listedStatus ? "Yes" : "No"} />
              </div>
            </CardContent>
          </Card>

          {/* Owner / Heir */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Owner / Heir Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <Field label="Current Owner" value={lead.ownerHeir.currentOwnerName ?? "—"} />
                <Field label="Prior Owner" value={lead.ownerHeir.priorOwnerName ?? "—"} />
                <Field label="Possible Heir" value={lead.ownerHeir.possibleHeirName ?? "—"} />
                <Field label="Mailing Address" value={lead.ownerHeir.mailingAddress ?? "—"} />
                <Field label="Owner Occupied" value={lead.ownerHeir.ownerOccupiedStatus} />
                <Field label="Out-of-State" value={lead.ownerHeir.outOfStateOwner} />
                <Field label="Mailing Differs" value={lead.ownerHeir.mailingDiffersFromProperty} />
                <Field label="Owner Verification" value={lead.ownerHeir.ownerVerificationStatus.replace(/_/g, " ")} />
                <Field label="Heir Verification" value={lead.ownerHeir.heirVerificationStatus.replace(/_/g, " ")} />
                <Field label="Contact Source" value={lead.ownerHeir.contactSource.replace(/_/g, " ")} />
                <div>
                  <p className="text-xs text-slate-500">Consent</p>
                  <ConsentBadge status={lead.ownerHeir.consentStatus} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <CardHeader><CardTitle>Score Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <ScoreBadge score={lead.estateLeadScore} label="Estate" />
                <ScoreBadge score={lead.dealPotentialScore} label="Deal Potential" />
                <ScoreBadge score={lead.dataConfidenceScore} label="Data Confidence" />
                <RiskBadge risk={
                  lead.complianceRiskScore >= 80 ? "restricted" :
                  lead.complianceRiskScore >= 60 ? "elevated" :
                  lead.complianceRiskScore >= 40 ? "moderate" : "low"
                } />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-emerald-400">Positive Factors</p>
                  <ul className="mt-1 space-y-1">{lead.positiveFactors.map((f, i) => <li key={i} className="text-sm text-slate-300">• {f}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-400">Negative Factors</p>
                  <ul className="mt-1 space-y-1">{lead.negativeFactors.map((f, i) => <li key={i} className="text-sm text-slate-300">• {f}</li>)}</ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signal Explanation */}
          <Card id="signals">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="h-4 w-4" />
                Source Evidence &amp; Signal Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {lead.signals.map((s, i) => (
                  <li key={i} className="rounded-lg border border-slate-700/40 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-200">{s.name}</span>
                      <Badge variant="info">{s.confidence}%</Badge>
                    </div>
                    <p className="mt-1 text-xs capitalize text-slate-500">{s.category}</p>
                    <p className="mt-1 text-slate-400">{s.explanation}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Source Records */}
          <Card>
            <CardHeader><CardTitle>Source Records</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lead.sourceRecords.map((src) => (
                <div key={src.id} className="rounded-lg border border-slate-700/50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-200">{src.sourceName}</span>
                    <Badge variant="info">{src.permissionStatus.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{src.sourceType.replace(/_/g, " ")} — Reliability {src.reliabilityScore}/100</p>
                  {src.sourceUrl && (
                    <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline">View source</a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Missing Data & Manual Verification */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Missing Data</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-slate-300">
                  {lead.missingData.map((m, i) => <li key={i}>• {m}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Manual Verification Needed</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-slate-300">
                  {lead.manualVerificationNeeded.map((m, i) => <li key={i}>• {m}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Communication History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communication History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {communications.length === 0 ? (
                <p className="text-sm text-slate-400">No communications logged yet.</p>
              ) : (
                <ul className="space-y-3">
                  {communications.map((c) => (
                    <li key={c.id} className="rounded-lg border border-slate-700/40 p-3 text-sm">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{c.communicationDate} {c.communicationTime} — {c.contactMethod.replace(/_/g, " ")}</span>
                        <span>{c.outcome.replace(/_/g, " ")}</span>
                      </div>
                      <p className="mt-1 text-slate-300">{c.messageBodySnapshot.slice(0, 150)}...</p>
                      {c.templateUsedName && <p className="mt-1 text-xs text-sky-400">Template: {c.templateUsedName}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-slate-400">No notes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((n) => (
                    <li key={n.id} className={`rounded-lg border p-3 text-sm ${n.pinned ? "border-sky-700/40 bg-sky-900/10" : "border-slate-700/40"}`}>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{n.userName} — {n.noteType.replace(/_/g, " ")}</span>
                        {n.pinned && <span className="text-sky-400">Pinned</span>}
                      </div>
                      <p className="mt-1 text-slate-300">{n.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <LeadPacketPanel lead={lead} isDemo={isDemo} />

          {/* Audit Trail Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Audit Trail Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditEvents.length === 0 ? (
                <p className="text-sm text-slate-400">No audit events.</p>
              ) : (
                <ul className="space-y-2">
                  {auditEvents.map((e) => (
                    <li key={e.id} className="flex justify-between text-sm">
                      <span className="text-slate-300">{e.eventDescription}</span>
                      <span className="text-xs text-slate-500">{new Date(e.timestamp).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pipeline Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Pipeline — {getStageName(lead.pipelineStage)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-slate-400">Stage changes require compliance checks for gated stages.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/outreach" className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500">
                  Outreach Center
                </Link>
                <Link href="/state-deal-kits" className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">
                  State Deal Kit
                </Link>
              </div>
              {!lead.doNotContact && (
                <p className="text-xs text-slate-500">Use Outreach Center to log calls, emails, and letters with safety guard checks.</p>
              )}
            </CardContent>
          </Card>

          {complianceContext && (
            <LeadCompliancePanel
              context={complianceContext}
              checkResult={checkResult}
              stateSupportStatus={stateSupportStatus}
              countySupportStatus={countySupportStatus}
            />
          )}

          <DealCalculatorPanel lead={lead} isDemo={isDemo} />
          <DealPotentialPanel lead={lead} isDemo={isDemo} />
          <BuyerMatchingPanel lead={lead} isDemo={isDemo} />
          <AssignmentTrackerPanel lead={lead} isDemo={isDemo} />
          <AutomationPayoutReadinessPanel leadId={lead.id} />

          <Card>
            <CardHeader><CardTitle>Automation Timeline</CardTitle></CardHeader>
            <CardContent>
              <AutomationLogViewer leadId={lead.id} limit={10} />
            </CardContent>
          </Card>

          {followUps.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Follow-Ups</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {followUps.map((f) => (
                    <li key={f.id} className="text-slate-300">
                      {f.followUpDate} — {f.reason} ({f.status})
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">{GLOBAL_DISCLAIMER}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}
