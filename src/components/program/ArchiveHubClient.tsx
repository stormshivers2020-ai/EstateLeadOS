"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ARCHIVE_STAGE_LABELS,
  ARCHIVE_TAB_LABELS,
  ARCHIVE_TAB_ORDER,
  FINAL_ARCHIVE_DISCLAIMER,
  INITIAL_ARCHIVE_DISCLAIMER,
} from "@/lib/constants/archive-system";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { FIRST_ARCHIVE_STEP, FINAL_ARCHIVE_STEP } from "@/lib/constants/process-steps";
import { PACKET_TYPE_LABELS } from "@/lib/types/program";
import type { ArchiveHubItem } from "@/lib/services/program/archive-hub";
import type { ArchiveTabId, LeadPacket } from "@/lib/types/program";
import type { ArchiveHubData } from "@/lib/services/program/archive-hub";
import type { DistributionAuditLog } from "@/lib/types/distribution";
import {
  archiveHubAction,
  fetchPacketById,
  loadArchiveHub,
  printPacketAction,
} from "@/lib/services/program/client-program";
import { ARCHIVE_FILE_CATEGORY_LABELS } from "@/lib/services/program/archive-hub";
import {
  Archive,
  Printer,
  ExternalLink,
  Loader2,
  AlertCircle,
  Lock,
  Download,
  Scale,
  GitCompare,
  Copy,
  Mail,
} from "lucide-react";

interface ArchiveHubClientProps {
  defaultTab?: ArchiveTabId;
}

