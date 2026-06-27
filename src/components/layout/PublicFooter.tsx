import Link from "next/link";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";

const FOOTER_LINKS = [
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/support", label: "Support" },
  { href: "/guide", label: "User Guide" },
  { href: "/platform", label: "Why EstateLeadOS" },
  { href: "/demo-story", label: "Demo Story" },
  { href: "/changelog", label: "Changelog" },
  { href: "/roadmap", label: "Roadmap" },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-800 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-slate-400 hover:text-sky-400">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs leading-relaxed text-slate-500">{GLOBAL_DISCLAIMER}</p>
        <p className="mt-3 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} {APP_NAME} — Powered by {POWERED_BY}
        </p>
      </div>
    </footer>
  );
}
