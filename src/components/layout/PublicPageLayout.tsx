import Link from "next/link";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { PublicFooter } from "./PublicFooter";
import { Building2 } from "lucide-react";

interface PublicPageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function PublicPageLayout({ children, title }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-50">{APP_NAME}</p>
              <p className="text-xs text-slate-400">Powered by {POWERED_BY}</p>
            </div>
          </Link>
          <Link href="/dashboard" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
            Open Command Center
          </Link>
        </div>
      </header>
      <main className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {title && <h1 className="mb-8 text-3xl font-bold text-slate-50">{title}</h1>}
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
