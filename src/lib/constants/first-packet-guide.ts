/**
 * First-packet walkthrough — one screen at a time, plain language (roughly 3rd-grade reading level).
 */

export type GuidePageType = "welcome" | "action" | "celebration";

export interface GuidePage {
  id: string;
  type: GuidePageType;
  title: string;
  body: string;
  where?: string;
  clickButton?: string;
  typeInField?: { label: string; example: string };
  pickOption?: string;
  checkBox?: string;
  waitUntil?: string;
  href?: string;
  needsHouse?: boolean;
}

export const FIRST_PACKET_GUIDE: GuidePage[] = [
  {
    id: "welcome",
    type: "welcome",
    title: "Welcome to EstateLeadOS",
    body: "We will help you build your first packet. A packet is like a folder of papers about one house. We go slow — one thing at a time. You can do this!",
  },
  {
    id: "what-is-packet",
    type: "action",
    title: "What you will do today",
    body: "First we find a house from real government records. Then we put the papers together. Then we print and save them. Tap Next when you are ready.",
  },
  {
    id: "go-pipeline",
    type: "action",
    title: "Step 1 — Open Government Pipeline",
    body: "Look at the menu on the left side of the screen. Find the words Government Pipeline. Click it once.",
    where: "Left menu (sidebar)",
    clickButton: "Government Pipeline",
    href: "/government-pipeline",
    waitUntil: "You see county cards with names like Harford",
  },
  {
    id: "run-county",
    type: "action",
    title: "Step 2 — Run the county",
    body: "Find the card that says Harford County. Click the Run button on that card. Wait until it stops spinning.",
    where: "Government Pipeline page",
    clickButton: "Run",
    href: "/government-pipeline",
    waitUntil: "The run finishes and numbers update on the card",
  },
  {
    id: "go-lead-feed",
    type: "action",
    title: "Step 3 — Open Lead Feed",
    body: "Go back to the left menu. Click Lead Feed. This is where houses show up after we find them.",
    where: "Left menu (sidebar)",
    clickButton: "Lead Feed",
    href: "/lead-feed",
    waitUntil: "You see a list of houses or an empty list message",
  },
  {
    id: "pick-house",
    type: "action",
    title: "Step 4 — Pick your house",
    body: "At the top of this guide page, use the dropdown that says Pick your house. Choose the address you want to work on.",
    where: "Top of this guide page",
    pickOption: "Pick your house",
    needsHouse: true,
    waitUntil: "You see an address selected in the dropdown",
  },
  {
    id: "open-house",
    type: "action",
    title: "Step 5 — Open the house",
    body: "On Lead Feed, click the row for your house. That opens the house page.",
    where: "Lead Feed",
    href: "/lead-feed",
    needsHouse: true,
    waitUntil: "You see tabs like Overview and Evidence",
  },
  {
    id: "evidence-tab",
    type: "action",
    title: "Step 6 — Look at the proof",
    body: "Click the Evidence tab. Scroll slowly. Make sure you see government papers about this house — not ads from Zillow or other sites.",
    where: "House page — top tabs",
    clickButton: "Evidence",
    href: "/leads/{leadId}?tab=evidence",
    needsHouse: true,
    waitUntil: "You see a proof chain or list of government sources",
  },
  {
    id: "packet-tab",
    type: "action",
    title: "Step 7 — Open Packet & Archive",
    body: "Click the Packet & Archive tab. This is where we build your folder of papers.",
    where: "House page — top tabs",
    clickButton: "Packet & Archive",
    href: "/leads/{leadId}?tab=packet",
    needsHouse: true,
    waitUntil: "You see Acquisition Packet Builder",
  },
  {
    id: "build-packet",
    type: "action",
    title: "Step 8 — Build your packet",
    body: "Click the big button that says Build Acquisition Packet. Wait. Do not click twice.",
    where: "Packet & Archive tab",
    clickButton: "Build Acquisition Packet",
    href: "/leads/{leadId}?tab=packet",
    needsHouse: true,
    waitUntil: "You see a success message and a packet in the list",
  },
  {
    id: "save-draft",
    type: "action",
    title: "Step 9 — Save your draft",
    body: "Click Save Draft. This keeps your work safe while you keep going.",
    where: "Packet & Archive tab — under your packet",
    clickButton: "Save Draft",
    href: "/leads/{leadId}?tab=packet",
    needsHouse: true,
    waitUntil: "You see a done or saved message",
  },
  {
    id: "print-packet",
    type: "action",
    title: "Step 10 — Print your packet",
    body: "Click Print Packet. Your computer may open a print window. That is normal.",
    where: "Packet & Archive tab — under your packet",
    clickButton: "Print Packet",
    href: "/leads/{leadId}?tab=packet",
    needsHouse: true,
    waitUntil: "A print window opens or you see a preview",
  },
  {
    id: "first-archive",
    type: "action",
    title: "Step 11 — Save to First Archive",
    body: "Click Save to First Archive (Step 14). This puts your packet in a safe vault. It is your first archive — not the final one yet.",
    where: "Packet & Archive tab — green button",
    clickButton: "Save to First Archive (Step 14)",
    href: "/leads/{leadId}?tab=packet",
    needsHouse: true,
    waitUntil: "You see a saved or success message",
  },
  {
    id: "see-archive",
    type: "action",
    title: "Step 12 — See it in Archives",
    body: "Click Archives in the left menu. Open the Initial Review Archive tab. Your packet should be there with a version number.",
    where: "Left menu → Archives",
    clickButton: "Archives",
    href: "/archive?tab=initial_review",
    needsHouse: true,
    waitUntil: "You see your packet listed in the archive",
  },
  {
    id: "done",
    type: "celebration",
    title: "You did it!",
    body: "You built your first packet and saved it. Great job! Next time you can send it to a lawyer, then share it with buyers — but that is for later. For now, celebrate!",
  },
];

export const FIRST_PACKET_PAGE_COUNT = FIRST_PACKET_GUIDE.length;

export function getGuidePage(index: number): GuidePage | undefined {
  return FIRST_PACKET_GUIDE[index];
}

export function resolveGuideHref(href: string | undefined, leadId?: string): string | undefined {
  if (!href) return undefined;
  return href.replace("{leadId}", leadId ?? "");
}
