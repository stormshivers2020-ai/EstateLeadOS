import type { AutomationStatus } from "./automationTypes";

const TRANSITIONS: Record<AutomationStatus, AutomationStatus[]> = {
  idle: ["queued", "running"],
  queued: ["running", "cancelled"],
  running: ["paused", "waiting_for_approval", "blocked", "failed", "completed", "stopped"],
  paused: ["running", "stopped", "cancelled"],
  waiting_for_approval: ["running", "paused", "stopped", "cancelled", "blocked"],
  blocked: ["running", "paused", "stopped", "cancelled"],
  failed: ["running", "stopped", "cancelled"],
  completed: [],
  cancelled: [],
  stopped: ["queued", "running"],
};

export function canTransition(from: AutomationStatus, to: AutomationStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: AutomationStatus, to: AutomationStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid automation transition: ${from} → ${to}`);
  }
}

export function buttonLabelForStatus(status: AutomationStatus): string {
  switch (status) {
    case "idle": return "Start Automation";
    case "queued": return "Automation Queued";
    case "running": return "Automation Running";
    case "paused": return "Automation Paused";
    case "waiting_for_approval": return "Approval Needed";
    case "blocked": return "Automation Blocked";
    case "completed": return "Automation Complete";
    case "failed": return "Automation Failed";
    case "stopped": return "Automation Stopped";
    case "cancelled": return "Automation Cancelled";
    default: return "Start Automation";
  }
}
