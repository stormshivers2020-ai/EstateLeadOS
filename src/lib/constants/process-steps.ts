import type { ProcessStepStatus } from "@/lib/types/analytics";

export interface MasterProcessStep {
  number: number;
  name: string;
  module: string;
  href: string;
  actionLabel: string;
  financialImpact?: boolean;
  manualApprovalRequired?: boolean;
  attorneyReviewRequired?: boolean;
  /** First internal review archive (print packet) */
  firstArchive?: boolean;
  /** Attorney-reviewed final archive storage */
  finalArchive?: boolean;
  phase: "discover" | "prove" | "package" | "attorney" | "distribute" | "close";
}

export const MASTER_PROCESS_STEPS: MasterProcessStep[] = [
  { number: 1, name: "Select State / County", module: "Government Pipeline", href: "/government-pipeline", actionLabel: "Configure County", phase: "discover" },
  { number: 2, name: "Run Government Pipeline", module: "Government Pipeline", href: "/government-pipeline", actionLabel: "Run Pipeline", phase: "discover" },
  { number: 3, name: "Find Government Record Signal", module: "Lead Feed", href: "/lead-feed", actionLabel: "Review Signals", phase: "discover" },
  { number: 4, name: "Confirm Estate / Probate / Inheritance Signal", module: "Lead Detail", href: "/lead-feed", actionLabel: "Confirm Signal", phase: "prove" },
  { number: 5, name: "Match Property Record", module: "Evidence", href: "/lead-feed", actionLabel: "Verify Property", phase: "prove" },
  { number: 6, name: "Check Deed / Transfer Record", module: "Evidence", href: "/lead-feed", actionLabel: "Check Deed", phase: "prove" },
  { number: 7, name: "Add Property Visual / GIS / Parcel Map", module: "Evidence", href: "/lead-feed", actionLabel: "Add Visual", phase: "prove" },
  { number: 8, name: "Identify Possible Responsible Party / Representative", module: "Evidence", href: "/lead-feed", actionLabel: "Review Contacts", phase: "prove" },
  { number: 9, name: "Build Evidence Proof Chain", module: "Verification", href: "/review-queue", actionLabel: "Build Proof", phase: "prove" },
  { number: 10, name: "Manual User Review", module: "Review Queue", href: "/review-queue", actionLabel: "Complete Manual Review", manualApprovalRequired: true, phase: "prove", financialImpact: true },
  { number: 11, name: "Mark as Review-Ready Government Lead", module: "Review Queue", href: "/review-queue", actionLabel: "Mark Review-Ready", manualApprovalRequired: true, phase: "prove" },
  { number: 12, name: "Build Acquisition Preparation Packet", module: "Packet Builder", href: "/archive", actionLabel: "Build Acquisition Packet", phase: "package" },
  { number: 13, name: "Prepare Signature-Ready Draft Documents", module: "Document Center", href: "/wizards/document-packet", actionLabel: "Prepare Draft Documents", phase: "package" },
  { number: 14, name: "Print Internal Review Packet", module: "First Archive", href: "/archive", actionLabel: "Preview & Print", firstArchive: true, phase: "package", financialImpact: true },
  { number: 15, name: "Send / Take Packet to Attorney", module: "Attorney Review", href: "/review-queue", actionLabel: "Send to Attorney", attorneyReviewRequired: true, phase: "attorney" },
  { number: 16, name: "Track Attorney Review", module: "Attorney Review", href: "/review-queue", actionLabel: "Track Review Status", attorneyReviewRequired: true, phase: "attorney" },
  { number: 17, name: "Track Attorney Fee / Percentage Agreement", module: "Attorney Review", href: "/review-queue", actionLabel: "Record Fee Agreement", attorneyReviewRequired: true, phase: "attorney" },
  { number: 18, name: "Upload Attorney-Reviewed Files", module: "Attorney Review", href: "/review-queue", actionLabel: "Upload Reviewed Files", attorneyReviewRequired: true, phase: "attorney" },
  { number: 19, name: "Store Attorney-Reviewed Files in Final Archive", module: "Final Archive", href: "/archive/final", actionLabel: "Save to Final Archive", finalArchive: true, attorneyReviewRequired: true, phase: "attorney" },
  { number: 20, name: "Build Buyer / Realtor Distribution Packet", module: "Email Distribution", href: "/lead-feed", actionLabel: "Build Distribution Packet", phase: "distribute" },
  { number: 21, name: "Approve External Sharing", module: "Email Distribution", href: "/lead-feed", actionLabel: "Approve External Share", manualApprovalRequired: true, phase: "distribute" },
  { number: 22, name: "Send Packet by Email", module: "Email Distribution", href: "/lead-feed", actionLabel: "Send Email", phase: "distribute" },
  { number: 23, name: "Track Buyer / Realtor Response", module: "Buyer Network", href: "/buyer-network", actionLabel: "Track Responses", phase: "distribute" },
  { number: 24, name: "Track Assignment Readiness", module: "Assignments", href: "/assignments", actionLabel: "Review Assignment", phase: "close", financialImpact: true },
  { number: 25, name: "Track Fee / Payout Readiness", module: "Analytics", href: "/analytics/assignment", actionLabel: "Payout Review", phase: "close", financialImpact: true },
  { number: 26, name: "Archive Final Outcome", module: "Final Archive", href: "/archive/final", actionLabel: "Archive Final Outcome", finalArchive: true, phase: "close" },
];

