import { getSessionContext } from "@/lib/config/session";
import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { appendCrmAudit, appendPlatformAudit } from "@/lib/local/localAudit";
import { DEMO_FULL_LEADS } from "@/lib/seed/demo-crm";
import { runLeadComplianceCheck } from "@/lib/services/compliance";
import { runCalculatorForLead } from "@/lib/services/deal-calculator";
import { getOutreachTemplates, applyTemplateVariables } from "@/lib/services/outreach";
import { getBuyerMatchesForLead } from "@/lib/services/buyers";
import { getLeadPacket, getDocuments } from "@/lib/services/documents";
import { getStateProfile, buildStateDealKit } from "@/lib/services/compliance";
import type { FullLeadDetail } from "@/lib/types/crm";
import type { DealCalculatorInput } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { DealType, AcquisitionStrategy } from "@/lib/types/compliance";

export interface LeadIntakeInput {
  propertyAddress: string;
  ownerName: string;
  state: string;
  county: string;
  transferType: string;
  sourceOfRecord: string;
  estimatedValue: number;
  mortgageStatus: string;
  taxStatus: string;
  probateIndicator: boolean;
  inheritanceIndicator: boolean;
  urgencyScore: number;
  notes: string;
}

export function createLeadFromIntake(input: LeadIntakeInput): FullLeadDetail {
  const session = getSessionContext();
  const now = new Date().toISOString();
  const template = DEMO_FULL_LEADS[0];
  const lead: FullLeadDetail = {
    ...template,
    id: `lead-wizard-${Date.now()}`,
    organizationId: session.organizationId,
    propertyAddress: input.propertyAddress,
    street: input.propertyAddress.split(",")[0] ?? input.propertyAddress,
    city: "",
    state: input.state,
    county: input.county,
    ownerName: input.ownerName,
    transferType: input.transferType,
    estimatedValue: input.estimatedValue,
    mortgageStatus: input.mortgageStatus,
    taxDelinquent: input.taxStatus.toLowerCase().includes("delinquent"),
    primaryLeadType: input.probateIndicator
      ? "possible_probate_lead"
      : input.inheritanceIndicator
        ? "possible_inherited_property"
        : "possible_inherited_property",
    estateLeadScore: Math.min(95, 40 + input.urgencyScore * 5),
    dealPotentialScore: Math.min(90, 35 + input.urgencyScore * 4),
    complianceRiskScore: input.probateIndicator ? 48 : 35,
    dataConfidenceScore: 55,
    origin: "manually_added",
    pipelineStage: "new_lead",
    nextAction: "Complete probate/inherited property research wizard",
    demoRecord: false,
    createdAt: now,
    updatedAt: now,
    ownerHeir: {
      ...template.ownerHeir,
      currentOwnerName: input.ownerName,
      propertyAddress: input.propertyAddress,
    },
    sourceRecords: [
      {
        id: `src-wiz-${Date.now()}`,
        sourceName: input.sourceOfRecord,
        sourceType: "manual_entry",
        sourceUrl: null,
        retrievedAt: now,
        reliabilityScore: 60,
        freshnessScore: 70,
        permissionStatus: "manual_only",
        fieldsProvided: ["property_address", "owner_name"],
      },
    ],
    signals: [
      ...(input.probateIndicator
        ? [{ name: "Probate indicator", category: "probate", explanation: "User flagged probate activity", confidence: 70 }]
        : []),
      ...(input.inheritanceIndicator
        ? [{ name: "Inheritance indicator", category: "inheritance", explanation: "User flagged inherited transfer", confidence: 68 }]
        : []),
    ],
    missingData: input.notes ? [] : ["Additional research notes"],
    manualVerificationNeeded: ["Owner/heir authority", "Transfer path confirmation"],
  };

  const state = getLocalState();
  state.leads = [lead, ...state.leads];
  if (input.notes) {
    state.notes = [
      {
        id: `note-wiz-${Date.now()}`,
        leadId: lead.id,
        organizationId: session.organizationId,
        userId: session.userId,
        userName: session.userName,
        noteType: "research",
        body: input.notes,
        visibility: "team",
        pinned: true,
        edited: false,
        createdAt: now,
        updatedAt: now,
      },
      ...state.notes,
    ];
  }
  persistLocalState();
  appendCrmAudit({ leadId: lead.id, eventType: "lead_created", description: "Lead created via intake wizard" });
  appendPlatformAudit({
    eventType: "wizard_completed",
    eventDescription: `Lead intake wizard completed: ${input.propertyAddress}`,
    relatedModule: "lead_discovery",
    relatedRecordId: lead.id,
  });
  return lead;
}

export function logOutreachFromWizard(params: {
  leadId: string;
  channel: string;
  scriptUsed: string;
  followUpDate: string;
}) {
  const session = getSessionContext();
  const now = new Date().toISOString();
  const state = getLocalState();
  const lead = state.leads.find((l) => l.id === params.leadId);
  const today = now.split("T")[0];
  state.communicationLogs = [
    {
      id: `comm-wiz-${Date.now()}`,
      leadId: params.leadId,
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.userName,
      communicationDate: today,
      communicationTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      contactMethod: (params.channel === "phone" ? "call" : params.channel) as "call" | "email" | "sms" | "direct_mail" | "voicemail",
      contactPerson: lead?.ownerName ?? "Property Owner",
      contactRole: "owner",
      templateUsedId: null,
      templateUsedName: params.scriptUsed,
      messageBodySnapshot: `Outreach logged via seller outreach wizard (${params.channel})`,
      outcome: "follow_up_requested",
      followUpDate: params.followUpDate,
      consentStatus: params.channel === "sms" ? "consent_needed" : "not_applicable",
      dncStatus: false,
      stateOutreachWarningReviewed: true,
      dncReminderAcknowledged: true,
      notes: "Logged via Seller Outreach Wizard",
      createdAt: now,
    },
    ...state.communicationLogs,
  ];
  if (lead) {
    lead.lastContactDate = now;
    lead.followUpDate = params.followUpDate;
    lead.pipelineStage = lead.pipelineStage === "new_lead" ? "first_outreach_sent" : lead.pipelineStage;
    lead.updatedAt = now;
  }
  persistLocalState();
  appendCrmAudit({
    leadId: params.leadId,
    eventType: "outreach_logged",
    description: `Outreach logged: ${params.channel}`,
  });
}

