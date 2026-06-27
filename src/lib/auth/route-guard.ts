import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "elo_session";
export const ONBOARDING_COOKIE = "elo_onboarding_complete";

const REDIRECT_TO_APP = new Set(["/", "/login", "/signup", "/onboarding", "/platform"]);

export function isPublicRoute(_pathname: string): boolean {
  return true;
}

export function hasAppSession(_request: NextRequest): boolean {
  return true;
}

export function requiresAuth(_pathname: string): boolean {
  return false;
}

export function shouldRedirectToApp(pathname: string): boolean {
  return REDIRECT_TO_APP.has(pathname);
}
