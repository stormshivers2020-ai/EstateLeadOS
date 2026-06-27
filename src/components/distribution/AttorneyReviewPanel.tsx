"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import {
  ATTORNEY_FEE_WARNING,
  COMPENSATION_TRACKING_WARNING,
  MANUAL_OVERRIDE_TEXT,
  ATTORNEY_REVIEW_STATUS_LABELS,
} from "@/lib/types/distribution";
import { UPLOAD_CATEGORY_LABELS } from "@/lib/constants/distribution-templates";
import type { AttorneyReview, AttorneyCompensation } from "@/lib/types/distribution";
import { Scale, Upload, Printer, Loader2, AlertTriangle } from "lucide-react";

interface AttorneyReviewPanelProps {
  leadId: string;
}

export function AttorneyReviewPanel({ leadId }: AttorneyReviewPanelProps) {
  const [review, setReview] = useState<AttorneyReview | null>(null);
  const [compensation, setCompensation] = useState<AttorneyCompensation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/distribution/attorney-review/${leadId}`);
      const json = await res.json();
      setReview(json.review);
      setCompensation(json.compensation);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  async function action(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/distribution/attorney-review/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  function printReviewFile() {
    if (!review?.attorneyReviewFileHtml) return;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(review.attorneyReviewFileHtml);
      w.document.close();
      w.print();
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading attorney review…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
        <div className="flex items-start gap-2">
          <Scale className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{GLOBAL_DISCLAIMER}</p>
            <p className="mt-2 text-xs">{ATTORNEY_FEE_WARNING}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Attorney Review</CardTitle>
          {review && (
            <Badge variant={review.reviewStatus === "approved" ? "success" : "warning"}>
              {ATTORNEY_REVIEW_STATUS_LABELS[review.reviewStatus]}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Attorney Name" value={review?.attorneyName} onSave={(v) => action("update", { patch: { attorneyName: v } })} />
            <Field label="Firm" value={review?.attorneyFirm} onSave={(v) => action("update", { patch: { attorneyFirm: v } })} />
            <Field label="Email" value={review?.attorneyEmail} onSave={(v) => action("update", { patch: { attorneyEmail: v } })} />
            <Field label="Phone" value={review?.attorneyPhone} onSave={(v) => action("update", { patch: { attorneyPhone: v } })} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => action("build_review_file")} className="rounded-lg bg-sky-700 px-3 py-2 text-xs text-white disabled:opacity-50">
              Build Attorney Review File
            </button>
            {review?.attorneyReviewFileHtml && (
              <button type="button" onClick={printReviewFile} className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
                <Printer className="h-3 w-3" /> Print Review File
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => action("mark_sent")} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
              Mark Sent to Attorney (Manual)
            </button>
            <select
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
              value={review?.reviewStatus ?? "not_started"}
              onChange={(e) => action("update", { patch: { reviewStatus: e.target.value, reviewCompletedAt: e.target.value === "approved" ? new Date().toISOString() : null } })}
            >
              {Object.entries(ATTORNEY_REVIEW_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            rows={3}
            placeholder="Attorney notes / changes requested"
            defaultValue={review?.reviewNotes ?? ""}
            onBlur={(e) => action("update", { patch: { reviewNotes: e.target.value, changesRequested: e.target.value } })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Upload Reviewed File</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">Every upload is versioned. Previous files are preserved.</p>
          <UploadForm busy={busy} onUpload={(data) => action("upload", data)} />
          {review?.uploads?.length ? (
            <ul className="space-y-1 text-xs text-slate-400">
              {review.uploads.map((u) => (
                <li key={u.id}>v{u.versionNumber} · {UPLOAD_CATEGORY_LABELS[u.documentCategory] ?? u.documentCategory} · {u.fileName}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Lawyer Compensation Tracker</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-amber-200/80">{COMPENSATION_TRACKING_WARNING}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
              value={compensation?.compensationType ?? "not_set"}
              onChange={(e) => action("update_compensation", { patch: { compensationType: e.target.value } })}
            >
              <option value="not_set">Not Set</option>
              <option value="flat_fee">Flat Fee</option>
              <option value="hourly">Hourly</option>
              <option value="contingent_percentage">Contingent Percentage</option>
              <option value="hybrid">Hybrid</option>
              <option value="not_applicable">Not Applicable</option>
            </select>
            <input
              type="number"
              placeholder="Proposed flat fee (user-entered)"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
              defaultValue={compensation?.proposedFlatFee ?? ""}
              onBlur={(e) => action("update_compensation", { patch: { proposedFlatFee: Number(e.target.value) || null } })}
            />
            <input
              type="number"
              placeholder="Proposed % (user-entered — not recommended by EstateLeadOS)"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
              defaultValue={compensation?.proposedPercentage ?? ""}
              onBlur={(e) => action("update_compensation", { patch: { proposedPercentage: Number(e.target.value) || null } })}
            />
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={compensation?.writtenAgreementUploaded ?? false}
                disabled
              />
              Written agreement uploaded (via upload above)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Manual Override (Distribution Gate)</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-slate-400">{MANUAL_OVERRIDE_TEXT}</p>
          {review?.manualOverrideAcknowledged ? (
            <Badge variant="warning">Override acknowledged by {review.manualOverrideBy}</Badge>
          ) : (
            <button type="button" disabled={busy} onClick={() => action("manual_override")} className="rounded-lg border border-amber-700/50 px-3 py-2 text-xs text-amber-200">
              Acknowledge Manual Override
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onSave }: { label: string; value?: string | null; onSave: (v: string) => void }) {
  return (
    <label className="block text-xs">
      <span className="text-slate-500">{label}</span>
      <input
        className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
        defaultValue={value ?? ""}
        onBlur={(e) => onSave(e.target.value)}
      />
    </label>
  );
}

function UploadForm({ busy, onUpload }: { busy: boolean; onUpload: (data: Record<string, string>) => void }) {
  const [category, setCategory] = useState("attorney_reviewed_packet");
  const [fileName, setFileName] = useState("");

  return (
    <div className="flex flex-wrap gap-2">
      <select className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
        {Object.entries(UPLOAD_CATEGORY_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <input
        className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
        placeholder="File name (e.g. attorney-reviewed-packet.pdf)"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />
      <button
        type="button"
        disabled={busy || !fileName}
        onClick={() => onUpload({
          fileName,
          fileUrl: `/uploads/local/${encodeURIComponent(fileName)}`,
          fileType: "application/pdf",
          documentCategory: category,
        })}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white disabled:opacity-50"
      >
        <Upload className="h-3 w-3" /> Upload
      </button>
    </div>
  );
}
