import { isLocalPreviewMode } from "./runtime";
import { SCS_NOVA_OPERATOR_SESSION } from "./operator-session";
import type { UserRoleId } from "@/lib/constants/roles";
import type { PlanId } from "@/lib/constants/plans";
import type { FullLeadDetail } from "@/lib/types/crm";

export interface SessionContext {
  userId: string;
  userName: string;
  email: string;
  role: UserRoleId;
  organizationId: string;
  organizationName: string;
  planId: PlanId;
  billingStatus: string;
  accountStatus: string;
}

let clientLeadsCache: FullLeadDetail[] = [];

export function setClientSessionContext(_ctx: SessionContext | null): void {
  // Single-operator mode — session is always SCS Nova.
}

export function setClientLeadsCache(leads: FullLeadDetail[]): void {
  clientLeadsCache = leads;
}

export function getClientLeadsCache(): FullLeadDetail[] {
  return clientLeadsCache;
}

export function getSessionContext(): SessionContext {
  return SCS_NOVA_OPERATOR_SESSION;
}

export function getAdminSessionRole(): UserRoleId {
  return SCS_NOVA_OPERATOR_SESSION.role;
}