export function ArchiveHubClient({ defaultTab = "initial_review" }: ArchiveHubClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = (searchParams.get("tab") as ArchiveTabId | null) ?? defaultTab;
  const [tab, setTab] = useState<ArchiveTabId>(tabParam);
  const [data, setData] = useState<ArchiveHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await loadArchiveHub(tab);
      setData(json);
    } catch {
      setError("Could not load archive data.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const packetId = searchParams.get("packet");
    if (!packetId) return;
    void fetchPacketById(packetId).then((packet) => {
      if (packet?.printableHtml) setPrintHtml(packet.printableHtml);
    });
  }, [searchParams]);

  function switchTab(next: ArchiveTabId) {
    setTab(next);
    router.replace(`/archive?tab=${next}`, { scroll: false });
  }

  async function runAction(action: string, payload: Record<string, string>) {
    setError(null);
    setMessage(null);
    const result = await archiveHubAction(action, payload);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(result.message ?? "Done.");
    await load();
  }

  async function openPacket(packetId: string) {
    const packet = await fetchPacketById(packetId);
    if (packet?.printableHtml) {
      setPrintHtml(packet.printableHtml);
      return;
    }
    setError("Packet not found.");
  }

  async function printPacket(packetId: string, leadId: string) {
    const json = await printPacketAction(packetId, leadId);
    if (json.printableHtml) {
      setPrintHtml(json.printableHtml);
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(json.printableHtml);
        w.document.close();
        w.print();
      }
      await load();
      return;
    }
    setError(json.error ?? "Could not print.");
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading archives…
      </div>
    );
  }

  const showReady = tab === "ready_to_print";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-slate-200">EstateLeadOS · Powered by SCS Nova</p>
        <p className="mt-1 text-xs">{GLOBAL_DISCLAIMER}</p>
        <p className="mt-2 text-xs text-amber-200/80">{INITIAL_ARCHIVE_DISCLAIMER}</p>
        <p className="mt-1 text-xs text-purple-200/80">{FINAL_ARCHIVE_DISCLAIMER}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-700/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-4 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}

      {data && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Initial Review" value={data.stats.initialCount} />
          <Stat label="Final Attorney-Reviewed" value={data.stats.finalCount} />
          <Stat label="Archive Files" value={data.stats.totalFiles} />
          <Stat label="Locked Versions" value={data.stats.lockedCount} />
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-700/50 pb-2">
        {ARCHIVE_TAB_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              tab === t ? "bg-sky-800 text-white" : "text-slate-400 hover:bg-slate-800/50"
            }`}
          >
            {ARCHIVE_TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ARCHIVE_TAB_LABELS[tab]}</CardTitle>
        </CardHeader>
        <CardContent>
          {showReady ? (
            data?.readyToPrint?.length ? (
              <ul className="space-y-3">
                {data.readyToPrint.map((packet: LeadPacket) => (
                  <li key={packet.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700/50 p-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-200">
                        {PACKET_TYPE_LABELS[packet.packetType]} v{packet.packetVersion}
                      </p>
                      <Badge variant="default">{packet.packetStatus.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionBtn onClick={() => openPacket(packet.id)} icon={<ExternalLink className="h-3 w-3" />} label="Open" />
                      <ActionBtn onClick={() => printPacket(packet.id, packet.leadId)} icon={<Printer className="h-3 w-3" />} label="Print" />
                      <ActionBtn
                        onClick={() =>
                          runAction("initial_archive", {
                            packetId: packet.id,
                            notes: `Initial Review Archive — Step ${FIRST_ARCHIVE_STEP}`,
                          })
                        }
                        icon={<Archive className="h-3 w-3" />}
                        label={`Save to Initial Archive (Step ${FIRST_ARCHIVE_STEP})`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No packets ready to print. Build a packet from Lead Detail first.</p>
            )
          ) : !data?.items?.length ? (
            <p className="text-sm text-slate-400">No items in this archive view yet.</p>
          ) : (
            <ul className="space-y-4">
              {data.items.map((item: ArchiveHubItem) => (
                <ArchiveItemRow
                  key={item.id}
                  item={item}
                  compareIds={compareIds}
                  onToggleCompare={(id) =>
                    setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev.slice(-1), id]))
                  }
                  onOpen={() => openPacket(item.packetId)}
                  onPrint={() => printPacket(item.packetId, item.leadId)}
                  onLock={() => runAction("lock", { archiveId: item.id })}
                  onSupersede={() => runAction("supersede", { archiveId: item.id })}
                  onReject={() => runAction("reject", { archiveId: item.id })}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {compareIds.length === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitCompare className="h-4 w-4" /> Compare Versions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400">
            Comparing two preserved archive versions side-by-side. Files are never overwritten — review version numbers and
            archived dates before proceeding.
          </CardContent>
        </Card>
      )}

      {data?.auditLogs?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Archive Audit History</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-500">
              {data.auditLogs.slice(0, 40).map((log: DistributionAuditLog) => (
                <li key={log.id}>
                  {new Date(log.createdAt).toLocaleString()} · {log.actionDescription}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {printHtml && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Packet Preview</CardTitle>
            <button type="button" onClick={() => setPrintHtml(null)} className="text-xs text-slate-500">
              Close
            </button>
          </CardHeader>
          <CardContent>
            <iframe title="Archive preview" srcDoc={printHtml} className="h-[500px] w-full rounded border border-slate-700 bg-white" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ArchiveItemRow({
  item,
  compareIds,
  onToggleCompare,
  onOpen,
  onPrint,
  onLock,
  onSupersede,
  onReject,
}: {
  item: ArchiveHubItem;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onOpen: () => void;
  onPrint: () => void;
  onLock: () => void;
  onSupersede: () => void;
  onReject: () => void;
}) {
  const stageLabel = ARCHIVE_STAGE_LABELS[item.archiveStage ?? "initial_review"];

  return (
    <li className="rounded-lg border border-slate-700/50 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-200">{item.leadLabel}</p>
          <p className="text-xs text-slate-500">
            {item.propertyAddress ?? item.leadLabel} · {item.countyName}, {item.stateAbbr}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="default">{stageLabel}</Badge>
            <Badge variant="info">{PACKET_TYPE_LABELS[item.archiveType]} v{item.packetVersion}</Badge>
            <Badge variant={item.locked ? "success" : "warning"}>{item.archiveStatus.replace(/_/g, " ")}</Badge>
            {item.locked && <Badge variant="success">Locked</Badge>}
          </div>
          <dl className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
            <div>Generated: {item.generatedAt ? new Date(item.generatedAt).toLocaleString() : "—"}</div>
            <div>Archived: {new Date(item.archivedAt).toLocaleString()}</div>
            <div>Attorney review: {item.attorneyReviewStatus?.replace(/_/g, " ") ?? "—"}</div>
            <div>Signature: {item.signatureStatus?.replace(/_/g, " ") ?? "—"}</div>
            <div>Print count: {item.printCount}</div>
            <div>Last printed: {item.lastPrintedAt ? new Date(item.lastPrintedAt).toLocaleString() : "—"}</div>
            <div className="sm:col-span-2">Next action: {item.nextAction ?? "—"}</div>
          </dl>
        </div>
        <div className="flex max-w-full flex-wrap gap-1">
          <Link
            href={`/packets/${item.leadId}`}
            className="inline-flex items-center gap-1 rounded border border-sky-700/50 px-2 py-1 text-xs text-sky-300 hover:bg-sky-950/30"
          >
            <ExternalLink className="h-3 w-3" /> View Packet
          </Link>
          <Link
            href={`/packets/${item.leadId}?rebuild=1`}
            className="inline-flex items-center gap-1 rounded border border-violet-700/50 px-2 py-1 text-xs text-violet-200 hover:bg-violet-950/30"
          >
            Rebuild Packet
          </Link>
          <ActionBtn onClick={onOpen} icon={<ExternalLink className="h-3 w-3" />} label="Open" />
          <ActionBtn onClick={onPrint} icon={<Printer className="h-3 w-3" />} label="Print" />
          <ActionBtn
            onClick={() => window.open(`/api/archive?packetId=${item.packetId}`, "_blank")}
            icon={<Download className="h-3 w-3" />}
            label="Download"
          />
          <ActionBtn onClick={() => onToggleCompare(item.id)} icon={<GitCompare className="h-3 w-3" />} label="Compare" />
          <ActionBtn
            onClick={() => {}}
            icon={<Copy className="h-3 w-3" />}
            label="New Version"
            title="Build a new packet version from Lead Detail — prior versions preserved"
          />
          <Link
            href={`/leads/${item.leadId}?tab=attorney`}
            className="inline-flex items-center gap-1 rounded border border-amber-700/50 px-2 py-1 text-xs text-amber-200"
          >
            <Scale className="h-3 w-3" /> Attorney
          </Link>
          {item.archiveStage === "initial_review" && (
            <Link
              href={`/leads/${item.leadId}?tab=attorney`}
              className="inline-flex items-center gap-1 rounded border border-sky-700/50 px-2 py-1 text-xs text-sky-300"
            >
              Send to Attorney
            </Link>
          )}
          {item.archiveStage === "final_attorney_reviewed" && (
            <Link
              href={`/leads/${item.leadId}?tab=email&archive=${item.id}`}
              className="inline-flex items-center gap-1 rounded border border-violet-700/50 px-2 py-1 text-xs text-violet-200"
            >
              <Mail className="h-3 w-3" /> Send Final Packet
            </Link>
          )}
          {item.archiveStage === "final_attorney_reviewed" && !item.locked && (
            <ActionBtn onClick={onLock} icon={<Lock className="h-3 w-3" />} label="Lock Final" />
          )}
          {!item.locked && (
            <>
              <ActionBtn onClick={onSupersede} icon={<Archive className="h-3 w-3" />} label="Supersede" />
              <ActionBtn onClick={onReject} icon={<AlertCircle className="h-3 w-3" />} label="Reject" />
            </>
          )}
        </div>
      </div>
      {item.files.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-slate-700/40 pt-2 text-xs text-slate-500">
          {item.files.slice(0, 8).map((f) => (
            <li key={f.id}>
              v{f.versionNumber} · {ARCHIVE_FILE_CATEGORY_LABELS[f.fileCategory] ?? f.fileCategory} · {f.fileName}
              {f.locked && " · locked"}
            </li>
          ))}
          {item.files.length > 8 && <li>+{item.files.length - 8} more files (preserved)</li>}
        </ul>
      )}
    </li>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  title,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1 text-xs text-slate-300"
    >
      {icon} {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}

export { ArchiveHubClient as ArchiveClient };
