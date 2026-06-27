import { AppShell } from "@/components/layout/AppShell";
import { PipelineBoard, PipelineTable } from "@/components/crm/PipelineBoard";
import { OutreachCenterClient } from "@/components/outreach/OutreachCenterClient";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { isDemoMode } from "@/lib/config/app-mode";
import {
  getPipelineCards,
  getContactReadyLeads,
  getOutreachOverview,
} from "@/lib/services/crm/server";
import { getCommunicationLogs, getFollowUpsDue, getBlockedTemplateExample } from "@/lib/services/crm";
import { getOutreachTemplates } from "@/lib/services/outreach";
import { MessageSquare } from "lucide-react";

export default async function OutreachPage() {
  const isDemo = isDemoMode();
  const cards = await getPipelineCards();
  const templates = getOutreachTemplates();
  const overview = await getOutreachOverview();
  const contactReadyLeads = await getContactReadyLeads();

  return (
    <AppShell
      title="Outreach CRM"
      subtitle="Respectful seller communication, follow-up tracking, and safety-checked outreach"
    >
      {!isDemo && cards.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="Outreach CRM Ready"
          description="Import leads or enable demo mode to access pipeline views, outreach templates, and communication logging."
        />
      )}

      {(isDemo || cards.length > 0) && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>CRM Pipeline — Kanban Board</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineBoard cards={cards} />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pipeline — Table View</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineTable cards={cards} />
            </CardContent>
          </Card>

          <OutreachCenterClient
            templates={templates}
            contactReadyLeads={contactReadyLeads}
            followUps={getFollowUpsDue()}
            communications={getCommunicationLogs()}
            overview={overview}
            blockedExample={getBlockedTemplateExample()}
            isDemo={isDemo}
          />
        </>
      )}
    </AppShell>
  );
}
