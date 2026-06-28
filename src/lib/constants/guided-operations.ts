import { getPhaseForStep, getMasterStep } from "./step-walkthrough";

export type GuidedActionKind = "navigate" | "click" | "type" | "select" | "checkbox" | "review" | "wait";

export interface GuidedOperation {
  id: string;
  macroStep: number;
  title: string;
  screen: string;
  kind: GuidedActionKind;
  instruction: string;
  buttonLabel?: string;
  fieldLabel?: string;
  typeExample?: string;
  selectOption?: string;
  href?: string;
  lookFor?: string;
  requiresLead?: boolean;
}

function op(
  macroStep: number,
  n: number,
  partial: Omit<GuidedOperation, "id" | "macroStep">
): GuidedOperation {
  return {
    id: `s${String(macroStep).padStart(2, "0")}-${String(n).padStart(2, "0")}`,
    macroStep,
    ...partial,
  };
}

/** Flat list — one UI operation per screen in the guide. Advance with "I did this — next". */
export const GUIDED_OPERATIONS: GuidedOperation[] = [
  // ── STEP 1: Select State / County ──
  op(1, 1, {
    title: "Open the guide",
    screen: "Sidebar",
    kind: "navigate",
    instruction: "You are in the Step-by-Step Guide. Each screen shows exactly one action. Complete it, then click I did this — next.",
    lookFor: "Operation counter and progress bar at top",
  }),
  op(1, 2, {
    title: "Go to Government Pipeline",
    screen: "Sidebar → Government Pipeline",
    kind: "click",
    instruction: "In the left sidebar, click Government Pipeline.",
    buttonLabel: "Government Pipeline",
    href: "/government-pipeline",
    lookFor: "Maryland county cards and Live Source Certainty banner",
  }),
  op(1, 3, {
    title: "Find your county",
    screen: "Government Pipeline",
    kind: "review",
    instruction: "Scroll to your target county card (Harford is the active proof engine). Read the status badge: Active, Configured, or Needs Manual Source Review.",
    lookFor: "County name, status badge, Proof Engine badge on Harford",
  }),
  op(1, 4, {
    title: "Open County Expansion Wizard (if needed)",
    screen: "Government Pipeline",
    kind: "click",
    instruction: "If the county is not Active, click County Expansion Wizard to configure sources before running.",
    buttonLabel: "County Expansion Wizard",
    href: "/wizards/county-expansion",
    lookFor: "10-step county expansion wizard",
  }),
  op(1, 5, {
    title: "Confirm county is not paused",
    screen: "Government Pipeline → county card",
    kind: "review",
    instruction: "On the county card, make sure you do not see a Paused state. If paused, click Resume (play icon).",
    buttonLabel: "Resume",
    lookFor: "Run button enabled on county card",
  }),

  // ── STEP 2: Run Government Pipeline ──
  op(2, 1, {
    title: "Run county pipeline",
    screen: "Government Pipeline → county card",
    kind: "click",
    instruction: "On your county card (e.g. Harford County, MD), click the Run button.",
    buttonLabel: "Run",
    href: "/government-pipeline",
    lookFor: "Spinner while running, then updated signal counts",
  }),
  op(2, 2, {
    title: "Or use Run EstateLeadOS modal",
    screen: "Government Pipeline",
    kind: "click",
    instruction: "Alternatively click the green Run EstateLeadOS button at the top of the page.",
    buttonLabel: "Run EstateLeadOS",
    href: "/government-pipeline",
  }),
  op(2, 3, {
    title: "Choose pipeline action",
    screen: "Run EstateLeadOS modal",
    kind: "select",
    instruction: "In the modal, open the dropdown What do you want EstateLeadOS to do?",
    fieldLabel: "What do you want EstateLeadOS to do?",
    selectOption: "Find government leads (county pipeline)",
  }),
  op(2, 4, {
    title: "Confirm supervised mode",
    screen: "Run EstateLeadOS modal",
    kind: "select",
    instruction: "Set mode to Supervised (not auto-send, not unattended).",
    fieldLabel: "Automation mode",
    selectOption: "Supervised",
  }),
  op(2, 5, {
    title: "Execute run",
    screen: "Run EstateLeadOS modal",
    kind: "click",
    instruction: "Click the Run button in the modal. Wait for success message.",
    buttonLabel: "Run",
    lookFor: "Message showing records found and pipeline items created",
  }),

  // ── STEP 3: Find Government Signal ──
  op(3, 1, {
    title: "Open Lead Feed",
    screen: "Sidebar → Lead Feed",
    kind: "click",
    instruction: "Click Lead Feed in the sidebar to see leads and pending items.",
    buttonLabel: "Lead Feed",
    href: "/lead-feed",
  }),
  op(3, 2, {
    title: "Or open Review Queue",
    screen: "Sidebar → Review Queue",
    kind: "click",
    instruction: "Click Review Queue to see items awaiting manual review.",
    buttonLabel: "Review Queue",
    href: "/review-queue",
  }),
  op(3, 3, {
    title: "Government Record Search",
    screen: "Sidebar → Market Search",
    kind: "click",
    instruction: "Open Market Search for manual government record discovery.",
    buttonLabel: "Market Search",
    href: "/market-search",
  }),
  op(3, 4, {
    title: "Enter state",
    screen: "Market Search → Government Record Search",
    kind: "type",
    instruction: "In the State dropdown, select your two-letter state code.",
    fieldLabel: "State",
    typeExample: "MD",
    href: "/market-search",
  }),
  op(3, 5, {
    title: "Enter county",
    screen: "Market Search → Government Record Search",
    kind: "type",
    instruction: "Type the county name in the County field.",
    fieldLabel: "County",
    typeExample: "Harford",
    href: "/market-search",
  }),
  op(3, 6, {
    title: "Keep Government Sources Only ON",
    screen: "Market Search",
    kind: "checkbox",
    instruction: "Ensure Government Sources Only is checked. EstateLeadOS will reject Zillow, Realtor.com, and marketplaces.",
    fieldLabel: "Government Sources Only",
    href: "/market-search",
  }),
  op(3, 7, {
    title: "Run search",
    screen: "Market Search",
    kind: "click",
    instruction: "Click Search Government Records. Review pending results — leads are not created until you approve.",
    buttonLabel: "Search government records",
    lookFor: "Pending leads list with source URLs",
  }),
  op(3, 8, {
    title: "Approve a pending lead",
    screen: "Market Search or Lead Feed",
    kind: "click",
    instruction: "Click Approve on a pending lead only after reviewing its government source citation.",
    buttonLabel: "Approve",
    lookFor: "Lead moves to active lead list",
  }),

  // ── STEP 4: Confirm estate signal ──
  op(4, 1, {
    title: "Select your lead in the guide",
    screen: "Walk Me Through → top of page",
    kind: "select",
    instruction: "At the top of this guide page, open the lead dropdown and choose the property you are working.",
    fieldLabel: "Select lead (Steps 4–26)",
    requiresLead: true,
    href: "/deal-command?op=1",
  }),
  op(4, 2, {
    title: "Open lead detail",
    screen: "Lead Feed",
    kind: "click",
    instruction: "Click the lead row to open Lead Detail.",
    href: "/lead-feed",
    requiresLead: true,
  }),
  op(4, 3, {
    title: "Open Evidence tab",
    screen: "Lead Detail",
    kind: "click",
    instruction: "Click the Evidence tab at the top of the lead page.",
    buttonLabel: "Evidence",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),
  op(4, 4, {
    title: "Review estate / probate proof chain step",
    screen: "Lead Detail → Evidence",
    kind: "review",
    instruction: "In the Proof Chain timeline, find Estate / probate / inheritance signal. Confirm it shows complete or partial from an official source.",
    lookFor: "Proof chain step with government source — not marketplace",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),

  // ── STEP 5: Property match ──
  op(5, 1, {
    title: "Check property evidence",
    screen: "Lead Detail → Evidence",
    kind: "review",
    instruction: "Scroll to Evidence Sources. Confirm property address matches SDAT, GIS, or tax assessment citation.",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),
  op(5, 2, {
    title: "Check source certainty",
    screen: "Lead Detail → Evidence",
    kind: "review",
    instruction: "Look for Source certainty score and Live .gov fetch or ArcGIS live badges on the verification header.",
    lookFor: "Source certainty XX/100",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),

  // ── STEP 6: Deed / transfer ──
  op(6, 1, {
    title: "Find deed citation",
    screen: "Lead Detail → Evidence",
    kind: "review",
    instruction: "In Evidence Sources, look for deed_land_record or deed/instrument reference. Note deed reference number if shown.",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),
  op(6, 2, {
    title: "Upload deed if manual (MDLandRec)",
    screen: "Lead Detail → Documents or Attorney tab",
    kind: "click",
    instruction: "If deed requires manual MDLandRec login, upload the deed PDF via Attorney Review uploads later (Step 18).",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),

  // ── STEP 7: Property visual ──
  op(7, 1, {
    title: "Review property visuals",
    screen: "Lead Detail → Evidence",
    kind: "review",
    instruction: "Scroll to Property Visuals. Confirm parcel map, GIS photo, or map fallback is present.",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),

  // ── STEP 8: Responsible party ──
  op(8, 1, {
    title: "Review persons",
    screen: "Lead Detail → Evidence",
    kind: "review",
    instruction: "Review Persons section — representative, heir, or interested person from official records only.",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),
  op(8, 2, {
    title: "Separate contact enrichment",
    screen: "Lead Detail → Evidence",
    kind: "review",
    instruction: "Contact candidates are enrichment only (low confidence). Do not treat as verified proof until manually approved.",
    lookFor: "Contact candidates labeled unverified or weak match",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),

  // ── STEP 9: Proof chain ──
  op(9, 1, {
    title: "Complete proof chain",
    screen: "Lead Detail → Evidence",
    kind: "review",
    instruction: "Walk through all 10 Proof Chain steps. Every claim must have a numbered government citation.",
    lookFor: "Proof chain complete badge",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),

  // ── STEP 10: Manual review ──
  op(10, 1, {
    title: "Open Review Queue",
    screen: "Sidebar → Review Queue",
    kind: "click",
    instruction: "Click Review Queue in the sidebar.",
    buttonLabel: "Review Queue",
    href: "/review-queue",
    requiresLead: true,
  }),
  op(10, 2, {
    title: "Find your lead in queue",
    screen: "Review Queue",
    kind: "review",
    instruction: "Locate your lead in the queue. Read compliance and verification flags.",
    href: "/review-queue",
    requiresLead: true,
  }),
  op(10, 3, {
    title: "Complete manual review",
    screen: "Review Queue → lead row",
    kind: "click",
    instruction: "Open the lead and complete manual review actions. Acknowledge compliance if prompted.",
    buttonLabel: "Run EstateLeadOS",
    href: "/review-queue",
    requiresLead: true,
  }),

  // ── STEP 11: Review-ready ──
  op(11, 1, {
    title: "Mark review-ready",
    screen: "Review Queue or Lead Evidence",
    kind: "review",
    instruction: "When proof chain and manual review are done, confirm lead shows progressing government verification status.",
    lookFor: "Government verification status improving toward review-ready",
    href: "/leads/{leadId}?tab=evidence",
    requiresLead: true,
  }),

  // ── STEP 12: Build acquisition packet ──
  op(12, 1, {
    title: "Open Packet & Archive tab",
    screen: "Lead Detail",
    kind: "click",
    instruction: "Click Packet & Archive tab on the lead page.",
    buttonLabel: "Packet & Archive",
    href: "/leads/{leadId}?tab=packet",
    requiresLead: true,
  }),
  op(12, 2, {
    title: "Select packet type",
    screen: "Lead Detail → Packet Builder",
    kind: "select",
    instruction: "Open the packet type dropdown and choose Acquisition Preparation Packet (or your target type).",
    fieldLabel: "Packet type",
    selectOption: "Acquisition Preparation Packet",
    href: "/leads/{leadId}?tab=packet",
    requiresLead: true,
  }),
  op(12, 3, {
    title: "Build packet",
    screen: "Lead Detail → Packet Builder",
    kind: "click",
    instruction: "Click Build Acquisition Packet (or Build Packet). Wait for success message.",
    buttonLabel: "Build Acquisition Packet",
    href: "/leads/{leadId}?tab=packet",
    requiresLead: true,
  }),
  op(12, 4, {
    title: "Open packet preview",
    screen: "Lead Detail → Packet Builder",
    kind: "click",
    instruction: "Click Open on the built packet row to preview printable HTML.",
    buttonLabel: "Open",
    href: "/leads/{leadId}?tab=packet",
    requiresLead: true,
  }),

  // ── STEP 13: Draft signatures ──
  op(13, 1, {
    title: "Save draft signature documents",
    screen: "Lead Detail → Packet Builder",
    kind: "click",
    instruction: "After building the packet, click Save Draft to persist draft signature documents for attorney review.",
    buttonLabel: "Save Draft",
    href: "/leads/{leadId}?tab=packet",
    requiresLead: true,
  }),
  op(13, 2, {
    title: "Review draft list",
    screen: "Lead Detail → Draft Documents",
    kind: "review",
    instruction: "Review generated drafts. These are for attorney review — not legally valid until professionally reviewed.",
    href: "/leads/{leadId}?tab=packet",
    requiresLead: true,
  }),

  // ── STEP 14: First archive ──
  op(14, 1, {
    title: "Print packet",
    screen: "Lead Detail → Packet Builder",
    kind: "click",
    instruction: "Click Print on the active packet. Allow pop-up or use preview iframe Print.",
    buttonLabel: "Print Packet",
    href: "/leads/{leadId}?tab=packet",
    requiresLead: true,
  }),
  op(14, 2, {
    title: "Save to Initial Review Archive",
    screen: "Lead Detail → Packet Builder",
    kind: "click",
    instruction: "Click Save to First Archive (Step 14). This creates the First Archive — separate from Final Archive.",
    buttonLabel: "Save to First Archive (Step 14)",
    href: "/leads/{leadId}?tab=packet",
    requiresLead: true,
  }),
  op(14, 3, {
    title: "Verify in Archives",
    screen: "Sidebar → Archives",
    kind: "click",
    instruction: "Open Archives. Confirm Initial Review Archive tab shows your packet with version number.",
    buttonLabel: "Archives",
    href: "/archive?tab=initial_review",
    requiresLead: true,
  }),

  // ── STEP 15: Send to attorney ──
  op(15, 1, {
    title: "Open Attorney Review tab",
    screen: "Lead Detail",
    kind: "click",
    instruction: "Click Attorney Review tab.",
    buttonLabel: "Attorney Review",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(15, 2, {
    title: "Select packet for review",
    screen: "Lead Detail → Attorney Review",
    kind: "select",
    instruction: "In Step 1 of attorney workflow, select the packet from the dropdown.",
    fieldLabel: "Packet for attorney review",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(15, 3, {
    title: "Enter attorney name",
    screen: "Lead Detail → Attorney Review",
    kind: "type",
    instruction: "Type the attorney name in the Attorney Name field and save.",
    fieldLabel: "Attorney Name",
    typeExample: "Jane Smith, Esq.",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(15, 4, {
    title: "Build attorney review file",
    screen: "Lead Detail → Attorney Review",
    kind: "click",
    instruction: "Click Build Attorney Review File to generate the printable review packet.",
    buttonLabel: "Build / Export Review File",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(15, 5, {
    title: "Print review file",
    screen: "Lead Detail → Attorney Review",
    kind: "click",
    instruction: "Click Print Review File. Deliver to attorney manually — EstateLeadOS does not auto-send.",
    buttonLabel: "Print Review File",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(15, 6, {
    title: "Mark sent to attorney",
    screen: "Lead Detail → Attorney Review",
    kind: "click",
    instruction: "Click Mark Sent / Delivered Manually after you give the packet to the attorney.",
    buttonLabel: "Mark Sent / Delivered Manually",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),

  // ── STEP 16: Track attorney review ──
  op(16, 1, {
    title: "Update review status",
    screen: "Lead Detail → Attorney Review",
    kind: "select",
    instruction: "Change Review Status as attorney responds (Under Review, Changes Requested, Approved, etc.).",
    fieldLabel: "Review Status",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(16, 2, {
    title: "Enter review notes",
    screen: "Lead Detail → Attorney Review",
    kind: "type",
    instruction: "Type attorney comments in Review Notes field if provided.",
    fieldLabel: "Review Notes",
    typeExample: "Approved with minor redlines to disclosure section",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),

  // ── STEP 17: Fee agreement ──
  op(17, 1, {
    title: "Open compensation tracker",
    screen: "Lead Detail → Attorney Review",
    kind: "review",
    instruction: "Scroll to Attorney Compensation section. EstateLeadOS does not recommend fee amounts.",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(17, 2, {
    title: "Record compensation type",
    screen: "Lead Detail → Attorney Compensation",
    kind: "select",
    instruction: "Select compensation type discussed with attorney (flat, hourly, contingent, etc.).",
    fieldLabel: "Compensation Type",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(17, 3, {
    title: "Upload written fee agreement",
    screen: "Lead Detail → Attorney Review uploads",
    kind: "click",
    instruction: "When written agreement exists, upload via Upload with category Attorney Fee Agreement.",
    buttonLabel: "Upload",
    selectOption: "Attorney Fee Agreement",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),

  // ── STEP 18: Upload reviewed files ──
  op(18, 1, {
    title: "Choose upload category",
    screen: "Lead Detail → Attorney Review uploads",
    kind: "select",
    instruction: "Select document category: Attorney Reviewed Packet.",
    fieldLabel: "Document category",
    selectOption: "Attorney Reviewed Packet",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(18, 2, {
    title: "Upload reviewed file",
    screen: "Lead Detail → Attorney Review",
    kind: "click",
    instruction: "Click Upload. Each upload gets a new version — prior versions are preserved.",
    buttonLabel: "Upload",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(18, 3, {
    title: "Upload signed documents",
    screen: "Lead Detail → Attorney Review",
    kind: "click",
    instruction: "If applicable, upload Signed Documents with category Signed Documents.",
    buttonLabel: "Upload",
    selectOption: "Signed Documents",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),

  // ── STEP 19: Final archive ──
  op(19, 1, {
    title: "Move to Final Archive",
    screen: "Lead Detail → Attorney Review",
    kind: "click",
    instruction: "Click Save to Final Archive (Step 19). This stores attorney-reviewed files separately from Initial Archive.",
    buttonLabel: "Save to Final Archive (Step 19)",
    href: "/leads/{leadId}?tab=attorney",
    requiresLead: true,
  }),
  op(19, 2, {
    title: "Verify Final Archive tab",
    screen: "Archives → Final Attorney-Reviewed",
    kind: "click",
    instruction: "Open Archives → Final Attorney-Reviewed Archive tab. Confirm files listed with version numbers.",
    buttonLabel: "Final Attorney-Reviewed Archive",
    href: "/archive/final",
    requiresLead: true,
  }),

  // ── STEP 20: Distribution packet ──
  op(20, 1, {
    title: "Open Email Distribution tab",
    screen: "Lead Detail",
    kind: "click",
    instruction: "Click Email Distribution tab.",
    buttonLabel: "Email Distribution",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(20, 2, {
    title: "Select Final Archive file",
    screen: "Email Distribution → Step 1",
    kind: "select",
    instruction: "In Step 1, open the Final Archive dropdown and select the archived file.",
    fieldLabel: "Final Archive",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(20, 3, {
    title: "Select distribution packet type",
    screen: "Email Distribution → Step 2",
    kind: "select",
    instruction: "Choose packet type: Buyer Opportunity, Realtor Review, Investor, etc.",
    fieldLabel: "Distribution packet type",
    selectOption: "Buyer Opportunity Packet",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(20, 4, {
    title: "Generate external packet",
    screen: "Email Distribution → Step 2",
    kind: "click",
    instruction: "Click Generate External Distribution Packet.",
    buttonLabel: "Generate External Distribution Packet",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),

  // ── STEP 21: Approve external sharing ──
  op(21, 1, {
    title: "Confirm DNC — Step 4",
    screen: "Email Distribution → Step 4",
    kind: "checkbox",
    instruction: "Check: I confirm this recipient is not marked Do Not Contact.",
    fieldLabel: "I confirm this recipient is not marked Do Not Contact",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(21, 2, {
    title: "Confirm attorney — Step 5",
    screen: "Email Distribution → Step 5",
    kind: "checkbox",
    instruction: "Check attorney review complete or manual override acknowledged.",
    fieldLabel: "I confirm attorney review is complete or manual override was acknowledged",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(21, 3, {
    title: "Complete redaction checklist — Step 7",
    screen: "Email Distribution → Step 7",
    kind: "checkbox",
    instruction: "Check every item in the redaction checklist (11 items). Then click Approve External Sharing.",
    buttonLabel: "Approve External Sharing",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),

  // ── STEP 22: Send email ──
  op(22, 1, {
    title: "Select recipient — Step 3",
    screen: "Email Distribution → Step 3",
    kind: "select",
    instruction: "Choose recipient from dropdown (buyer, realtor, investor, etc.).",
    fieldLabel: "Recipient",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(22, 2, {
    title: "Load email template — Step 8",
    screen: "Email Distribution → Step 8",
    kind: "click",
    instruction: "Click Load safe email template. Review subject and body — edit if needed.",
    buttonLabel: "Load safe email template",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(22, 3, {
    title: "Confirm attachment — Step 9",
    screen: "Email Distribution → Step 9",
    kind: "checkbox",
    instruction: "Check: I confirm the distribution packet is attached for send.",
    fieldLabel: "I confirm the distribution packet is attached for send",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(22, 4, {
    title: "Final approval — Step 10",
    screen: "Email Distribution → Step 10",
    kind: "checkbox",
    instruction: "Check final user approval — you authorize this one email send.",
    fieldLabel: "Final user approval — I authorize this one email send",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(22, 5, {
    title: "Preview approval — Step 11",
    screen: "Email Distribution → Step 11",
    kind: "checkbox",
    instruction: "Check: Email preview reviewed and approved for send.",
    fieldLabel: "Email preview reviewed and approved for send",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(22, 6, {
    title: "Send or simulate",
    screen: "Email Distribution → Step 11",
    kind: "click",
    instruction: "Click Simulate Send (local mode) or Send Email (production with provider configured). Never auto-sends.",
    buttonLabel: "Simulate Send",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),

  // ── STEP 23: Track response ──
  op(23, 1, {
    title: "Open Buyer Network",
    screen: "Sidebar → Buyer Network",
    kind: "click",
    instruction: "Click Buyer Network.",
    buttonLabel: "Buyer Network",
    href: "/buyer-network",
    requiresLead: true,
  }),
  op(23, 2, {
    title: "Schedule follow-up — Step 13",
    screen: "Email Distribution → Step 13",
    kind: "type",
    instruction: "If needed, pick follow-up date/time in Step 13 and click Schedule Follow-Up.",
    fieldLabel: "Follow-up datetime",
    buttonLabel: "Schedule Follow-Up",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),

  // ── STEP 24: Assignment ──
  op(24, 1, {
    title: "Open Assignments",
    screen: "Sidebar → Assignments",
    kind: "click",
    instruction: "Click Assignments in the sidebar.",
    buttonLabel: "Assignments",
    href: "/assignments",
    requiresLead: true,
  }),
  op(24, 2, {
    title: "Review assignment readiness",
    screen: "Assignments",
    kind: "review",
    instruction: "Find your lead. Review assignment stage and resolve any blockers.",
    href: "/assignments",
    requiresLead: true,
  }),

  // ── STEP 25: Payout ──
  op(25, 1, {
    title: "Open assignment analytics",
    screen: "Sidebar → Analytics",
    kind: "click",
    instruction: "Open Analytics → Assignment / payout view for fee readiness.",
    buttonLabel: "Analytics",
    href: "/analytics/assignment",
    requiresLead: true,
  }),
  op(25, 2, {
    title: "Review financials on lead",
    screen: "Lead Detail → Financials",
    kind: "click",
    instruction: "On Lead Detail, open Financials tab. Review deal calculator and assignment fee estimates — not guarantees.",
    buttonLabel: "Financials",
    href: "/leads/{leadId}?tab=financials",
    requiresLead: true,
  }),

  // ── STEP 26: Final outcome ──
  op(26, 1, {
    title: "Archive distribution record — Step 14",
    screen: "Email Distribution → Step 14",
    kind: "click",
    instruction: "Click Archive Distribution Record to Final Archive after email sent.",
    buttonLabel: "Archive Distribution Record to Final Archive",
    href: "/leads/{leadId}?tab=email",
    requiresLead: true,
  }),
  op(26, 2, {
    title: "Lock final version (optional)",
    screen: "Archives → Final",
    kind: "click",
    instruction: "On Final Archive item, click Lock Final to prevent overwrites.",
    buttonLabel: "Lock Final",
    href: "/archive/final",
    requiresLead: true,
  }),
  op(26, 3, {
    title: "Workflow complete",
    screen: "Walk Me Through",
    kind: "review",
    instruction: "You have completed all 26 macro steps. Audit logs, archives, and email history preserve every version. EstateLeadOS · Powered by SCS Nova.",
    lookFor: "Operation counter shows final operation",
  }),
];

export const GUIDED_OPERATION_COUNT = GUIDED_OPERATIONS.length;

export function getGuidedOperation(index: number): GuidedOperation | undefined {
  return GUIDED_OPERATIONS[index];
}

export function resolveGuidedHref(href: string | undefined, leadId?: string): string | undefined {
  if (!href) return undefined;
  return href.replace("{leadId}", leadId ?? "");
}

export function getMacroStepName(step: number): string {
  return getMasterStep(step)?.name ?? `Step ${step}`;
}

export function getMacroPhase(step: number): string {
  return getPhaseForStep(step);
}

export function getFirstOpIndexForMacroStep(macroStep: number): number {
  const idx = GUIDED_OPERATIONS.findIndex((o) => o.macroStep === macroStep);
  return idx >= 0 ? idx : 0;
}

export function guidedHrefForMacroStep(macroStep: number, leadId?: string): string {
  const firstPacketPage: Record<number, number> = {
    1: 2,
    2: 3,
    3: 4,
    4: 6,
    5: 6,
    6: 6,
    7: 6,
    8: 6,
    9: 6,
    10: 6,
    11: 6,
    12: 7,
    13: 9,
    14: 11,
  };
  const simplePage = firstPacketPage[macroStep];
  if (simplePage !== undefined) {
    const params = new URLSearchParams({ p: String(simplePage) });
    if (leadId) params.set("leadId", leadId);
    return `/deal-command?${params.toString()}`;
  }
  const op = getFirstOpIndexForMacroStep(macroStep);
  const params = new URLSearchParams({ mode: "full", op: String(op) });
  if (leadId) params.set("leadId", leadId);
  return `/deal-command?${params.toString()}`;
}
