import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentDetailClient } from "@/components/documents/DocumentDetailClient";
import { getDocumentById } from "@/lib/services/documents";
import { getLeadSummary } from "@/lib/services/crm/server";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = getDocumentById(id);

  if (!document) {
    notFound();
  }

  const lead = document.leadId ? await getLeadSummary(document.leadId) : null;

  return (
    <AppShell
      title={document.documentName}
      subtitle="Document detail — workflow template tracking"
    >
      <DocumentDetailClient
        document={document}
        leadAddress={lead?.propertyAddress}
      />
    </AppShell>
  );
}
