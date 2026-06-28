"use client";

import { SOURCE_TYPES, CONTACT_TYPES, NO_CONTACT_REASONS } from "@/lib/constants/first-lead-steps";
import { getStepMeta } from "@/lib/constants/first-lead-steps";
import { calculateLeadScore } from "@/lib/services/walkthrough/engine";
import type {
  LeadWalkthroughSession,
  WalkthroughStepData,
  WalkthroughStepId,
} from "@/lib/types/walkthrough";
import { useLeads } from "@/hooks/useLeads";
import { AlertTriangle } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100";

interface WalkthroughStepFormProps {
  session: LeadWalkthroughSession;
  onChange: (stepData: WalkthroughStepData) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function WalkthroughStepForm({ session, onChange }: WalkthroughStepFormProps) {
  const { leads } = useLeads();
  const step = session.currentStep;
  const meta = getStepMeta(step);
  const d = session.stepData;

  const patch = (partial: WalkthroughStepData) => onChange({ ...d, ...partial });

  if (step === "complete") return null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--nova-gold-soft)]">
          Step {meta.stepNumber}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-100">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-400">{meta.purpose}</p>
      </div>

      {step === "start" && (
        <div className="space-y-4">
          <Field label="Use existing lead or create new">
            <select
              className={inputClass}
              value={d.start?.createNew === false ? "existing" : "new"}
              onChange={(e) =>
                patch({
                  start: {
                    estateName: d.start?.estateName ?? "",
                    county: d.start?.county ?? "",
                    state: d.start?.state ?? "MD",
                    createNew: e.target.value === "new",
                  },
                })
              }
            >
              <option value="new">Create new first lead</option>
              <option value="existing">Select existing lead</option>
            </select>
          </Field>

          {d.start?.createNew === false ? (
            <Field label="Select lead (only one lead for this walkthrough)">
              <select
                className={inputClass}
                value={d.start?.selectedLeadId ?? ""}
                onChange={(e) => {
                  const lead = leads.find((l) => l.id === e.target.value);
                  patch({
                    start: {
                      createNew: false,
                      selectedLeadId: e.target.value,
                      estateName: lead?.ownerName ?? "",
                      county: lead?.county ?? "",
                      state: lead?.state ?? "MD",
                    },
                  });
                }}
              >
                <option value="">— Choose lead —</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.propertyAddress ?? l.ownerName}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label="Estate / lead name">
            <input
              className={inputClass}
              value={d.start?.estateName ?? ""}
              onChange={(e) =>
                patch({ start: { ...d.start!, estateName: e.target.value, createNew: d.start?.createNew ?? true, county: d.start?.county ?? "", state: d.start?.state ?? "MD" } })
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="County">
              <input
                className={inputClass}
                value={d.start?.county ?? ""}
                onChange={(e) =>
                  patch({ start: { ...d.start!, county: e.target.value, estateName: d.start?.estateName ?? "", state: d.start?.state ?? "MD", createNew: d.start?.createNew ?? true } })
                }
              />
            </Field>
            <Field label="State">
              <input
                className={inputClass}
                value={d.start?.state ?? "MD"}
                onChange={(e) =>
                  patch({ start: { ...d.start!, state: e.target.value, estateName: d.start?.estateName ?? "", county: d.start?.county ?? "", createNew: d.start?.createNew ?? true } })
                }
              />
            </Field>
          </div>
          <p className="text-xs text-amber-200/90">
            This walkthrough locks you to one lead. You cannot switch leads mid-session.
          </p>
        </div>
      )}

      {step === "source_discovery" && (
        <SourceDiscoveryForm data={d} patch={patch} />
      )}

      {step === "death_probate" && (
        <div className="space-y-3">
          <Field label="Verification status">
            <select
              className={inputClass}
              value={d.death_probate?.verificationStatus ?? ""}
              onChange={(e) =>
                patch({
                  death_probate: {
                    ...d.death_probate!,
                    verificationStatus: e.target.value as "verified" | "partial" | "not_verified",
                    citation: d.death_probate?.citation ?? "",
                    notes: d.death_probate?.notes ?? "",
                  },
                })
              }
            >
              <option value="">Select…</option>
              <option value="verified">Verified</option>
              <option value="partial">Partial</option>
              <option value="not_verified">Not verified</option>
            </select>
          </Field>
          <Field label="Source citation">
            <textarea className={inputClass} rows={2} value={d.death_probate?.citation ?? ""} onChange={(e) => patch({ death_probate: { ...d.death_probate!, verificationStatus: d.death_probate?.verificationStatus ?? "partial", citation: e.target.value, notes: d.death_probate?.notes ?? "" } })} />
          </Field>
          <Field label="Evidence notes">
            <textarea className={inputClass} rows={3} value={d.death_probate?.notes ?? ""} onChange={(e) => patch({ death_probate: { ...d.death_probate!, verificationStatus: d.death_probate?.verificationStatus ?? "partial", citation: d.death_probate?.citation ?? "", notes: e.target.value } })} />
          </Field>
          {d.death_probate?.verificationStatus === "not_verified" && (
            <Field label="If not verified">
              <select
                className={inputClass}
                value={d.death_probate?.notVerifiedAction ?? ""}
                onChange={(e) =>
                  patch({
                    death_probate: {
                      ...d.death_probate!,
                      notVerifiedAction: e.target.value as "continue_research" | "reject_lead",
                    },
                  })
                }
              >
                <option value="">Choose…</option>
                <option value="continue_research">Continue as research lead</option>
                <option value="reject_lead">Reject lead</option>
              </select>
            </Field>
          )}
        </div>
      )}

      {step === "property_verification" && (
        <div className="space-y-3">
          <Field label="Property address">
            <input className={inputClass} value={d.property_verification?.propertyAddress ?? ""} onChange={(e) => patch({ property_verification: { ...d.property_verification!, propertyAddress: e.target.value, parcelId: d.property_verification?.parcelId ?? "", sourceCitation: d.property_verification?.sourceCitation ?? "", connectionNotes: d.property_verification?.connectionNotes ?? "", confidence: d.property_verification?.confidence ?? "medium" } })} />
          </Field>
          <Field label="Parcel ID">
            <input className={inputClass} value={d.property_verification?.parcelId ?? ""} onChange={(e) => patch({ property_verification: { ...d.property_verification!, parcelId: e.target.value, propertyAddress: d.property_verification?.propertyAddress ?? "", sourceCitation: d.property_verification?.sourceCitation ?? "", connectionNotes: d.property_verification?.connectionNotes ?? "", confidence: d.property_verification?.confidence ?? "medium" } })} />
          </Field>
          <Field label="Property source citation">
            <textarea className={inputClass} rows={2} value={d.property_verification?.sourceCitation ?? ""} onChange={(e) => patch({ property_verification: { ...d.property_verification!, sourceCitation: e.target.value, propertyAddress: d.property_verification?.propertyAddress ?? "", parcelId: d.property_verification?.parcelId ?? "", connectionNotes: d.property_verification?.connectionNotes ?? "", confidence: d.property_verification?.confidence ?? "medium" } })} />
          </Field>
          <Field label="Ownership / connection notes">
            <textarea className={inputClass} rows={2} value={d.property_verification?.connectionNotes ?? ""} onChange={(e) => patch({ property_verification: { ...d.property_verification!, connectionNotes: e.target.value, propertyAddress: d.property_verification?.propertyAddress ?? "", parcelId: d.property_verification?.parcelId ?? "", sourceCitation: d.property_verification?.sourceCitation ?? "", confidence: d.property_verification?.confidence ?? "medium" } })} />
          </Field>
          <Field label="Property confidence">
            <select className={inputClass} value={d.property_verification?.confidence ?? ""} onChange={(e) => patch({ property_verification: { ...d.property_verification!, confidence: e.target.value as "high" | "medium" | "low", propertyAddress: d.property_verification?.propertyAddress ?? "", parcelId: d.property_verification?.parcelId ?? "", sourceCitation: d.property_verification?.sourceCitation ?? "", connectionNotes: d.property_verification?.connectionNotes ?? "" } })}>
              <option value="">Select…</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
        </div>
      )}

      {step === "property_media" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={d.property_media?.mediaUnavailable ?? false} onChange={(e) => patch({ property_media: { ...d.property_media, media: d.property_media?.media ?? [], visibilityNotes: d.property_media?.visibilityNotes ?? "", mediaUnavailable: e.target.checked } })} />
            Media unavailable — provide reason
          </label>
          {!d.property_media?.mediaUnavailable && (
            <>
              <Field label="Media caption">
                <input className={inputClass} value={d.property_media?.media?.[0]?.caption ?? ""} onChange={(e) => patch({ property_media: { media: [{ id: "m1", caption: e.target.value, source: d.property_media?.media?.[0]?.source ?? "", mediaType: "screenshot" }], visibilityNotes: d.property_media?.visibilityNotes ?? "", mediaUnavailable: false } })} />
              </Field>
              <Field label="Media source">
                <input className={inputClass} value={d.property_media?.media?.[0]?.source ?? ""} onChange={(e) => patch({ property_media: { media: [{ id: "m1", caption: d.property_media?.media?.[0]?.caption ?? "", source: e.target.value, mediaType: "screenshot" }], visibilityNotes: d.property_media?.visibilityNotes ?? "", mediaUnavailable: false } })} />
              </Field>
              <Field label="File name (optional)">
                <input className={inputClass} value={d.property_media?.media?.[0]?.fileName ?? ""} onChange={(e) => patch({ property_media: { media: [{ id: "m1", caption: d.property_media?.media?.[0]?.caption ?? "", source: d.property_media?.media?.[0]?.source ?? "", mediaType: "screenshot", fileName: e.target.value }], visibilityNotes: d.property_media?.visibilityNotes ?? "", mediaUnavailable: false } })} />
              </Field>
            </>
          )}
          {d.property_media?.mediaUnavailable && (
            <Field label="Why media is unavailable">
              <textarea className={inputClass} rows={2} value={d.property_media?.unavailableReason ?? ""} onChange={(e) => patch({ property_media: { ...d.property_media, media: [], visibilityNotes: d.property_media?.visibilityNotes ?? "", mediaUnavailable: true, unavailableReason: e.target.value } })} />
            </Field>
          )}
          <Field label="Property visibility notes">
            <textarea className={inputClass} rows={2} value={d.property_media?.visibilityNotes ?? ""} onChange={(e) => patch({ property_media: { ...d.property_media!, visibilityNotes: e.target.value } })} />
          </Field>
        </div>
      )}

      {step === "heir_discovery" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={d.heir_discovery?.contactNotFound ?? false} onChange={(e) => patch({ heir_discovery: { contactNotFound: e.target.checked, contacts: d.heir_discovery?.contacts ?? [], notFoundNotes: d.heir_discovery?.notFoundNotes } })} />
            Contact not found
          </label>
          {!d.heir_discovery?.contactNotFound ? (
            <>
              <Field label="Contact name">
                <input className={inputClass} value={d.heir_discovery?.contacts?.[0]?.name ?? ""} onChange={(e) => patch({ heir_discovery: { contactNotFound: false, contacts: [{ id: "c1", name: e.target.value, contactType: d.heir_discovery?.contacts?.[0]?.contactType ?? "", confidence: d.heir_discovery?.contacts?.[0]?.confidence ?? "unknown", evidenceNotes: d.heir_discovery?.contacts?.[0]?.evidenceNotes ?? "" }] } })} />
              </Field>
              <Field label="Contact type">
                <select className={inputClass} value={d.heir_discovery?.contacts?.[0]?.contactType ?? ""} onChange={(e) => patch({ heir_discovery: { contactNotFound: false, contacts: [{ id: "c1", name: d.heir_discovery?.contacts?.[0]?.name ?? "", contactType: e.target.value, confidence: d.heir_discovery?.contacts?.[0]?.confidence ?? "unknown", evidenceNotes: d.heir_discovery?.contacts?.[0]?.evidenceNotes ?? "" }] } })}>
                  <option value="">Select…</option>
                  {CONTACT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </Field>
              <Field label="Confidence (never mark weak as confirmed)">
                <select className={inputClass} value={d.heir_discovery?.contacts?.[0]?.confidence ?? ""} onChange={(e) => patch({ heir_discovery: { contactNotFound: false, contacts: [{ id: "c1", name: d.heir_discovery?.contacts?.[0]?.name ?? "", contactType: d.heir_discovery?.contacts?.[0]?.contactType ?? "", confidence: e.target.value as "verified" | "likely" | "weak" | "unknown", evidenceNotes: d.heir_discovery?.contacts?.[0]?.evidenceNotes ?? "" }] } })}>
                  <option value="">Select…</option>
                  <option value="verified">Verified</option>
                  <option value="likely">Likely</option>
                  <option value="weak">Weak</option>
                  <option value="unknown">Unknown</option>
                </select>
              </Field>
              <Field label="Evidence / source notes">
                <textarea className={inputClass} rows={2} value={d.heir_discovery?.contacts?.[0]?.evidenceNotes ?? ""} onChange={(e) => patch({ heir_discovery: { contactNotFound: false, contacts: [{ id: "c1", name: d.heir_discovery?.contacts?.[0]?.name ?? "", contactType: d.heir_discovery?.contacts?.[0]?.contactType ?? "", confidence: d.heir_discovery?.contacts?.[0]?.confidence ?? "unknown", evidenceNotes: e.target.value }] } })} />
              </Field>
            </>
          ) : (
            <Field label="Why contact was not found">
              <textarea className={inputClass} rows={2} value={d.heir_discovery?.notFoundNotes ?? ""} onChange={(e) => patch({ heir_discovery: { contactNotFound: true, notFoundNotes: e.target.value, contacts: [] } })} />
            </Field>
          )}
        </div>
      )}

      {step === "contact_path" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={d.contact_path?.noContactFound ?? false} onChange={(e) => patch({ contact_path: { ...d.contact_path, noContactFound: e.target.checked, complianceAcknowledged: d.contact_path?.complianceAcknowledged ?? false, phone: d.contact_path?.phone ?? "", email: d.contact_path?.email ?? "", mailingAddress: d.contact_path?.mailingAddress ?? "", attorneyContact: d.contact_path?.attorneyContact ?? "", noContactReason: d.contact_path?.noContactReason ?? "" } })} />
            No contact method found
          </label>
          {!d.contact_path?.noContactFound && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Phone"><input className={inputClass} value={d.contact_path?.phone ?? ""} onChange={(e) => patch({ contact_path: { ...d.contact_path!, phone: e.target.value, noContactFound: false, complianceAcknowledged: d.contact_path?.complianceAcknowledged ?? false, email: d.contact_path?.email ?? "", mailingAddress: d.contact_path?.mailingAddress ?? "", attorneyContact: d.contact_path?.attorneyContact ?? "", noContactReason: "" } })} /></Field>
              <Field label="Email"><input className={inputClass} value={d.contact_path?.email ?? ""} onChange={(e) => patch({ contact_path: { ...d.contact_path!, email: e.target.value, noContactFound: false, complianceAcknowledged: d.contact_path?.complianceAcknowledged ?? false, phone: d.contact_path?.phone ?? "", mailingAddress: d.contact_path?.mailingAddress ?? "", attorneyContact: d.contact_path?.attorneyContact ?? "", noContactReason: "" } })} /></Field>
              <Field label="Mailing address"><input className={inputClass} value={d.contact_path?.mailingAddress ?? ""} onChange={(e) => patch({ contact_path: { ...d.contact_path!, mailingAddress: e.target.value, noContactFound: false, complianceAcknowledged: d.contact_path?.complianceAcknowledged ?? false, phone: d.contact_path?.phone ?? "", email: d.contact_path?.email ?? "", attorneyContact: d.contact_path?.attorneyContact ?? "", noContactReason: "" } })} /></Field>
              <Field label="Attorney contact"><input className={inputClass} value={d.contact_path?.attorneyContact ?? ""} onChange={(e) => patch({ contact_path: { ...d.contact_path!, attorneyContact: e.target.value, noContactFound: false, complianceAcknowledged: d.contact_path?.complianceAcknowledged ?? false, phone: d.contact_path?.phone ?? "", email: d.contact_path?.email ?? "", mailingAddress: d.contact_path?.mailingAddress ?? "", noContactReason: "" } })} /></Field>
            </div>
          )}
          {d.contact_path?.noContactFound && (
            <Field label="Reason">
              <select className={inputClass} value={d.contact_path?.noContactReason ?? ""} onChange={(e) => patch({ contact_path: { ...d.contact_path!, noContactReason: e.target.value, noContactFound: true, complianceAcknowledged: d.contact_path?.complianceAcknowledged ?? false, phone: "", email: "", mailingAddress: "", attorneyContact: "" } })}>
                <option value="">Select…</option>
                {NO_CONTACT_REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
          )}
          <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
            Contact data from public records is not guaranteed accurate. Verify before outreach.
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={d.contact_path?.complianceAcknowledged ?? false} onChange={(e) => patch({ contact_path: { ...d.contact_path!, complianceAcknowledged: e.target.checked, noContactFound: d.contact_path?.noContactFound ?? false, phone: d.contact_path?.phone ?? "", email: d.contact_path?.email ?? "", mailingAddress: d.contact_path?.mailingAddress ?? "", attorneyContact: d.contact_path?.attorneyContact ?? "", noContactReason: d.contact_path?.noContactReason ?? "" } })} />
            I confirm contact data should not be treated as guaranteed unless verified
          </label>
        </div>
      )}

      {step === "lead_qualification" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-sky-800/30 bg-sky-950/20 px-3 py-2 text-sm text-sky-200">
            Suggested score from evidence: <strong>{calculateLeadScore(d)}</strong> / 100
          </div>
          <Field label="Decision">
            <select className={inputClass} value={d.lead_qualification?.decision ?? ""} onChange={(e) => patch({ lead_qualification: { decision: e.target.value as "pursue" | "hold" | "reject", reason: d.lead_qualification?.reason ?? "", score: calculateLeadScore(d) } })}>
              <option value="">Select…</option>
              <option value="pursue">Pursue</option>
              <option value="hold">Hold for more research</option>
              <option value="reject">Reject</option>
            </select>
          </Field>
          <Field label="Reason">
            <textarea className={inputClass} rows={3} value={d.lead_qualification?.reason ?? ""} onChange={(e) => patch({ lead_qualification: { decision: d.lead_qualification?.decision ?? "hold", reason: e.target.value, score: d.lead_qualification?.score ?? calculateLeadScore(d) } })} />
          </Field>
          <Field label="Lead score">
            <input type="number" min={0} max={100} className={inputClass} value={d.lead_qualification?.score ?? calculateLeadScore(d)} onChange={(e) => patch({ lead_qualification: { decision: d.lead_qualification?.decision ?? "hold", reason: d.lead_qualification?.reason ?? "", score: Number(e.target.value) } })} />
          </Field>
        </div>
      )}

      {step === "deal_value" && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ARV low ($)"><input type="number" className={inputClass} value={d.deal_value?.arvLow ?? ""} onChange={(e) => patch({ deal_value: { ...emptyDeal(d.deal_value), arvLow: Number(e.target.value) } })} /></Field>
            <Field label="ARV high ($)"><input type="number" className={inputClass} value={d.deal_value?.arvHigh ?? ""} onChange={(e) => patch({ deal_value: { ...emptyDeal(d.deal_value), arvHigh: Number(e.target.value) } })} /></Field>
            <Field label="Offer low ($)"><input type="number" className={inputClass} value={d.deal_value?.offerLow ?? ""} onChange={(e) => patch({ deal_value: { ...emptyDeal(d.deal_value), offerLow: Number(e.target.value) } })} /></Field>
            <Field label="Offer high ($)"><input type="number" className={inputClass} value={d.deal_value?.offerHigh ?? ""} onChange={(e) => patch({ deal_value: { ...emptyDeal(d.deal_value), offerHigh: Number(e.target.value) } })} /></Field>
          </div>
          <Field label="Assignment fee target ($)">
            <input type="number" className={inputClass} value={d.deal_value?.assignmentFeeTarget ?? ""} onChange={(e) => patch({ deal_value: { ...emptyDeal(d.deal_value), assignmentFeeTarget: Number(e.target.value) } })} />
          </Field>
          <Field label="Repair assumptions">
            <textarea className={inputClass} rows={2} value={d.deal_value?.repairAssumptions ?? ""} onChange={(e) => patch({ deal_value: { ...emptyDeal(d.deal_value), repairAssumptions: e.target.value } })} />
          </Field>
          <Field label="Risk notes">
            <textarea className={inputClass} rows={2} value={d.deal_value?.riskNotes ?? ""} onChange={(e) => patch({ deal_value: { ...emptyDeal(d.deal_value), riskNotes: e.target.value } })} />
          </Field>
          <label className="flex items-start gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={d.deal_value?.estimatesAcknowledged ?? false} onChange={(e) => patch({ deal_value: { ...emptyDeal(d.deal_value), estimatesAcknowledged: e.target.checked } })} />
            I confirm all numbers are estimates only — not guarantees
          </label>
        </div>
      )}

      {step === "packet_builder" && (
        <div className="space-y-3">
          {d.packet_builder?.packetId ? (
            <p className="text-sm text-emerald-300">Packet generated: {d.packet_builder.packetId}</p>
          ) : (
            <p className="text-sm text-slate-400">Click Continue to generate the walkthrough packet from collected evidence.</p>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={d.packet_builder?.reviewed ?? false} disabled={!d.packet_builder?.packetId} onChange={(e) => patch({ packet_builder: { packetId: d.packet_builder?.packetId, reviewed: e.target.checked, status: e.target.checked ? "review_ready" : "draft" } })} />
            I have reviewed the packet — mark REVIEW_READY
          </label>
        </div>
      )}

      {step === "attorney_compliance" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            EstateLeadOS does not provide legal approval. Mark review needs only.
          </div>
          <Field label="Review status">
            <select className={inputClass} value={d.attorney_compliance?.reviewStatus ?? ""} onChange={(e) => patch({ attorney_compliance: { reviewStatus: e.target.value as "needs_attorney" | "internal_review" | "rejected_before_review", complianceNotes: d.attorney_compliance?.complianceNotes ?? "" } })}>
              <option value="">Select…</option>
              <option value="needs_attorney">Needs attorney review</option>
              <option value="internal_review">Ready for internal review</option>
              <option value="rejected_before_review">Rejected before review</option>
            </select>
          </Field>
          <Field label="Compliance notes">
            <textarea className={inputClass} rows={3} value={d.attorney_compliance?.complianceNotes ?? ""} onChange={(e) => patch({ attorney_compliance: { reviewStatus: d.attorney_compliance?.reviewStatus ?? "needs_attorney", complianceNotes: e.target.value } })} />
          </Field>
        </div>
      )}

      {step === "outreach_direction" && (
        <div className="space-y-3">
          <Field label="Next action">
            <select className={inputClass} value={d.outreach_direction?.nextAction ?? ""} onChange={(e) => patch({ outreach_direction: { nextAction: e.target.value as WalkthroughStepData["outreach_direction"] extends { nextAction: infer A } ? A : never, taskNotes: d.outreach_direction?.taskNotes ?? "", dueDate: d.outreach_direction?.dueDate } })}>
              <option value="">Select…</option>
              <option value="contact_estate">Contact estate / heir / representative</option>
              <option value="research_more">Research more</option>
              <option value="send_attorney">Send to attorney</option>
              <option value="prepare_buyer_packet">Prepare buyer packet</option>
              <option value="archive_inactive">Archive as inactive</option>
            </select>
          </Field>
          <Field label="Task notes">
            <textarea className={inputClass} rows={3} value={d.outreach_direction?.taskNotes ?? ""} onChange={(e) => patch({ outreach_direction: { nextAction: d.outreach_direction?.nextAction ?? "research_more", taskNotes: e.target.value, dueDate: d.outreach_direction?.dueDate } })} />
          </Field>
          <Field label="Due date (recommended)">
            <input type="date" className={inputClass} value={d.outreach_direction?.dueDate?.slice(0, 10) ?? ""} onChange={(e) => patch({ outreach_direction: { nextAction: d.outreach_direction?.nextAction ?? "research_more", taskNotes: d.outreach_direction?.taskNotes ?? "", dueDate: e.target.value } })} />
          </Field>
        </div>
      )}

      {step === "final_archive" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Click Continue to save the full walkthrough to the Initial Review Archive. This completes the session.
          </p>
          {d.final_archive?.archiveId && (
            <p className="text-sm text-emerald-300">Archive created: {d.final_archive.archiveId}</p>
          )}
        </div>
      )}
    </div>
  );
}

