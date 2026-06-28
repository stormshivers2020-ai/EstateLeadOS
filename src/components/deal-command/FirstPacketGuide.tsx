"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FIRST_PACKET_GUIDE,
  FIRST_PACKET_PAGE_COUNT,
  getGuidePage,
  resolveGuideHref,
} from "@/lib/constants/first-packet-guide";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { cn } from "@/lib/utils/cn";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Home,
  Sparkles,
  PartyPopper,
  MousePointer2,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const PAGE_STORAGE_KEY = "estateleados-first-packet-page";

interface FirstPacketGuideProps {
  leadId?: string;
  onNeedHouse?: () => void;
}

export function FirstPacketGuide({ leadId, onNeedHouse }: FirstPacketGuideProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPage = searchParams.get("p");

  const [pageIndex, setPageIndex] = useState(() => {
    const n = urlPage ? parseInt(urlPage, 10) : 0;
    return Number.isFinite(n) && n >= 0 && n < FIRST_PACKET_PAGE_COUNT ? n : 0;
  });

  const page = getGuidePage(pageIndex);
  const progressPct = Math.round(((pageIndex + 1) / FIRST_PACKET_PAGE_COUNT) * 100);
  const needsHouse = page?.needsHouse && !leadId;
  const actionHref = resolveGuideHref(page?.href, leadId);
  const isWelcome = page?.type === "welcome";
  const isCelebration = page?.type === "celebration";
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === FIRST_PACKET_PAGE_COUNT - 1;

  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(FIRST_PACKET_PAGE_COUNT - 1, index));
      setPageIndex(clamped);
      if (typeof window !== "undefined") {
        localStorage.setItem(PAGE_STORAGE_KEY, String(clamped));
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("p", String(clamped));
      if (leadId) params.set("leadId", leadId);
      router.replace(`/deal-command?${params.toString()}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [leadId, router, searchParams]
  );

  useEffect(() => {
    if (urlPage) {
      const n = parseInt(urlPage, 10);
      if (Number.isFinite(n) && n >= 0 && n < FIRST_PACKET_PAGE_COUNT) setPageIndex(n);
    }
  }, [urlPage]);

  useEffect(() => {
    if (!urlPage && typeof window !== "undefined") {
      const stored = localStorage.getItem(PAGE_STORAGE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (n >= 0 && n < FIRST_PACKET_PAGE_COUNT) setPageIndex(n);
      }
    }
  }, [urlPage]);

  if (!page) return null;

  return (
    <div className="relative mx-auto max-w-xl px-1">
      {/* Soft glow backdrop */}
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(56,189,248,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Progress dots */}
      {!isWelcome && (
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            {FIRST_PACKET_GUIDE.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to page ${i + 1}`}
                onClick={() => goToPage(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === pageIndex
                    ? "w-8 bg-[var(--nova-gold)]"
                    : i < pageIndex
                      ? "w-2 bg-emerald-500/70"
                      : "w-2 bg-slate-700"
                )}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-slate-400">
            Page {pageIndex + 1} of {FIRST_PACKET_PAGE_COUNT}
          </p>
          <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--nova-gold)] to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main card */}
      <article
        className={cn(
          "overflow-hidden rounded-3xl border shadow-2xl shadow-black/40",
          isWelcome || isCelebration
            ? "border-[var(--nova-gold-muted)]/50 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-black/95"
            : "border-slate-700/50 bg-slate-900/80 backdrop-blur-xl"
        )}
      >
        {isWelcome && (
          <div className="border-b border-[var(--nova-gold-muted)]/30 bg-gradient-to-r from-[var(--nova-gold-muted)]/20 via-transparent to-sky-900/20 px-6 py-10 text-center sm:px-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--nova-gold)]/20 ring-1 ring-[var(--nova-gold)]/40">
              <Home className="h-8 w-8 text-[var(--nova-gold)]" />
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--nova-gold-soft)]">
              {APP_NAME}
            </p>
            <p className="mt-1 text-xs text-slate-500">Powered by {POWERED_BY}</p>
          </div>
        )}

        {isCelebration && (
          <div className="border-b border-emerald-800/30 bg-gradient-to-r from-emerald-950/50 to-[var(--nova-gold-muted)]/10 px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/50">
              <PartyPopper className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
        )}

        <div className="p-6 sm:p-10">
          {!isWelcome && !isCelebration && (
            <p className="mb-3 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {page.where ?? "Follow along in the app"}
            </p>
          )}

          <h1
            className={cn(
              "font-semibold leading-tight tracking-tight text-slate-50",
              isWelcome ? "text-center text-3xl sm:text-4xl" : isCelebration ? "text-center text-3xl" : "text-2xl sm:text-3xl"
            )}
          >
            {page.title}
          </h1>

          <p
            className={cn(
              "mt-5 text-lg leading-relaxed text-slate-300",
              (isWelcome || isCelebration) && "text-center text-xl"
            )}
          >
            {page.body}
          </p>

          {needsHouse && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/40 px-4 py-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <p className="text-base text-amber-100">
                Pick your house in the box at the top of this page first. Then come back and tap Next.
              </p>
            </div>
          )}

          {/* What to click / type — big and clear */}
          {(page.clickButton || page.typeInField || page.pickOption || page.checkBox) && (
            <div className="mt-8 space-y-3">
              {page.clickButton && (
                <div className="flex items-center gap-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/30 px-5 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                    <MousePointer2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                      Click this button
                    </p>
                    <p className="mt-0.5 text-xl font-bold text-white">{page.clickButton}</p>
                  </div>
                </div>
              )}

              {page.pickOption && (
                <div className="flex items-center gap-4 rounded-2xl border-2 border-violet-500/40 bg-violet-950/30 px-5 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-2xl font-bold text-violet-300">
                    ▼
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/90">
                      Pick from the list
                    </p>
                    <p className="mt-0.5 text-xl font-bold text-white">{page.pickOption}</p>
                  </div>
                </div>
              )}

              {page.typeInField && (
                <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-950/30 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">Type here</p>
                  <p className="mt-1 text-lg font-medium text-amber-100">{page.typeInField.label}</p>
                  <p className="mt-2 text-xl font-bold text-white">Example: {page.typeInField.example}</p>
                </div>
              )}

              {page.checkBox && (
                <div className="rounded-2xl border-2 border-pink-500/40 bg-pink-950/30 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-pink-400/90">Check the box</p>
                  <p className="mt-1 text-base text-pink-100">{page.checkBox}</p>
                </div>
              )}
            </div>
          )}

          {page.waitUntil && !isWelcome && !isCelebration && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sky-500/25 bg-sky-950/25 px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
                  Wait until you see this
                </p>
                <p className="mt-1 text-base text-sky-100">{page.waitUntil}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-10 flex flex-col gap-3">
            {isWelcome && (
              <button
                type="button"
                onClick={() => goToPage(1)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--nova-gold)] to-amber-400 px-6 py-4 text-lg font-bold text-black shadow-lg shadow-[var(--nova-gold)]/25 transition hover:brightness-110"
              >
                <Sparkles className="h-5 w-5" />
                Let&apos;s start
              </button>
            )}

            {!isWelcome && actionHref && !needsHouse && (
              <Link
                href={actionHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-600 bg-slate-800/80 px-6 py-3.5 text-base font-medium text-slate-100 transition hover:bg-slate-700"
              >
                Open this page in the app
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}

            {!isWelcome && !isLast && (
              <button
                type="button"
                onClick={() => {
                  if (needsHouse) {
                    onNeedHouse?.();
                    return;
                  }
                  goToPage(pageIndex + 1);
                }}
                disabled={needsHouse}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--nova-gold)] to-amber-400 px-6 py-4 text-lg font-bold text-black shadow-lg shadow-[var(--nova-gold)]/20 transition hover:brightness-110 disabled:opacity-40"
              >
                I did it — Next
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {isLast && (
              <button
                type="button"
                onClick={() => goToPage(0)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-emerald-500"
              >
                Start over from the beginning
              </button>
            )}
          </div>

          {!isWelcome && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-700/40 pt-6">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => goToPage(pageIndex - 1)}
                className="inline-flex items-center gap-1 text-base text-slate-400 transition hover:text-slate-200 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              {!isLast && (
                <button
                  type="button"
                  onClick={() => goToPage(pageIndex + 1)}
                  className="text-sm text-slate-500 hover:text-slate-300"
                >
                  Skip this page
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
        One page at a time. Do the step. Tap Next. {APP_NAME} helps you — it does not give legal advice.
      </p>
    </div>
  );
}
