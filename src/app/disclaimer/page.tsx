import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { DisclaimerAcknowledgement } from "@/components/disclaimer/DisclaimerAcknowledgement";

export default function DisclaimerPage() {
  return (
    <PublicPageLayout title="Compliance Disclaimer">
      <DisclaimerAcknowledgement />
    </PublicPageLayout>
  );
}
