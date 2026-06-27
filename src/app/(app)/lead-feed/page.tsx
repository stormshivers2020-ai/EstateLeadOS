import { AppShell } from "@/components/layout/AppShell";
import { FeatureGateNotice } from "@/components/platform/FeatureGateNotice";
import { LeadFeedClient } from "@/components/leads/LeadFeedClient";
import { LeadApprovalQueue } from "@/components/leads/LeadApprovalQueue";
import { checkLeadMarketAccess } from "@/components/platform/MarketLicensePanel";
import { isDemoMode } from "@/lib/config/app-mode";
import { getDemoLeadsSummary } from "@/lib/services/crm/server";

export default async function LeadFeedPage() {
  const isDemo = isDemoMode();
  const allLeads = await getDemoLeadsSummary();
  const leads = allLeads.filter((lead) => checkLeadMarketAccess(lead.state, lead.county).allowed);
  const blockedCount = allLeads.length - leads.length;

  return (
    <AppShell title="Lead Feed" subtitle="Nova Intelligence Layer — premium lead intelligence feed">
      <FeatureGateNotice feature="lead_feed">
        <div className="space-y-6">
          <LeadApprovalQueue compact />
          <LeadFeedClient leads={leads} isDemo={isDemo} blockedCount={blockedCount} />
        </div>
      </FeatureGateNotice>
    </AppShell>
  );
}
