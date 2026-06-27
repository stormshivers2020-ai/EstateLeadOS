import { PublicPageLayout } from "@/components/layout/PublicPageLayout";

export default function PrivacyPage() {
  return (
    <PublicPageLayout title="Privacy Policy">
      <div className="space-y-4 text-sm text-slate-300">
        <p className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-4 text-amber-200">
          Privacy Policy will be finalized before production launch. This placeholder does not replace a legal privacy policy.
        </p>
        <p>
          EstateLeadOS processes organization-owned data including leads, documents, buyers, assignments, and communication logs. Data is isolated per organization.
        </p>
        <p>Production privacy practices will be documented before launch. Contact SCS Nova with privacy questions.</p>
      </div>
    </PublicPageLayout>
  );
}
