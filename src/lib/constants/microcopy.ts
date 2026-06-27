export const EMPTY_STATES = {
  leadFeed: {
    title: "No estate leads yet",
    description: "Run an internet lead search for your target market, or import a CSV as a fallback.",
    primary: "Search the Internet",
    secondary: "Import CSV",
    learn: "/guide",
  },
  leadFeedNoMatch: {
    title: "No leads match this view",
    description: "Try widening your filters or run a new internet lead search for this market.",
  },
  documents: {
    title: "No document packets yet",
    description: "Open a lead and run the Document Packet Wizard to assemble a professional workflow packet.",
    primary: "Open Wizards",
    learn: "/guide",
  },
  buyers: {
    title: "No buyers added yet",
    description: "Add buyers manually or import a buyer list to begin matching opportunities to buy boxes.",
    primary: "Add Buyer",
    learn: "/guide",
  },
  assignments: {
    title: "No assignments active",
    description: "Assignments will appear here once a lead reaches Under Contract and buyer matching begins.",
    primary: "Open Lead Feed",
  },
  compliance: {
    title: "No active compliance blockers",
    description: "When a lead requires review, acknowledgement, missing documents, or professional review reminders, it will appear here.",
    primary: "Open Lead Feed",
  },
  reports: {
    title: "Reports will populate with activity",
    description: "Add leads, log outreach, run calculations, and track assignments to build executive reports.",
    primary: "Open Command Center",
  },
  dashboardFresh: {
    title: "Fresh Start Mode is active",
    description: "No demo records are loaded. Start by selecting a market or importing your first CSV.",
    primary: "Start Onboarding",
    secondary: "Import CSV",
  },
  admin: {
    title: "No organizations yet",
    description: "Create your first organization to begin licensing EstateLeadOS through SCS Nova.",
    primary: "Open Admin Console",
  },
} as const;

export const PLATFORM_VALUE =
  "EstateLeadOS turns scattered public-record research, manual spreadsheets, compliance checklists, document tracking, outreach, buyer matching, and assignment workflows into one SCS Nova command system.";
