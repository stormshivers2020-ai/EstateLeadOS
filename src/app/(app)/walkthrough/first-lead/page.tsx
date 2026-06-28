import { Suspense } from "react";
import { FirstLeadWalkthroughClient } from "@/components/walkthrough/FirstLeadWalkthroughClient";

export default function FirstLeadWalkthroughPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-400">Loading First Lead Walkthrough…</p>}>
      <FirstLeadWalkthroughClient />
    </Suspense>
  );
}
