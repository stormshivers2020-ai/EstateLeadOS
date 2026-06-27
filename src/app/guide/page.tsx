import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { USER_GUIDE_SECTIONS } from "@/lib/content/guides";
import Link from "next/link";

export default function UserGuidePage() {
  return (
    <PublicPageLayout title="User Guide">
      <p className="mb-8 text-sm text-slate-400">
        Plain-language guidance for EstateLeadOS workflow. EstateLeadOS does not provide legal advice.
        <Link href="/admin-guide" className="ml-2 text-sky-400 hover:underline">Admin Guide →</Link>
      </p>
      <div className="space-y-6">
        {USER_GUIDE_SECTIONS.map((section, i) => (
          <section key={section.title} className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="font-semibold text-slate-100">{i + 1}. {section.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{section.content}</p>
          </section>
        ))}
      </div>
    </PublicPageLayout>
  );
}
