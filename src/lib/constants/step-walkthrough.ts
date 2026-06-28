import {
  MASTER_PROCESS_STEPS,
  PROCESS_PHASE_LABELS,
  type MasterProcessStep,
} from "./process-steps";

export interface StepWalkthroughContent {
  stepNumber: number;
  headline: string;
  instructions: string[];
  completionCriteria: string[];
  tips?: string[];
  requiresLead: boolean;
  doNotSkip?: string;
}

export const STEP_WALKTHROUGH: StepWalkthroughContent[] = [
  {
    stepNumber: 1,
    headline: "Choose your state and county",
    instructions: [
      "Open Government Pipeline from the sidebar.",
      "Review Maryland county status — Harford is the active proof engine.",
      "Use County Expansion Wizard to activate a county when sources are configured.",
      "Confirm official government sources are registered for that jurisdiction.",
    ],
    completionCriteria: ["County pipeline config exists", "County is not paused", "At least one official source active"],
    tips: ["Step 1 is always required — you cannot skip market selection."],
    requiresLead: false,
    doNotSkip: "Every lead must be tied to a licensed state/county before government records run.",
  },
  {
    stepNumber: 2,
    headline: "Run the government record pipeline",
    instructions: [
      "On Government Pipeline, click Run for your target county.",
      "EstateLeadOS pulls official records, live-fetches .gov URLs, and scores source certainty.",
      "Review pipeline items staged for manual review — leads are not auto-created without proof.",
    ],
    completionCriteria: ["Pipeline run completed", "Government signals found", "Low-certainty records rejected"],
    requiresLead: false,
  },
  {
    stepNumber: 3,
    headline: "Find a government record signal",
    instructions: [
      "Open Lead Feed or Review Queue to see new government signals.",
      "Alternatively run Government Record Search on Market Search (MD county required).",
      "Approve pending leads only after reviewing source citations.",
    ],
    completionCriteria: ["At least one lead or pipeline item with official source proof"],
    requiresLead: false,
  },
  {
    stepNumber: 4,
    headline: "Confirm estate / probate / inheritance signal",
    instructions: [
      "Open the lead in Lead Detail → Evidence tab.",
      "Review proof chain step: Estate / probate signal from official records.",
      "Confirm decedent or estate party appears in government-sourced evidence.",
    ],
    completionCriteria: ["Estate/probate signal present in proof chain", "Source is government — not marketplace"],
    requiresLead: true,
  },
  {
    stepNumber: 5,
    headline: "Match the property record",
    instructions: [
      "On Evidence tab, verify property address matches SDAT, GIS, or tax assessment records.",
      "Check source certainty score and live fetch badges.",
      "Reject or flag if property match is weak.",
    ],
    completionCriteria: ["Official property/assessment/tax/GIS match on file"],
    requiresLead: true,
  },
  {
    stepNumber: 6,
    headline: "Check deed / transfer record",
    instructions: [
      "Confirm deed or land record citation exists (MDLandRec may require manual upload).",
      "Note deed reference number and transfer date when extracted.",
    ],
    completionCriteria: ["Deed or transfer record referenced in evidence"],
    requiresLead: true,
  },
  {
    stepNumber: 7,
    headline: "Add property visual / GIS / parcel map",
    instructions: [
      "Review Property Visuals panel — parcel map, GIS photo, or map fallback.",
      "Official GIS visuals from ArcGIS live pull count toward proof.",
    ],
    completionCriteria: ["At least one property visual attached"],
    requiresLead: true,
  },
  {
    stepNumber: 8,
    headline: "Identify possible responsible party",
    instructions: [
      "Review persons identified from official records (representative, heir, interested person).",
      "Contact candidates are separate from verified proof — enrichment is low-confidence until approved.",
    ],
    completionCriteria: ["Person connection labeled from estate/deed/property record"],
    requiresLead: true,
  },
  {
    stepNumber: 9,
    headline: "Build the evidence proof chain",
    instructions: [
      "Complete all 10 proof chain steps on the Evidence tab.",
      "Ensure every claim has a numbered government citation.",
      "Government proof chain must be complete before manual review.",
    ],
    completionCriteria: ["Proof chain steps complete", "All claims cited", "No unsupported marketplace sources"],
    requiresLead: true,
  },
  {
    stepNumber: 10,
    headline: "Complete manual user review",
    instructions: [
      "Open Review Queue and perform manual review for this lead.",
      "Acknowledge compliance items if elevated risk.",
      "EstateLeadOS does not provide legal approval — you confirm workflow readiness.",
    ],
    completionCriteria: ["Manual review completed", "Compliance acknowledgements if required"],
    requiresLead: true,
    doNotSkip: "Manual approval required — not legal approval.",
  },
  {
    stepNumber: 11,
    headline: "Mark as review-ready government lead",
    instructions: [
      "When proof chain + manual review are done, mark lead review-ready.",
      "Lead should show government verification status progressing toward verified.",
    ],
    completionCriteria: ["Lead marked review-ready", "Government verification gates passed"],
    requiresLead: true,
  },
  {
    stepNumber: 12,
    headline: "Build acquisition preparation packet",
    instructions: [
      "Go to Lead Detail → Packet & Archive tab.",
      "Build acquisition packet (internal review, government proof, deal calculator, etc.).",
      "Generate printable HTML for attorney/internal use.",
    ],
    completionCriteria: ["Acquisition packet built with printable HTML"],
    requiresLead: true,
  },
  {
    stepNumber: 13,
    headline: "Prepare signature-ready draft documents",
    instructions: [
      "From Packet Builder or Document Packet wizard, generate draft signature documents.",
      "These are drafts for attorney review — not legally valid until professionally reviewed.",
    ],
    completionCriteria: ["Draft signature documents generated for packet"],
    requiresLead: true,
  },
  {
    stepNumber: 14,
    headline: "Print and save to Initial Review Archive",
    instructions: [
      "Preview and print the internal review packet.",
      "Save to Initial Review Archive (First Archive) — versions are never overwritten.",
      "Open Archives → Initial Review Archive to confirm.",
    ],
    completionCriteria: ["Packet printed or print logged", "Initial Review Archive record saved"],
    requiresLead: true,
    doNotSkip: "First archive is separate from final attorney-reviewed archive.",
  },
  {
    stepNumber: 15,
    headline: "Send packet to attorney",
    instructions: [
      "Open Lead Detail → Attorney Review tab.",
      "Select packet, add attorney info, print/export review file.",
      "Mark as sent/delivered manually — EstateLeadOS does not auto-send to attorneys.",
    ],
    completionCriteria: ["Attorney review started", "Packet selected", "Delivery tracked"],
    requiresLead: true,
  },
  {
    stepNumber: 16,
    headline: "Track attorney review status",
    instructions: [
      "Update review status as attorney responds (under review, changes requested, approved, etc.).",
      "Log comments and track approval status in the 12-step workflow.",
    ],
    completionCriteria: ["Attorney review status updated"],
    requiresLead: true,
  },
  {
    stepNumber: 17,
    headline: "Track attorney fee / percentage agreement",
    instructions: [
      "Record compensation terms discussed with attorney — EstateLeadOS does not recommend fees.",
      "Upload written fee agreement when available before approval.",
    ],
    completionCriteria: ["Compensation terms recorded", "Written agreement uploaded if applicable"],
    requiresLead: true,
  },
  {
    stepNumber: 18,
    headline: "Upload attorney-reviewed files",
    instructions: [
      "Upload attorney-reviewed packet, redlines, signed documents, and fee agreement.",
      "Each upload is versioned — prior versions preserved.",
    ],
    completionCriteria: ["Attorney-reviewed file uploaded", "Version number assigned"],
    requiresLead: true,
  },
  {
    stepNumber: 19,
    headline: "Store files in Final Attorney-Reviewed Archive",
    instructions: [
      "Move reviewed files to Final Archive from Attorney Review workflow.",
      "Final archive is separate from Initial Review Archive (Step 14).",
    ],
    completionCriteria: ["Final Attorney-Reviewed Archive record saved"],
    requiresLead: true,
  },
  {
    stepNumber: 20,
    headline: "Build buyer / realtor distribution packet",
    instructions: [
      "Open Lead Detail → Email Distribution tab.",
      "Select Final Archive file and distribution packet type.",
      "Generate external-facing packet — redacted, separate from internal archive.",
    ],
    completionCriteria: ["Distribution packet generated from Final Archive"],
    requiresLead: true,
  },
  {
    stepNumber: 21,
    headline: "Approve external sharing",
    instructions: [
      "Complete redaction checklist (11 items).",
      "Confirm attorney review or manual override.",
      "Approve packet for send — user approval required, not legal approval.",
    ],
    completionCriteria: ["Redaction checklist complete", "Approved to send"],
    requiresLead: true,
  },
  {
    stepNumber: 22,
    headline: "Send packet by email",
    instructions: [
      "Walk through 14-step email workflow: recipient, DNC check, preview, final approval.",
      "Local mode simulates only — no auto-send, no bulk blast.",
    ],
    completionCriteria: ["Email preview approved", "Send or simulate logged"],
    requiresLead: true,
    doNotSkip: "EstateLeadOS never auto-sends email.",
  },
  {
    stepNumber: 23,
    headline: "Track buyer / realtor response",
    instructions: [
      "Update recipient response status in Buyer Network or distribution logs.",
      "Schedule follow-up if needed.",
    ],
    completionCriteria: ["Response status recorded", "Follow-up scheduled if applicable"],
    requiresLead: true,
  },
  {
    stepNumber: 24,
    headline: "Track assignment readiness",
    instructions: [
      "Open Assignments module for this lead.",
      "Review assignment stage, blockers, and readiness checklist.",
    ],
    completionCriteria: ["Assignment readiness reviewed", "Blockers resolved"],
    requiresLead: true,
  },
  {
    stepNumber: 25,
    headline: "Track fee / payout readiness",
    instructions: [
      "Open Analytics → Assignment / payout view.",
      "Review target assignment fee, expenses, and payout readiness — estimates only.",
    ],
    completionCriteria: ["Financial readiness reviewed"],
    requiresLead: true,
    doNotSkip: "No profit or payout guarantees.",
  },
  {
    stepNumber: 26,
    headline: "Archive final outcome",
    instructions: [
      "Save final outcome to Final Archive.",
      "Lock final version if appropriate — locked versions cannot be overwritten.",
      "Distribution records archived separately with version history.",
    ],
    completionCriteria: ["Final outcome archived", "Audit trail complete"],
    requiresLead: true,
  },
];

