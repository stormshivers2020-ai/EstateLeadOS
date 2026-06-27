import type { AutomationLog } from "./automationTypes";

let logCounter = 0;

export function createLogEntry(params: Omit<AutomationLog, "id" | "createdAt">): AutomationLog {
  logCounter += 1;
  return {
    id: `alog-${Date.now()}-${logCounter}`,
    createdAt: new Date().toISOString(),
    ...params,
  };
}
