"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { UPLOAD_CATEGORY_LABELS } from "@/lib/constants/distribution-templates";
import { FINAL_ARCHIVE_STEP } from "@/lib/constants/process-steps";
import {
  attorneyReviewAction,
  loadAttorneyReviewData,
  type AttorneyReviewData,
} from "@/lib/services/distribution/client-distribution";
import {
  ATTORNEY_FEE_STATUS_LABELS,
  ATTORNEY_FEE_WARNING,
  ATTORNEY_NO_FEE_RECOMMENDATION,
  ATTORNEY_REVIEW_STATUS_LABELS,
  COMPENSATION_TRACKING_WARNING,
  COMPENSATION_TYPE_LABELS,
  MANUAL_OVERRIDE_TEXT,
  PAYMENT_DUE_CONDITION_LABELS,
} from "@/lib/types/distribution";
import { PACKET_TYPE_LABELS } from "@/lib/types/program";
import {
  Scale,
  Upload,
  Printer,
  Loader2,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface AttorneyReviewPanelProps {
  leadId: string;
}

export function AttorneyReviewPanel({ leadId }: AttorneyReviewPanelProps) {
  const [data, setData] = useState<AttorneyReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPacketId, setSelectedPacketId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await loadAttorneyReviewData(leadId);
      setData(json);
      setSelectedPacketId(json.review?.packetId ?? json.packets[0]?.id ?? "");
    } catch {
      setError("Could not load attorney review data.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await attorneyReviewAction(leadId, action, extra);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Saved.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  function printReviewFile() {
    if (!data?.review?.attorneyReviewFileHtml) return;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(data.review.attorneyReviewFileHtml);
      w.document.close();
      w.print();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading attorney review…
      </div>
    );
  }

  const review = data?.review;
  const compensation = data?.compensation;
  const packets = data?.packets ?? [];
  const workflowSteps = data?.workflowSteps ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
        <div className="flex items-start gap-2">
          <Scale className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">EstateLeadOS · Powered by SCS Nova</p>
            <p className="mt-1">{GLOBAL_DISCLAIMER}</p>
            <p className="mt-2 text-xs">{ATTORNEY_FEE_WARNING}</p>
            <p className="mt-1 text-xs text-amber-200/80">
              EstateLeadOS does not create an attorney-client relationship and does not provide legal advice.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-800/40 bg-red-950/20 px-3 py-2 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Attorney Review Workflow</CardTitle>
          {review && (
            <Badge variant={review.reviewStatus === "approved" ? "success" : "warning"}>
              {ATTORNEY_REVIEW_STATUS_LABELS[review.reviewStatus]}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {workflowSteps.map((step) => (
              <li key={step.key} className="flex items-start gap-2 text-xs">
                {step.complete ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                )}
                <div>
                  <span className="text-slate-300">
                    Step {step.step}: {step.label}
                  </span>
                  {step.detail && <p className="text-slate-500">{step.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 — Select Packet for Attorney Review</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <select
            className="min-w-[240px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={selectedPacketId}
            onChange={(e) => setSelectedPacketId(e.target.value)}
          >
            <option value="">Select a built packet…</option>
            {packets.map((p) => (
              <option key={p.id} value={p.id}>
                {PACKET_TYPE_LABELS[p.packetType]} v{p.packetVersion}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !selectedPacketId}
            onClick={() => run("select_packet", { packetId: selectedPacketId })}
            className="rounded-lg bg-sky-700 px-3 py-2 text-xs text-white disabled:opacity-50"
          >
            Link Packet
          </button>
          {packets.length === 0 && (
            <p className="w-full text-xs text-slate-500">
              Build a packet on the Packet & Archive tab first.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2 — Attorney Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Attorney Name" value={review?.attorneyName} onSave={(v) => run("update", { patch: { attorneyName: v } })} />
          <Field label="Firm" value={review?.attorneyFirm} onSave={(v) => run("update", { patch: { attorneyFirm: v } })} />
          <Field label="Email" value={review?.attorneyEmail} onSave={(v) => run("update", { patch: { attorneyEmail: v } })} />
          <Field label="Phone" value={review?.attorneyPhone} onSave={(v) => run("update", { patch: { attorneyPhone: v } })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Steps 3–7 — Review, Delivery & Approval Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run("build_review_file", { packetId: selectedPacketId || review?.packetId })}
              className="rounded-lg bg-sky-700 px-3 py-2 text-xs text-white disabled:opacity-50"
            >
              Build / Export Review File
            </button>
            {review?.attorneyReviewFileHtml && (
              <button
                type="button"
                onClick={printReviewFile}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300"
              >
                <Printer className="h-3 w-3" /> Print Review File
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => run("mark_sent")}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300"
            >
              Mark Sent / Delivered Manually
            </button>
          </div>

          <label className="block text-xs">
            <span className="text-slate-500">Step 7 — Attorney Approval Status</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
              value={review?.reviewStatus ?? "not_started"}
              onChange={(e) =>
                run("update", {
                  patch: {
                    reviewStatus: e.target.value,
                    reviewCompletedAt:
                      e.target.value === "approved" || e.target.value === "approved_with_notes"
                        ? new Date().toISOString()
                        : null,
                  },
                })
              }
            >
              {Object.entries(ATTORNEY_REVIEW_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs">
            <span className="text-slate-500">Step 5 — Attorney Comments</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              rows={2}
              placeholder="Attorney comments (user-entered from attorney discussion)"
              defaultValue={review?.reviewNotes ?? ""}
              onBlur={(e) => run("update", { patch: { reviewNotes: e.target.value } })}
            />
          </label>

          <label className="block text-xs">
            <span className="text-slate-500">Step 6 — Changes Requested</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              rows={2}
              placeholder="List changes requested by attorney"
              defaultValue={review?.changesRequested ?? ""}
              onBlur={(e) => run("update", { patch: { changesRequested: e.target.value } })}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 8 — Attorney Compensation Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-amber-200/80">{COMPENSATION_TRACKING_WARNING}</p>
          <p className="text-xs text-slate-500">{ATTORNEY_NO_FEE_RECOMMENDATION}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="text-slate-500">Compensation Type</span>
              <select
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
                value={compensation?.compensationType ?? "not_set"}
                onChange={(e) => run("update_compensation", { patch: { compensationType: e.target.value } })}
              >
                {Object.entries(COMPENSATION_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs">
              <span className="text-slate-500">Compensation Status</span>
              <select
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
                value={compensation?.status ?? "not_discussed"}
                onChange={(e) => run("update_compensation", { patch: { status: e.target.value } })}
              >
                {Object.entries(ATTORNEY_FEE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs">
              <span className="text-slate-500">Proposed Percentage (user-entered only)</span>
              <input
                type="number"
                placeholder="Not recommended by EstateLeadOS"
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
                defaultValue={compensation?.proposedPercentage ?? ""}
                onBlur={(e) =>
                  run("update_compensation", { patch: { proposedPercentage: Number(e.target.value) || null, status: "proposed" } })
                }
              />
            </label>

            <label className="block text-xs">
              <span className="text-slate-500">Proposed Flat Fee (user-entered)</span>
              <input
                type="number"
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
                defaultValue={compensation?.proposedFlatFee ?? ""}
                onBlur={(e) =>
                  run("update_compensation", { patch: { proposedFlatFee: Number(e.target.value) || null, status: "proposed" } })
                }
              />
            </label>

            <label className="block text-xs">
              <span className="text-slate-500">Hourly Fee Placeholder (user-entered)</span>
              <input
                type="number"
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
                defaultValue={compensation?.proposedHourlyFee ?? ""}
                onBlur={(e) =>
                  run("update_compensation", { patch: { proposedHourlyFee: Number(e.target.value) || null, status: "proposed" } })
                }
              />
            </label>

            <label className="block text-xs">
              <span className="text-slate-500">Payment Due Condition</span>
              <select
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
                value={compensation?.paymentDueCondition ?? "not_set"}
                onChange={(e) => run("update_compensation", { patch: { paymentDueCondition: e.target.value } })}
              >
                {Object.entries(PAYMENT_DUE_CONDITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={compensation?.paidFromAssignmentFee ?? false}
              onChange={(e) => run("update_compensation", { patch: { paidFromAssignmentFee: e.target.checked } })}
            />
            Paid from assignment fee (yes/no — user-entered)
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={compensation?.writtenAgreementUploaded ?? false} disabled />
            Written agreement uploaded (required before Approved By Attorney — upload in Step 10)
          </label>

          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
            rows={2}
            placeholder="Compensation notes (user-entered from attorney discussion)"
            defaultValue={compensation?.notes ?? ""}
            onBlur={(e) => run("update_compensation", { patch: { notes: e.target.value } })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Steps 9–10 — Upload Attorney-Reviewed Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">Every upload is versioned. Previous files are preserved.</p>
          <UploadForm
            busy={busy}
            packetId={review?.packetId ?? selectedPacketId}
            onUpload={(payload) => run("upload", payload)}
          />
          {review?.uploads?.length ? (
            <ul className="space-y-1 text-xs text-slate-400">
              {review.uploads.map((u) => (
                <li key={u.id}>
                  v{u.versionNumber} · {UPLOAD_CATEGORY_LABELS[u.documentCategory] ?? u.documentCategory} · {u.fileName}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 12 — Move to Final Archive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            Store attorney-reviewed files in Final Archive (Step {FINAL_ARCHIVE_STEP}) after uploading reviewed documents.
            Not legal approval.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("move_final_archive")}
            className="inline-flex items-center gap-1 rounded-lg border border-purple-700/60 bg-purple-900/20 px-3 py-2 text-xs text-purple-200 disabled:opacity-50"
          >
            <Archive className="h-3 w-3" /> Save to Final Archive (Step {FINAL_ARCHIVE_STEP})
          </button>
          <Link href="/archive/final" className="inline-block text-xs text-sky-400 hover:underline">
            Open Final Archive →
          </Link>
        </CardContent>
      </Card>

      {data?.audit?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-500">
              {data.audit.slice(0, 30).map((log) => (
                <li key={log.id}>
                  {new Date(log.createdAt).toLocaleString()} · {log.actionDescription}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual Override (Distribution Gate)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-slate-400">{MANUAL_OVERRIDE_TEXT}</p>
          {review?.manualOverrideAcknowledged ? (
            <Badge variant="warning">Override acknowledged by {review.manualOverrideBy}</Badge>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("manual_override")}
              className="rounded-lg border border-amber-700/50 px-3 py-2 text-xs text-amber-200"
            >
              Acknowledge Manual Override
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onSave,
}: {
  label: string;
  value?: string | null;
  onSave: (v: string) => void;
}) {
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

function UploadForm({
  busy,
  packetId,
  onUpload,
}: {
  busy: boolean;
  packetId?: string | null;
  onUpload: (data: Record<string, string>) => void;
}) {
  const [category, setCategory] = useState("attorney_reviewed_packet");
  const [fileName, setFileName] = useState("");

  return (
    <div className="flex flex-wrap gap-2">
      <select
        className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {Object.entries(UPLOAD_CATEGORY_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <input
        className="min-w-[200px] flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-2 text-xs"
        placeholder="File name (e.g. attorney-reviewed-packet.pdf)"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />
      <button
        type="button"
        disabled={busy || !fileName}
        onClick={() =>
          onUpload({
            fileName,
            fileUrl: `/uploads/local/${encodeURIComponent(fileName)}`,
            fileType: "application/pdf",
            documentCategory: category,
            packetId: packetId ?? "",
          })
        }
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white disabled:opacity-50"
      >
        <Upload className="h-3 w-3" /> Upload
      </button>
    </div>
  );
}
