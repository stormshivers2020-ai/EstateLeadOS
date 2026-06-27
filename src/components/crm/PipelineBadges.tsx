import { Badge } from "@/components/ui/Badge";
import type { CrmPipelineStage, FollowUpStatus, SafetyStatus, ConsentStatus } from "@/lib/types/crm";
import { getStageName } from "@/lib/constants/pipeline-stages";

type Variant = "default" | "success" | "warning" | "danger" | "info";

export function PipelineStageBadge({ stage }: { stage: CrmPipelineStage }) {
  const variant: Variant =
    stage === "closed_won" ? "success" :
    stage === "do_not_contact" ? "danger" :
    stage === "under_contract" || stage === "closing_scheduled" ? "info" :
    stage === "follow_up_needed" ? "warning" :
    stage === "compliance_review" ? "warning" : "default";
  return <Badge variant={variant}>{getStageName(stage)}</Badge>;
}

export function DncBadge() {
  return <Badge variant="danger">Do Not Contact</Badge>;
}

export function BlockerBadge() {
  return <Badge variant="warning">Blocker</Badge>;
}

export function SafetyStatusBadge({ status }: { status: SafetyStatus }) {
  const variant: Variant =
    status === "approved" ? "success" :
    status === "blocked" ? "danger" :
    status === "needs_review" ? "warning" : "info";
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}

export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  const variant: Variant =
    status === "overdue" ? "danger" :
    status === "due_today" ? "warning" :
    status === "complete" ? "success" : "default";
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}

export function ConsentBadge({ status }: { status: ConsentStatus }) {
  const variant: Variant =
    status === "do_not_contact" || status === "opted_out" ? "danger" :
    status === "consent_recorded" ? "success" :
    status === "consent_needed" ? "warning" : "default";
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}
