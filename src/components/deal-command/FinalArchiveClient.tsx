"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { FINAL_ARCHIVE_STEP, FINAL_OUTCOME_STEP } from "@/lib/constants/process-steps";
import { loadArchiveOverview } from "@/lib/services/program/client-program";
import type { LeadArchive } from "@/lib/types/program";
import { getLocalState } from "@/lib/local/localStateStore";
import { Archive, FileCheck, Loader2 } from "lucide-react";

interface FinalArchiveRow {
  id: string;
  leadId: string;
  label: string;
  archivedAt: string | null;
  status: string;
  pendingStorage?: boolean;
}

export function FinalArchiveClient() {
  const [rows, setRows] = useState<FinalArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await loadArchiveOverview();
      const attorneyArchives = (json.archives ?? []).filter(
        (a: LeadArchive) =>
          a.archiveType === "attorney_title_review"
          || a.archiveStatus === "archived_closed"
          || a.archiveStatus === "assignment_review_ready",
      );

      const mapped: FinalArchiveRow[] = attorneyArchives.map((a: LeadArchive) => ({
        id: a.id,
        leadId: a.leadId,
        label: "Attorney-Reviewed Archive",
        archivedAt: a.archivedAt,
        status: a.archiveStatus,
      }));

      const state = getLocalState();
      for (const r of state.attorneyReviews.filter((rev) => rev.approvedFileUrl)) {
        if (!mapped.some((m) => m.leadId === r.leadId)) {
          mapped.push({
            id: `pending-final-${r.leadId}`,
            leadId: r.leadId,
            label: "Attorney file uploaded — pending final archive storage",
            archivedAt: r.reviewCompletedAt ?? r.updatedAt,
            status: "ready_for_archive",
            pendingStorage: true,
          });
        }
      }

      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading final archive…
      </div>
    );
  }

  const finalOutcomes = rows.filter((r) => r.status === "archived_closed");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-purple-800/40 bg-purple-950/20 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-purple-200">Final Archive — Steps {FINAL_ARCHIVE_STEP} & {FINAL_OUTCOME_STEP}</p>
        <p className="mt-1 text-xs text-slate-400">
          Separate from the first internal review archive (Step 14). Store attorney-reviewed files here after upload
          (Step 18). Archive final deal outcome at Step {FINAL_OUTCOME_STEP}. Not legal approval.
        </p>
        <p className="mt-2 text-xs text-slate-500">{GLOBAL_DISCLAIMER}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Step {FINAL_ARCHIVE_STEP}</p>
            <p className="text-sm font-medium text-slate-200">Attorney-Reviewed Files</p>
            <p className="text-2xl font-semibold text-purple-300">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Step {FINAL_OUTCOME_STEP}</p>
            <p className="text-sm font-medium text-slate-200">Final Outcomes Archived</p>
            <p className="text-2xl font-semibold text-emerald-300">{finalOutcomes.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="h-4 w-4 text-purple-400" />
            Final Archive Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="space-y-2 text-sm text-slate-400">
              <p>No final archive records yet.</p>
              <p>
                Complete Steps 15–18 (attorney review and upload), then store files here at Step {FINAL_ARCHIVE_STEP}.
              </p>
              <Link href="/review-queue" className="inline-block text-sky-400 hover:underline">
                Open Attorney Review →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-purple-800/30 p-3 text-sm"
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium text-slate-200">
                      <FileCheck className="h-4 w-4 text-purple-400" />
                      {row.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.archivedAt ? new Date(row.archivedAt).toLocaleString() : "Pending storage"}
                    </p>
                    <Badge variant={row.pendingStorage ? "warning" : "default"}>
                      {row.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <Link
                    href={`/leads/${row.leadId}?tab=attorney`}
                    className="rounded border border-sky-700/50 px-2 py-1 text-xs text-sky-400"
                  >
                    Open Lead
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link href="/archive" className="inline-block text-sm text-sky-400 hover:underline">
        ← Back to First Archive (Step 14 — Internal Review Packet)
      </Link>
    </div>
  );
}
