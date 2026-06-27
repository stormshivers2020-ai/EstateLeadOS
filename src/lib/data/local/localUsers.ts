import type { UserRoleId } from "@/lib/constants/roles";
import type { PlanId } from "@/lib/constants/plans";

export interface LocalPreviewUser {
  id: string;
  name: string;
  email: string;
  role: UserRoleId;
  organizationId: string;
  organizationName: string;
  planId: PlanId;
  accountStatus: string;
  billingStatus: string;
  activeStates: string[];
  activeCounties: string[];
}

export const LOCAL_PREVIEW_USERS: LocalPreviewUser[] = [
  {
    id: "local-solo",
    name: "Jordan Ellis",
    email: "solo@local-preview.test",
    role: "solo_investor",
    organizationId: "org-fresh-start",
    organizationName: "Fresh Start Organization",
    planId: "starter",
    accountStatus: "active",
    billingStatus: "trial",
    activeStates: ["TX"],
    activeCounties: ["Harris, TX"],
  },
  {
    id: "local-acq",
    name: "Morgan Blake",
    email: "acq@local-preview.test",
    role: "acquisition_manager",
    organizationId: "org-demo-scs",
    organizationName: "SCS Nova Demo Organization",
    planId: "pro",
    accountStatus: "active",
    billingStatus: "active",
    activeStates: ["TX", "FL"],
    activeCounties: ["Harris, TX", "Duval, FL"],
  },
  {
    id: "local-team",
    name: "Casey Wright",
    email: "team@local-preview.test",
    role: "team_member",
    organizationId: "org-demo-scs",
    organizationName: "SCS Nova Demo Organization",
    planId: "team",
    accountStatus: "active",
    billingStatus: "active",
    activeStates: ["TX"],
    activeCounties: ["Harris, TX"],
  },
  {
    id: "local-compliance",
    name: "Riley Chen",
    email: "compliance@local-preview.test",
    role: "compliance_reviewer",
    organizationId: "org-demo-scs",
    organizationName: "SCS Nova Demo Organization",
    planId: "team",
    accountStatus: "active",
    billingStatus: "active",
    activeStates: ["TX", "OH"],
    activeCounties: [],
  },
  {
    id: "local-org-admin",
    name: "Sam Rivera",
    email: "admin@local-preview.test",
    role: "org_admin",
    organizationId: "org-demo-scs",
    organizationName: "SCS Nova Demo Organization",
    planId: "team",
    accountStatus: "active",
    billingStatus: "active",
    activeStates: ["TX", "FL", "OH"],
    activeCounties: ["Harris, TX", "Franklin, OH"],
  },
  {
    id: "local-scs-super",
    name: "Alex Morgan",
    email: "scs.super@local-preview.test",
    role: "scs_nova_super_admin",
    organizationId: "org-demo-scs",
    organizationName: "SCS Nova Demo Organization",
    planId: "team",
    accountStatus: "active",
    billingStatus: "active",
    activeStates: ["TX", "FL", "OH", "GA", "NC"],
    activeCounties: [],
  },
];

export function getLocalUserByRole(role: UserRoleId): LocalPreviewUser {
  return LOCAL_PREVIEW_USERS.find((u) => u.role === role) ?? LOCAL_PREVIEW_USERS[0];
}

export function getLocalUserById(id: string): LocalPreviewUser | undefined {
  return LOCAL_PREVIEW_USERS.find((u) => u.id === id);
}
