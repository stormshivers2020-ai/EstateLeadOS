import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChecklistStatusBadge } from "./ComplianceBadges";
import type {
  DocumentChecklistItem,
  EquipmentChecklistItem,
  GettingStartedItem,
} from "@/lib/types/compliance";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

function StatusIcon({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (["blocked", "needs_review", "needs_attorney_review"].includes(status)) {
    return <AlertCircle className="h-4 w-4 text-amber-400" />;
  }
  return <Circle className="h-4 w-4 text-slate-500" />;
}

export function GettingStartedPanel({ items }: { items: GettingStartedItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <StatusIcon status={item.status} />
                <span className="text-slate-200">{item.label}</span>
                {item.blocking && (
                  <span className="text-xs text-amber-400">Required</span>
                )}
              </div>
              <ChecklistStatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function EquipmentChecklistPanel({ items }: { items: EquipmentChecklistItem[] }) {
  const complete = items.filter((i) => i.status === "complete").length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Required Equipment Checklist
          <span className="text-xs font-normal text-slate-400">
            {complete}/{items.length} complete
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">{item.itemName}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
                </div>
                <span className="shrink-0 text-xs capitalize text-slate-500">
                  {item.requirementLevel}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.blockingStatus && (
                  <span className="text-xs text-amber-400">Blocking if incomplete</span>
                )}
                {item.acknowledgementRequired && (
                  <span className="text-xs text-sky-400">Acknowledgement required</span>
                )}
                {item.stateSpecific && (
                  <span className="text-xs text-slate-500">State-specific</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function DocumentChecklistPanel({ items }: { items: DocumentChecklistItem[] }) {
  const complete = items.filter((i) =>
    ["uploaded", "signed", "reviewed", "generated"].includes(i.currentStatus)
  ).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Required Document Checklist
          <span className="text-xs font-normal text-slate-400">
            {complete}/{items.length} complete
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-200">{item.documentName}</p>
                <p className="text-xs text-slate-500 capitalize">
                  {item.documentCategory.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.attorneyReviewFlag && (
                  <span className="text-xs text-amber-400">Attorney review</span>
                )}
                <ChecklistStatusBadge
                  status={
                    item.currentStatus === "not_started"
                      ? "not_started"
                      : item.currentStatus === "needs_attorney_review"
                        ? "needs_review"
                        : "complete"
                  }
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Document generation connects in Phase 5. Checklist tracks requirements only.
        </p>
      </CardContent>
    </Card>
  );
}
