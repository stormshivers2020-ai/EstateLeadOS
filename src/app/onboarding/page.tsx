import { AppShell } from "@/components/layout/AppShell";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <AppShell title="Welcome to EstateLeadOS" subtitle="Guided setup for your SCS Nova workspace">
      <OnboardingFlow />
    </AppShell>
  );
}
