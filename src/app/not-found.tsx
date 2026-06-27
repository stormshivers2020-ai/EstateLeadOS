import Link from "next/link";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";

export default function NotFound() {
  return (
    <PublicPageLayout title="Page Not Found">
      <p className="text-slate-400">The page you requested could not be found.</p>
      <div className="mt-6 flex gap-4">
        <Link href="/" className="text-sky-400 hover:underline">Home</Link>
        <Link href="/dashboard" className="text-sky-400 hover:underline">Dashboard</Link>
        <Link href="/support" className="text-sky-400 hover:underline">Support</Link>
      </div>
    </PublicPageLayout>
  );
}
