import type { ProcessStepStatus } from "@/lib/types/analytics";

export interface MasterProcessStep {
  number: number;
  name: string;
  module: string;
  href: string;
  actionLabel: string;
  financialImpact?: boolean;
}

export const MASTER_PROCESS_STEPS: MasterProcessStep[] = [
  { number: 1, name: "Select State / County", module: "Government Pipeline", href: "/government-pipeline", actionLabel: "Configure County" },
  { number: 2, name: "Run Government Pipeline", module: "Government Pipeline", href: "/government-pipeline", actionLabel: "Run Pipeline" },
  { number: 3, name: "Find Government Signal", module: "Lead Feed", href: "/lead-feed", actionLabel: "Review Signals" },
  { number: 4, name: "Confirm Estate / Probate Signal", module: "Lead Detail", href: "/lead-feed", actionLabel: "Open Lead" },
  { number: 5, name: "Match Property Record", module: "Evidence", href: "/lead-feed", actionLabel: "Verify Property" },
  { number: 6, name: "Check Deed / Transfer Record", module: "Evidence", href: "/lead-feed", actionLabel: "Check Deed" },
  { number: 7, name: "Add Property Visual", module: "Evidence", href: "/lead-feed", actionLabel: "Add Visual" },
  { number: 8, name: "Identify Representative / Contact", module: "Evidence", href: "/lead-feed", actionLabel: "Review Contacts" },
  { number: 9, name: "Build Evidence Proof Chain", module: "Verification", href: "/review-queue", actionLabel: "Build Proof" },
  { number: 10, name: "Manual Review", module: "Review Queue", href: "/review-queue", actionLabel: "Review Lead", financialImpact: true },
  { number: 11, name: "Verify Government Lead", module: "Review Queue", href: "/review-queue", actionLabel: "Approve Lead" },
  { number: 12, name: "Build Internal Packet", module: "Packet Builder", href: "/archive", actionLabel: "Build Packet" },
  { number: 13, name: "Print / Archive Packet", module: "Archive", href: "/archive", actionLabel: "Print & Archive", financialImpact: true },
  { number: 14, name: "Attorney Review", module: "Attorney Review", href: "/review-queue", actionLabel: "Send to Attorney" },
  { number: 15, name: "Upload Attorney-Reviewed File", module: "Attorney Review", href: "/review-queue", actionLabel: "Upload File" },
  { number: 16, name: "Build Buyer Distribution Packet", module: "Email Distribution", href: "/review-queue", actionLabel: "Build Distribution" },
  { number: 17, name: "Approve External Distribution", module: "Email Distribution", href: "/review-queue", actionLabel: "Approve Send" },
  { number: 18, name: "Send Packet by Email", module: "Email Distribution", href: "/review-queue", actionLabel: "Send Email" },
  { number: 19, name: "Track Buyer Interest", module: "Buyer Network", href: "/buyer-network", actionLabel: "Track Responses" },
  { number: 20, name: "Assignment Readiness Review", module: "Assignments", href: "/assignments", actionLabel: "Review Assignment", financialImpact: true },
  { number: 21, name: "Closing / Fee Recorded", module: "Assignments", href: "/assignments", actionLabel: "Record Fee" },
  { number: 22, name: "Payout Readiness Review", module: "Analytics", href: "/analytics/assignment", actionLabel: "Payout Review" },
  { number: 23, name: "Archive Final Outcome", module: "Archive", href: "/archive", actionLabel: "Archive" },
  { number: 24, name: "Update Analytics", module: "Analytics", href: "/analytics", actionLabel: "View Analytics" },
];

export const START_HERE_STEP = 1;

export const PROCESS_STATUS_COLORS: Record<ProcessStepStatus, string> = {
  not_started: "bg-slate-700/50 text-slate-400",
  in_progress: "bg-sky-900/40 text-sky-300",
  complete: "bg-emerald-900/40 text-emerald-300",
  blocked: "bg-red-900/40 text-red-300",
  needs_approval: "bg-amber-900/40 text-amber-300",
  needs_attorney_review: "bg-purple-900/40 text-purple-300",
  ready_to_print: "bg-cyan-900/40 text-cyan-300",
  ready_to_send: "bg-indigo-900/40 text-indigo-300",
  archived: "bg-slate-800 text-slate-300",
  rejected: "bg-red-950/50 text-red-400",
};

export const COMMAND_CENTER_START_STEPS = [
  { step: 1, label: "Select State / County", href: "/government-pipeline" },
  { step: 2, label: "Run Government Pipeline", href: "/government-pipeline" },
  { step: 3, label: "Review New Signals", href: "/lead-feed" },
  { step: 4, label: "Build Proof Chain", href: "/review-queue" },
  { step: 5, label: "Manual Approval", href: "/review-queue" },
  { step: 6, label: "Build Packet", href: "/archive" },
  { step: 7, label: "Print / Archive", href: "/archive" },
  { step: 8, label: "Attorney Review", href: "/review-queue" },
  { step: 9, label: "Upload Approved File", href: "/review-queue" },
  { step: 10, label: "Build Buyer Distribution Packet", href: "/review-queue" },
  { step: 11, label: "Approve Email Send", href: "/review-queue" },
  { step: 12, label: "Track Assignment Readiness", href: "/assignments" },
  { step: 13, label: "Record Fee / Payout Readiness", href: "/analytics/assignment" },
  { step: 14, label: "Archive Final Outcome", href: "/archive" },
  { step: 15, label: "Review Analytics", href: "/analytics" },
];
