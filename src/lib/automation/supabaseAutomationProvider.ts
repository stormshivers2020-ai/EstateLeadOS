import type { AutomationState } from "./automationTypes";

/** Supabase-ready automation provider — placeholder for production background jobs */
export const supabaseAutomationProvider = {
  async getState(): Promise<AutomationState> {
    throw new Error("Supabase automation provider not configured. Use local preview mode.");
  },
  async saveState(_state: AutomationState): Promise<void> {
    throw new Error("Supabase automation provider not configured.");
  },
};