function emptyDeal(v: WalkthroughStepData["deal_value"]) {
  return {
    arvLow: v?.arvLow ?? 0,
    arvHigh: v?.arvHigh ?? 0,
    offerLow: v?.offerLow ?? 0,
    offerHigh: v?.offerHigh ?? 0,
    assignmentFeeTarget: v?.assignmentFeeTarget ?? 0,
    repairAssumptions: v?.repairAssumptions ?? "",
    buyerDemandNotes: v?.buyerDemandNotes ?? "",
    riskNotes: v?.riskNotes ?? "",
    estimatesAcknowledged: v?.estimatesAcknowledged ?? false,
  };
}

function SourceDiscoveryForm({
  data,
  patch,
}: {
  data: WalkthroughStepData;
  patch: (p: WalkthroughStepData) => void;
}) {
  const src = data.source_discovery?.sources?.[0] ?? {
    id: "s1",
    url: "",
    title: "",
    sourceType: "",
    county: data.start?.county ?? "",
    agency: "",
    notes: "",
    confidence: "medium" as const,
  };

  const update = (partial: Partial<typeof src>) =>
    patch({
      source_discovery: {
        sources: [{ ...src, ...partial }],
      },
    });

  return (
    <div className="space-y-3">
      <Field label="Source URL">
        <input className={inputClass} value={src.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://..." />
      </Field>
      <Field label="Source title">
        <input className={inputClass} value={src.title} onChange={(e) => update({ title: e.target.value })} />
      </Field>
      <Field label="Source type">
        <select className={inputClass} value={src.sourceType} onChange={(e) => update({ sourceType: e.target.value })}>
          <option value="">Select…</option>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="County">
          <input className={inputClass} value={src.county} onChange={(e) => update({ county: e.target.value })} />
        </Field>
        <Field label="Agency">
          <input className={inputClass} value={src.agency} onChange={(e) => update({ agency: e.target.value })} />
        </Field>
      </div>
      <Field label="Source confidence">
        <select className={inputClass} value={src.confidence} onChange={(e) => update({ confidence: e.target.value as "high" | "medium" | "low" })}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </Field>
      <Field label="Evidence file name (if no URL)">
        <input className={inputClass} value={src.evidenceFileName ?? ""} onChange={(e) => update({ evidenceFileName: e.target.value })} />
      </Field>
      <Field label="Notes">
        <textarea className={inputClass} rows={2} value={src.notes} onChange={(e) => update({ notes: e.target.value })} />
      </Field>
    </div>
  );
}
