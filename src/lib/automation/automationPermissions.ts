import type { PlanId } from "@/lib/constants/plans";
import type { UserRoleId } from "@/lib/constants/roles";
import type { AutomationType } from "./automationTypes";

export function checkAutomationAccess(
  _automationType: AutomationType,
  _role: UserRoleId,
  _planId: PlanId = "enterprise"
): { allowed: boolean; message: string } {
  return { allowed: true, message: "" };
}
