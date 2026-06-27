import { PublicPageLayout } from "@/components/layout/PublicPageLayout";

export default function TermsPage() {
  return (
    <PublicPageLayout title="Terms of Service">
      <div className="space-y-4 text-sm text-slate-300">
        <p className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-4 text-amber-200">
          Terms of Service will be finalized before production launch. This placeholder does not replace legal terms.
        </p>
        <p>
          EstateLeadOS is operated by SCS Nova. Use of the platform is subject to organization licensing, plan limits, market licenses, and applicable compliance workflows.
        </p>
        <p>Contact SCS Nova for enterprise terms and market license agreements.</p>
      </div>
    </PublicPageLayout>
  );
}
