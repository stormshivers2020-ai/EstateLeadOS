"use client";

import { useSession } from "@/components/auth/SessionProvider";
import { SCS_NOVA_OPERATOR_SESSION } from "@/lib/config/operator-session";
import { ErrorStateCard } from "@/components/ui/ErrorStateCard";
import { getErrorState } from "@/lib/constants/error-states";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const active = session ?? SCS_NOVA_OPERATOR_SESSION;

  if (active.accountStatus === "suspended" || active.accountStatus === "disabled") {
    return <ErrorStateCard error={getErrorState("user_suspended")!} />;
  }

  return <>{children}</>;
}
