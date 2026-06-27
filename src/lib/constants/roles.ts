export const USER_ROLES = [
  {
    id: "solo_investor",
    name: "Solo Investor",
    description: "Individual investor managing their own leads and outreach",
  },
  {
    id: "acquisition_manager",
    name: "Acquisition Manager",
    description: "Leads acquisition team and pipeline strategy",
  },
  {
    id: "team_member",
    name: "Team Member",
    description: "Works assigned leads within organization workflows",
  },
  {
    id: "compliance_reviewer",
    name: "Compliance Reviewer",
    description: "Reviews compliance acknowledgements and document status",
  },
  {
    id: "org_admin",
    name: "Organization Admin",
    description: "Manages organization users and settings",
  },
  {
    id: "scs_nova_admin",
    name: "SCS Nova Admin",
    description: "Authorized SCS Nova platform administration",
  },
  {
    id: "scs_nova_super_admin",
    name: "SCS Nova Super Admin",
    description: "Platform-wide administration and licensing control",
  },
] as const;

export type UserRoleId = (typeof USER_ROLES)[number]["id"];

export const ROLE_PERMISSIONS: Record<UserRoleId, string[]> = {
  solo_investor: ["leads:read", "leads:write", "outreach:write", "documents:read"],
  acquisition_manager: [
    "leads:read",
    "leads:write",
    "outreach:write",
    "documents:read",
    "documents:write",
    "buyers:read",
    "assignments:read",
    "reports:read",
  ],
  team_member: ["leads:read", "leads:write", "outreach:write", "documents:read"],
  compliance_reviewer: [
    "leads:read",
    "compliance:read",
    "compliance:write",
    "documents:read",
    "audit:read",
  ],
  org_admin: [
    "leads:read",
    "leads:write",
    "outreach:write",
    "documents:read",
    "documents:write",
    "buyers:read",
    "buyers:write",
    "assignments:read",
    "assignments:write",
    "reports:read",
    "org:admin",
    "billing:read",
  ],
  scs_nova_admin: [
    "admin:read",
    "admin:write",
    "users:manage",
    "orgs:manage",
    "billing:manage",
    "plans:read",
    "licenses:manage",
    "audit:read",
    "support:manage",
    "api:manage",
    "health:read",
  ],
  scs_nova_super_admin: ["*"],
};
