import type { UserRoleId } from "@/lib/constants/roles";
import { ROLE_PERMISSIONS } from "@/lib/constants/roles";
import type { AdminSection } from "@/lib/types/platform";

const SCS_NOVA_ROLES: UserRoleId[] = ["scs_nova_super_admin", "scs_nova_admin"];
const COMPLIANCE_SECTIONS: AdminSection[] = [
  "compliance_rules", "document_templates", "states", "counties", "lead_rules",
];

export function hasPermission(role: UserRoleId, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

export function canAccessAdminConsole(role: UserRoleId): boolean {
  return SCS_NOVA_ROLES.includes(role) || role === "compliance_reviewer";
}

export function canAccessAdminSection(role: UserRoleId, section: AdminSection): boolean {
  if (role === "scs_nova_super_admin") return true;
  if (role === "scs_nova_admin") return true;
  if (role === "compliance_reviewer") {
    return COMPLIANCE_SECTIONS.includes(section) || section === "overview" || section === "audit_logs";
  }
  return false;
}

export function canManageUsers(role: UserRoleId): boolean {
  return hasPermission(role, "*") || role === "org_admin";
}

export function canManageBilling(role: UserRoleId, action: "view" | "manage"): boolean {
  if (hasPermission(role, "*")) return true;
  if (action === "view" && role === "org_admin") return true;
  return false;
}

export function canManageOrganizations(role: UserRoleId): boolean {
  return hasPermission(role, "*");
}

export function canAccessApiKeys(role: UserRoleId): boolean {
  return hasPermission(role, "*");
}

export function canEditScsNovaSettings(role: UserRoleId): boolean {
  return role === "scs_nova_super_admin";
}

export function isPastDueLocked(_accountStatus: string, _billingStatus: string): boolean {
  return false;
}
