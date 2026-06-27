const STORAGE_KEY = "estateleados_local_state_v1";
const AUTH_KEY = "estateleados_local_auth_v1";

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silent in preview mode
  }
}

export function removeKey(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

export function loadLocalState<T>(): T | null {
  return loadJson<T>(STORAGE_KEY);
}

export function saveLocalState<T>(state: T): void {
  saveJson(STORAGE_KEY, state);
}

export function clearLocalState(): void {
  removeKey(STORAGE_KEY);
}

export function loadLocalAuth<T>(): T | null {
  return loadJson<T>(AUTH_KEY);
}

export function saveLocalAuth<T>(auth: T): void {
  saveJson(AUTH_KEY, auth);
}

export function clearLocalAuth(): void {
  removeKey(AUTH_KEY);
}
