import type { SessionContext } from "@/lib/config/session";

/** Single-operator SCS Nova production session — no multi-tenant auth. */
export const SCS_NOVA_OPERATOR_SESSION: SessionContext = {
  userId: "scs-nova-operator",
  userName: "SCS Nova",
  email: "",
  role: "scs_nova_super_admin",
  organizationId: "scs-nova",
  organizationName: "SCS Nova",
  planId: "enterprise",
  billingStatus: "active",
  accountStatus: "active",
};
