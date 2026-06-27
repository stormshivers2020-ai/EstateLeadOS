"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full bg-slate-950 antialiased dark">
      <body className="min-h-full bg-slate-950 text-slate-100">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            EstateLeadOS hit a rendering error. Your local preview data is preserved.
          </p>
          <button
            type="button"
            onClick={unstable_retry}
            className="mt-6 rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
