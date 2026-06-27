import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { CHANGELOG_ENTRIES } from "@/lib/content/guides";
import { Badge } from "@/components/ui/Badge";

export default function ChangelogPage() {
  return (
    <PublicPageLayout title="Changelog">
      <ul className="space-y-4">
        {CHANGELOG_ENTRIES.map((entry) => (
          <li key={entry.phase} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <Badge variant="info">Phase {entry.phase}</Badge>
              <span className="font-medium text-slate-100">{entry.title}</span>
              <Badge variant="success">{entry.status}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </PublicPageLayout>
  );
}
