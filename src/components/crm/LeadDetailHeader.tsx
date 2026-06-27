import { ScoreBadge, RiskBadge } from "@/components/compliance/ComplianceBadges";
import { PipelineStageBadge, DncBadge } from "./PipelineBadges";
import { AutomationButton } from "@/components/automation/AutomationButton";
import { Badge } from "@/components/ui/Badge";
import { getLeadTypeName } from "@/lib/constants/lead-types";
import type { LeadTypeId } from "@/lib/types/leads";
import type { CrmPipelineStage } from "@/lib/types/crm";

interface LeadDetailHeaderProps {
  leadId: string;
  propertyAddress: string;
  leadType: string;
  estateLeadScore: number;
  dealPotentialScore: number;
  complianceRiskScore: number;
  pipelineStage: CrmPipelineStage;
  assignedUserName?: string | null;
  nextAction: string;
  doNotContact: boolean;
}

export function LeadDetailHeader({
  leadId,
  propertyAddress,
  leadType,
  estateLeadScore,
  dealPotentialScore,
  complianceRiskScore,
  pipelineStage,
  assignedUserName,
  nextAction,
  doNotContact,
}: LeadDetailHeaderProps) {
  const risk = complianceRiskScore >= 80 ? "restricted" : complianceRiskScore >= 60 ? "elevated" : complianceRiskScore >= 40 ? "moderate" : "low";

  return (
    <div className="premium-panel rounded-xl p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="nova-label">Nova Intelligence Layer</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight break-words text-[var(--nova-text-primary)] sm:text-2xl">{propertyAddress}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="info">{getLeadTypeName(leadType as LeadTypeId)}</Badge>
            <PipelineStageBadge stage={pipelineStage} />
            {doNotContact && <DncBadge />}
            {assignedUserName && <span className="text-xs text-slate-400">Assigned: {assignedUserName}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScoreBadge score={estateLeadScore} label="Estate" />
          <ScoreBadge score={dealPotentialScore} label="Deal Potential" />
          <RiskBadge risk={risk} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--nova-border)] pt-4">
        <p className="text-sm text-[var(--nova-text-secondary)]">Primary action: <span className="font-medium text-[var(--nova-text-primary)]">{nextAction}</span></p>
        <AutomationButton leadId={leadId} compact />
      </div>
    </div>
  );
}
