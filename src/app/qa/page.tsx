import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { QA_CHECKLIST } from "@/lib/content/guides";

export default function QAPage() {
  return (
    <PublicPageLayout title="QA Checklist">
      <p className="mb-6 text-sm text-slate-400">
        Phase 8 acceptance test coverage — 65 required QA checks for launch readiness.
      </p>
      <ol className="space-y-2">
        {QA_CHECKLIST.map((item, i) => (
          <li key={item} className="flex gap-3 rounded border border-slate-800 px-3 py-2 text-sm text-slate-300">
            <span className="shrink-0 text-slate-500">{i + 1}.</span>
            <span>{item}</span>
            <span className="ml-auto shrink-0 text-xs text-emerald-500">✓ Architecture</span>
          </li>
        ))}
      </ol>
    </PublicPageLayout>
  );
}
