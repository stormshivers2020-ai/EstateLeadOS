import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/types/platform";

export function PermissionDenied({ backHref = "/dashboard" }: { backHref?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-700/40 bg-red-900/20 px-8 py-16 text-center">
      <ShieldOff className="mb-4 h-12 w-12 text-red-400" />
      <h2 className="text-lg font-semibold text-red-200">Access Denied</h2>
      <p className="mt-2 max-w-md text-sm text-red-300/80">{PERMISSION_DENIED_MESSAGE}</p>
      <Link href={backHref} className="mt-6 text-sm text-sky-400 hover:underline">
        Return to Dashboard →
      </Link>
    </div>
  );
}