export const START_HERE_STEP = 1;
export const FIRST_ARCHIVE_STEP = 14;
export const FINAL_ARCHIVE_STEP = 19;
export const FINAL_OUTCOME_STEP = 26;
export const ATTORNEY_REVIEW_STEP_START = 15;
export const ATTORNEY_REVIEW_STEP_END = 19;

export const PROCESS_STATUS_LABELS: Record<ProcessStepStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
  blocked: "Blocked",
  needs_manual_review: "Needs Manual Review",
  needs_attorney_review: "Needs Attorney Review",
  ready_to_print: "Ready to Print",
  ready_to_upload: "Ready to Upload",
  ready_for_archive: "Ready for Archive",
  ready_for_distribution: "Ready for Distribution",
  archived: "Archived",
  rejected: "Rejected",
};

export const PROCESS_STATUS_COLORS: Record<ProcessStepStatus, string> = {
  not_started: "bg-slate-700/50 text-slate-400",
  in_progress: "bg-sky-900/40 text-sky-300",
  complete: "bg-emerald-900/40 text-emerald-300",
  blocked: "bg-red-900/40 text-red-300",
  needs_manual_review: "bg-amber-900/40 text-amber-300",
  needs_attorney_review: "bg-purple-900/40 text-purple-300",
  ready_to_print: "bg-cyan-900/40 text-cyan-300",
  ready_to_upload: "bg-indigo-900/40 text-indigo-300",
  ready_for_archive: "bg-teal-900/40 text-teal-300",
  ready_for_distribution: "bg-violet-900/40 text-violet-300",
  archived: "bg-slate-800 text-slate-300",
  rejected: "bg-red-950/50 text-red-400",
};

export const PROCESS_PHASE_LABELS: Record<MasterProcessStep["phase"], string> = {
  discover: "Discovery",
  prove: "Evidence & Review",
  package: "Acquisition Packet",
  attorney: "Attorney Review & Final Archive",
  distribute: "Buyer / Realtor Distribution",
  close: "Assignment & Final Outcome",
};

export const COMMAND_CENTER_START_STEPS = [
  { step: 1, label: "Select State / County", href: "/government-pipeline" },
  { step: 2, label: "Run Government Pipeline", href: "/government-pipeline" },
  { step: 3, label: "Review New Signals", href: "/lead-feed" },
  { step: 9, label: "Build Proof Chain", href: "/review-queue" },
  { step: 10, label: "Manual User Review", href: "/review-queue" },
  { step: 12, label: "Build Acquisition Packet", href: "/archive" },
  { step: 14, label: "Print Internal Review Packet", href: "/archive" },
  { step: 15, label: "Send to Attorney", href: "/review-queue" },
  { step: 19, label: "Final Archive (Attorney Files)", href: "/archive/final" },
  { step: 20, label: "Build Distribution Packet", href: "/analytics/distribution" },
  { step: 22, label: "Send Packet by Email", href: "/analytics/distribution" },
  { step: 24, label: "Assignment Readiness", href: "/assignments" },
  { step: 25, label: "Fee / Payout Readiness", href: "/analytics/assignment" },
  { step: 26, label: "Archive Final Outcome", href: "/archive/final" },
];

export const DEAL_COMMAND_DISCLAIMER =
  "EstateLeadOS — Powered by SCS Nova — provides workflow guidance and document organization only. This process map does not provide legal, tax, brokerage, or investment advice. Manual review, attorney review, and professional confirmation remain required at each gate.";
