import {
  LOCAL_PREVIEW_USERS,
  getLocalUserByRole,
  getLocalUserById,
  type LocalPreviewUser,
} from "@/lib/data/local/localUsers";
import { saveLocalAuth, loadLocalAuth, clearLocalAuth } from "./localStorageClient";
import { SESSION_COOKIE } from "@/lib/auth/route-guard";
import type { UserRoleId } from "@/lib/constants/roles";

const AUTH_KEY = "estateleados_local_auth_v1";

export interface LocalAuthSession {
  userId: string;
  role: UserRoleId;
  organizationId: string;
  selectedAt: string;
}

export function setLocalAuthSession(user: LocalPreviewUser): void {
  if (typeof document === "undefined") return;
  const session: LocalAuthSession = {
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId,
    selectedAt: new Date().toISOString(),
  };
  saveLocalAuth(session);
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${SESSION_COOKIE}=authenticated; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `elo_local_user=${encodeURIComponent(user.id)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getLocalAuthSession(): LocalAuthSession | null {
  return loadLocalAuth<LocalAuthSession>();
}

export function getActiveLocalUser(): LocalPreviewUser | null {
  const session = getLocalAuthSession();
  if (!session) return null;
  return getLocalUserById(session.userId) ?? null;
}

export function loginAsRole(role: UserRoleId): LocalPreviewUser {
  const user = getLocalUserByRole(role);
  setLocalAuthSession(user);
  return user;
}

export function clearLocalAuthSession(): void {
  if (typeof document === "undefined") return;
  clearLocalAuth();
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `elo_local_user=; path=/; max-age=0; SameSite=Lax`;
}

export { LOCAL_PREVIEW_USERS };
