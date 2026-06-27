import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { PermissionDenied } from "./PermissionDenied";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const session = getSessionContext();
  if (!canAccessAdminConsole(session.role)) {
    return <PermissionDenied />;
  }
  return <>{children}</>;
}
