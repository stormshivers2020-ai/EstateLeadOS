"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center">
      <h1 className="text-2xl font-bold text-slate-100">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        A service request failed. Your data is preserved. Try again or contact support if the issue persists.
      </p>
      <div className="mt-6 flex gap-4">
        <button type="button" onClick={reset} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500">
          Try again
        </button>
        <Link href="/support" className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:border-slate-500">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
