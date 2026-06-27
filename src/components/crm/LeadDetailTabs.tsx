"use client";

import { useState, type ReactNode } from "react";
import { LeadVerificationTab } from "@/components/verification/LeadVerificationTab";
import type { LeadVerificationBundle } from "@/lib/types/verification";
import { PacketBuilderPanel } from "@/components/program/PacketBuilderPanel";
import { AttorneyReviewPanel } from "@/components/distribution/AttorneyReviewPanel";
import { EmailDistributionPanel } from "@/components/distribution/EmailDistributionPanel";
import { FinancialPanel } from "@/components/analytics/FinancialPanel";
import { ProcessStepMap } from "@/components/analytics/ProcessStepMap";
import type { getLeadFinancials } from "@/lib/services/analytics";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";

type LeadFinancialData = ReturnType<typeof getLeadFinancials>;

interface LeadDetailTabsProps {
  leadId: string;
  verificationBundle: LeadVerificationBundle | null;
  financialData: LeadFinancialData;
  overview: ReactNode;
}

export function LeadDetailTabs({
  leadId,
  verificationBundle,
  financialData,
  overview,
}: LeadDetailTabsProps) {
  const [tab, setTab] = useState<"overview" | "evidence" | "financials" | "packet" | "attorney" | "email">("overview");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--nova-gold-muted)] bg-black/20 px-3 py-2 text-xs">
        <span className="text-slate-500">Current Process Step:</span>
        <Badge variant="warning">Step {financialData.currentStep}</Badge>
        <span className="text-slate-400">
          {financialData.processSteps.find((s) => s.stepNumber === financialData.currentStep)?.stepName ?? "In progress"}
        </span>
      </div>

      <div
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-700/50 pb-2 scrollbar-none"
        role="tablist"
        aria-label="Lead detail sections"
      >
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabButton>
        <TabButton active={tab === "evidence"} onClick={() => setTab("evidence")}>
          Evidence
        </TabButton>
        <TabButton active={tab === "financials"} onClick={() => setTab("financials")}>
          Financials
        </TabButton>
        <TabButton active={tab === "packet"} onClick={() => setTab("packet")}>
          Packet & Archive
        </TabButton>
        <TabButton active={tab === "attorney"} onClick={() => setTab("attorney")}>
          Attorney Review
        </TabButton>
        <TabButton active={tab === "email"} onClick={() => setTab("email")}>
          Email Distribution
        </TabButton>
      </div>
      <div role="tabpanel">
        {tab === "overview" ? overview : tab === "evidence" ? (
          <LeadVerificationTab leadId={leadId} initialBundle={verificationBundle} />
        ) : tab === "financials" ? (
          <FinancialPanel leadId={leadId} data={financialData} />
        ) : tab === "packet" ? (
          <div className="space-y-4">
            <ProcessStepMap steps={financialData.processSteps} currentStep={financialData.currentStep} leadId={leadId} compact />
            <PacketBuilderPanel leadId={leadId} />
          </div>
        ) : tab === "attorney" ? (
          <AttorneyReviewPanel leadId={leadId} />
        ) : (
          <EmailDistributionPanel leadId={leadId} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "touch-target shrink-0 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap",
        active
          ? "bg-sky-600/20 text-sky-300"
          : "text-slate-400 hover:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}