export function getWalkthroughForStep(stepNumber: number): StepWalkthroughContent | undefined {
  return STEP_WALKTHROUGH.find((s) => s.stepNumber === stepNumber);
}

export function getMasterStep(stepNumber: number): MasterProcessStep | undefined {
  return MASTER_PROCESS_STEPS.find((s) => s.number === stepNumber);
}

/** Deep-link for guided navigation */
export function walkthroughStepHref(stepNumber: number, leadId?: string): string {
  const master = getMasterStep(stepNumber);
  if (!master) return "/deal-command";

  if (leadId) {
    if (stepNumber >= 4 && stepNumber <= 8) return `/leads/${leadId}?tab=evidence`;
    if (stepNumber === 9 || stepNumber === 10 || stepNumber === 11) return `/leads/${leadId}?tab=evidence`;
    if (stepNumber >= 12 && stepNumber <= 14) return `/leads/${leadId}?tab=packet`;
    if (stepNumber >= 15 && stepNumber <= 19) return `/leads/${leadId}?tab=attorney`;
    if (stepNumber >= 20 && stepNumber <= 22) return `/leads/${leadId}?tab=email`;
    if (stepNumber === 23) return `/buyer-network`;
    if (stepNumber === 24) return `/assignments`;
    if (stepNumber === 25) return `/analytics/assignment`;
    if (stepNumber === 26) return `/archive/final`;
  }

  if (stepNumber === 1 || stepNumber === 2) return "/government-pipeline";
  if (stepNumber === 3) return "/lead-feed";
  if (stepNumber >= 10 && stepNumber <= 11) return "/review-queue";
  if (stepNumber === 13) return "/wizards/document-packet";
  if (stepNumber === 14) return "/archive";
  if (stepNumber >= 15 && stepNumber <= 18) return "/review-queue";
  if (stepNumber === 19 || stepNumber === 26) return "/archive/final";
  if (stepNumber >= 20 && stepNumber <= 22) return "/deal-command";
  if (stepNumber === 23) return "/buyer-network";
  if (stepNumber === 24) return "/assignments";
  if (stepNumber === 25) return "/analytics/assignment";

  return master.href;
}

export function getPhaseForStep(stepNumber: number): string {
  const master = getMasterStep(stepNumber);
  return master ? PROCESS_PHASE_LABELS[master.phase] : "Workflow";
}
