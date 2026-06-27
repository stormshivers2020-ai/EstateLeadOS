import Link from "next/link";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";

const FOOTER_LINKS = [
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/support", label: "Support" },
  { href: "/guide", label: "Guide" },
] as const;

export function DisclaimerFooter() {
  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/80 px-6 py-4">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-xs text-slate-500 hover:text-sky-400">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs leading-relaxed text-slate-400">{GLOBAL_DISCLAIMER}</p>
        <p className="mt-2 text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_NAME} — Powered by {POWERED_BY}
        </p>
      </div>
    </footer>
  );
}
