import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { LeadDetailView } from "@/components/crm/LeadDetailView";
import { LeadDetailTabs } from "@/components/crm/LeadDetailTabs";
import { EmptyState } from "@/components/layout/EmptyState";
import { isDemoMode } from "@/lib/config/app-mode";
import { getLeadVerificationBundle } from "@/lib/services/verification";
import {
  getCountyProfile,
  getLeadComplianceContext,
  getStateProfile,
  runLeadComplianceCheck,
} from "@/lib/services/compliance";
import { getFullLeadById, getCommunicationLogs, getFollowUps, getLeadNotes } from "@/lib/services/crm/server";
import { getCrmAuditEvents } from "@/lib/services/crm";
import type { DealType, AcquisitionStrategy } from "@/lib/types/compliance";
import { FileSearch, ArrowLeft } from "lucide-react";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const isDemo = isDemoMode();
  const lead = await getFullLeadById(id);
  const complianceContext = getLeadComplianceContext(id);

  if (!lead) {
    return (
      <AppShell title="Lead Detail" subtitle={`Lead ID: ${id}`}>
        <EmptyState
          icon={FileSearch}
          title="Lead Not Found"
          description={
            isDemo
              ? "Try lead-demo-1, lead-demo-2, lead-demo-3, or lead-demo-4."
              : "No leads yet. Import a CSV or configure an approved data source."
          }
          action={
            <Link href="/lead-feed" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
              Back to Lead Feed
            </Link>
          }
        />
      </AppShell>
    );
  }

  const state = getStateProfile(lead.state);
  const county = getCountyProfile(lead.state, lead.county);
  const communications = await getCommunicationLogs(id);
  const followUps = await getFollowUps(id);
  const notes = await getLeadNotes(id);
  const auditEvents = getCrmAuditEvents(id);
  const verificationBundle = await getLeadVerificationBundle(id, {
    propertyAddress: lead.propertyAddress,
    ownerName: lead.ownerName,
    parcelId: lead.parcelId,
  });

  const checkResult = complianceContext
    ? runLeadComplianceCheck({
        stateAbbr: lead.state,
        countyName: lead.county,
        dealType: (complianceContext.dealType ?? "direct_purchase") as DealType,
        acquisitionStrategy: (complianceContext.acquisitionStrategy ?? "direct_acquisition") as AcquisitionStrategy,
        leadId: id,
        ownerIdentityVerified: complianceContext.ownerIdentityVerified,
        sourceDocumentsAttached: complianceContext.sourceDocumentsAttached,
        communicationLogActive: communications.length > 0,
        acknowledgementsComplete: complianceContext.acknowledgements.length > 0,
      })
    : null;

  return (
    <AppShell title="Lead Intelligence Dossier" subtitle={lead.propertyAddress}>
      <Link href="/lead-feed" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to Lead Feed
      </Link>

      {isDemo && (
        <div className="mb-4 rounded-lg border border-sky-700/40 bg-sky-900/20 px-4 py-2 text-sm text-sky-200">
          Demo lead — fictional data for demonstration only.
        </div>
      )}

      <LeadDetailTabs
        leadId={id}
        verificationBundle={verificationBundle}
        overview={
          <LeadDetailView
            lead={lead}
            complianceContext={complianceContext}
            checkResult={checkResult}
            communications={communications}
            followUps={followUps}
            notes={notes}
            auditEvents={auditEvents}
            stateSupportStatus={state?.supportedStatus}
            countySupportStatus={county?.supportedStatus}
            isDemo={isDemo}
          />
        }
      />
    </AppShell>
  );
}
