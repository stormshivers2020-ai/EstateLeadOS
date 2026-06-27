import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { ROADMAP_ITEMS } from "@/lib/content/guides";

export default function RoadmapPage() {
  return (
    <PublicPageLayout title="Roadmap">
      <p className="mb-6 text-sm text-slate-400">Planned capabilities — timelines subject to provider contracts and legal review.</p>
      <ul className="space-y-3">
        {ROADMAP_ITEMS.map((item) => (
          <li key={item} className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-200">
            {item}
          </li>
        ))}
      </ul>
    </PublicPageLayout>
  );
}
