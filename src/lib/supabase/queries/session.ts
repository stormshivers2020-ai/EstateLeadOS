import "server-only";

import { cache } from "react";
import { SCS_NOVA_OPERATOR_SESSION } from "@/lib/config/operator-session";
import type { SessionContext } from "@/lib/config/session";

export const getServerSessionContext = cache(async (): Promise<SessionContext> => {
  return SCS_NOVA_OPERATOR_SESSION;
});

export async function getCurrentOrganizationId(): Promise<string> {
  return SCS_NOVA_OPERATOR_SESSION.organizationId;
}