export function runDealWizardCalculation(leadId: string, input: DealCalculatorInput) {
  const session = getSessionContext();
  const result = runCalculatorForLead(leadId, input, session.userId);
  if (result) {
    const state = getLocalState();
    state.dealCalculations = [result.calculation, ...state.dealCalculations];
    persistLocalState();
    appendCrmAudit({
      leadId,
      eventType: "deal_calculation",
      description: `Deal wizard calculation: ARV $${input.estimatedArv.toLocaleString()}`,
    });
  }
  return result;
}

export function generateOutreachScripts(vars: Record<string, string>) {
  const templates = getOutreachTemplates();
  const byChannel = {
    call: templates.find((t) => t.channel === "call" || t.category === "voicemail_script"),
    sms: templates.find((t) => t.channel === "sms"),
    email: templates.find((t) => t.category === "email_inquiry"),
    mailer: templates.find((t) => t.channel === "direct_mail"),
  };
  return {
    call: byChannel.call ? applyTemplateVariables(byChannel.call.body, vars) : "",
    sms: byChannel.sms ? applyTemplateVariables(byChannel.sms.body, vars) : "",
    email: byChannel.email ? applyTemplateVariables(byChannel.email.body, vars) : "",
    mailer: byChannel.mailer ? applyTemplateVariables(byChannel.mailer.body, vars) : "",
  };
}

export function getComplianceWizardResult(leadId: string, stateAbbr: string) {
  const lead = getLocalState().leads.find((l) => l.id === leadId);
  if (!lead) return null;
  return runLeadComplianceCheck({
    leadId,
    stateAbbr,
    countyName: lead.county,
    dealType: "assignment_of_contract",
    acquisitionStrategy: "seller_outreach_preparation",
    communicationLogActive: getLocalState().communicationLogs.some((c) => c.leadId === leadId),
  });
}

export function getResearchNextSteps(flags: {
  ownerConfirmed: boolean;
  transferConfirmed: boolean;
  heirIdentified: boolean;
  sourceChecked: boolean;
  docsComplete: boolean;
}) {
  const steps: string[] = [];
  if (!flags.ownerConfirmed) steps.push("Pull deed history and confirm prior owner chain");
  if (!flags.transferConfirmed) steps.push("Verify transfer type (will, estate, quitclaim, or probate order)");
  if (!flags.heirIdentified) steps.push("Identify executor, heir, or authorized contact from court/estate records");
  if (!flags.sourceChecked) steps.push("Check county recorder and probate court index for supporting records");
  if (!flags.docsComplete) steps.push("Flag missing documents: death certificate, letters testamentary, or heir affidavit");
  if (steps.length === 0) steps.push("Research complete — proceed to compliance wizard before outreach");
  return steps;
}

export function buildDocumentPacketSummary(leadId: string) {
  const lead = getLocalState().leads.find((l) => l.id === leadId);
  const packet = getLeadPacket(leadId);
  const docs = getDocuments({ leadId });
  const compliance = getComplianceWizardResult(leadId, lead?.state ?? "TX");
  const calc = getLocalState().dealCalculations.find((c) => c.leadId === leadId);
  const matches = getBuyerMatchesForLead(leadId);
  return {
    leadSummary: lead
      ? `${lead.propertyAddress} — ${lead.ownerName} (${lead.primaryLeadType.replace(/_/g, " ")})`
      : null,
    researchSheet: lead?.signals.map((s) => `${s.name}: ${s.explanation}`).join("; ") ?? "",
    complianceChecklist: compliance?.requiredAcknowledgements ?? [],
    contactRecord: getLocalState().communicationLogs.filter((c) => c.leadId === leadId).length,
    buyerSheet: matches[0]
      ? (getLocalState().buyers.find((b) => b.id === matches[0].buyerId)?.buyerName ?? `Buyer ${matches[0].buyerId}`)
      : "No buyer matched yet",
    assignmentPlaceholder: "Assignment/intent packet — generate from Document Center",
    dealPrintout: calc
      ? `ARV $${calc.estimatedArv.toLocaleString()} | Offer range $${calc.offerRangeLow.toLocaleString()}–$${calc.offerRangeHigh.toLocaleString()}`
      : "Run deal wizard first",
    packetReadiness: packet?.readinessScore ?? 0,
    documentCount: docs.length,
  };
}

export function getStateSetupGuide(stateAbbr: string, county: string) {
  const profile = getStateProfile(stateAbbr);
  const kit = buildStateDealKit({
    stateAbbr,
    countyName: county || null,
    dealType: "assignment_of_contract",
    userRole: "org_admin",
    acquisitionStrategy: "seller_outreach_preparation",
  });
  return {
    profile,
    kit,
    probateLookup: profile?.probateCourtAccessNotes ?? "Check county probate/register of wills portal",
    deedLookup: profile?.recordingOfficeNotes ?? "Check county recorder or clerk of courts",
    outreachRules: profile?.outreachCaution ?? "Review state-specific outreach restrictions",
    documentChecklist: kit?.documentChecklist.map((d) => d.documentName) ?? [],
    recommendedWorkflow: kit?.gettingStarted.map((g) => g.label) ?? [],
  };
}
