import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AssignmentDetailClient } from "@/components/deal-workflow/AssignmentDetailClient";
import { getAssignmentById } from "@/lib/services/assignments";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assignment = getAssignmentById(id);

  if (!assignment) {
    notFound();
  }

  return (
    <AppShell
      title="Assignment Detail"
      subtitle="Assignment workflow tracking — estimated spread, not guaranteed profit"
    >
      <AssignmentDetailClient assignment={assignment} />
    </AppShell>
  );
}
