"use client";

import Link from "next/link";
import { KANBAN_COLUMNS } from "@/lib/constants/pipeline-stages";
import { getStageName } from "@/lib/constants/pipeline-stages";
import { PipelineStageBadge, DncBadge, BlockerBadge } from "./PipelineBadges";
import { ScoreBadge } from "@/components/compliance/ComplianceBadges";
import type { LeadPipelineCard } from "@/lib/types/crm";

interface PipelineBoardProps {
  cards: LeadPipelineCard[];
}

export function PipelineBoard({ cards }: PipelineBoardProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: KANBAN_COLUMNS.length * 260 }}>
        {KANBAN_COLUMNS.map((stage) => {
          const stageCards = cards.filter((c) => c.pipelineStage === stage);
          return (
            <div
              key={stage}
              className="w-64 shrink-0 rounded-xl border border-slate-700/50 bg-slate-900/50"
            >
              <div className="border-b border-slate-700/50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-300">{getStageName(stage)}</p>
                <p className="text-xs text-slate-500">{stageCards.length}</p>
              </div>
              <div className="space-y-2 p-2">
                {stageCards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/leads/${card.id}`}
                    className="block rounded-lg border border-slate-700/40 bg-slate-800/40 p-3 hover:border-sky-700/40 transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-100 line-clamp-2">
                      {card.propertyAddress}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <ScoreBadge score={card.estateLeadScore} />
                      {card.doNotContact && <DncBadge />}
                      {card.hasBlocker && <BlockerBadge />}
                    </div>
                    {card.followUpDate && (
                      <p className="mt-1 text-xs text-amber-400">Follow-up: {card.followUpDate}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">{card.nextAction}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PipelineTable({ cards }: { cards: LeadPipelineCard[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
            <th className="pb-2 pr-4">Address</th>
            <th className="pb-2 pr-4">Stage</th>
            <th className="pb-2 pr-4">Score</th>
            <th className="pb-2 pr-4">Assigned</th>
            <th className="pb-2 pr-4">Follow-Up</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr key={card.id} className="border-b border-slate-800">
              <td className="py-2 pr-4">
                <Link href={`/leads/${card.id}`} className="text-sky-400 hover:underline">
                  {card.propertyAddress}
                </Link>
              </td>
              <td className="py-2 pr-4"><PipelineStageBadge stage={card.pipelineStage} /></td>
              <td className="py-2 pr-4">{card.estateLeadScore}</td>
              <td className="py-2 pr-4 text-slate-400">{card.assignedUserName ?? "—"}</td>
              <td className="py-2 pr-4 text-slate-400">{card.followUpDate ?? "—"}</td>
              <td className="py-2">
                {card.doNotContact && <DncBadge />}
                {card.hasBlocker && <BlockerBadge />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
