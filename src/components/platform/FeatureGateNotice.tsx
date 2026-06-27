import type { GatedFeature } from "@/lib/engines/feature-gate";

interface FeatureGateNoticeProps {
  feature: GatedFeature;
  children?: React.ReactNode;
}

export function FeatureGateNotice({ children }: FeatureGateNoticeProps) {
  return <>{children}</>;
}
