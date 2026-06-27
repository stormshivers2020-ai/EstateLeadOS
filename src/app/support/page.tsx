import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";

export default function SupportPage() {
  return (
    <PublicPageLayout title="Support">
      <div className="mb-8 space-y-2 text-sm text-slate-400">
        <p>Create a support ticket for data source, compliance, billing, or account access issues.</p>
        <p>Contact SCS Nova: <span className="text-slate-300">support@scsnova.placeholder</span> · <span className="text-slate-300">(placeholder)</span></p>
      </div>
      <SupportTicketForm />
    </PublicPageLayout>
  );
}
