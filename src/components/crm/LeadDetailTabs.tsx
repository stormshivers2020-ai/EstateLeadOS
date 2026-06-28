"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LeadVerificationTab } from "@/components/verification/LeadVerificationTab";
import type { LeadVerificationBundle } from "@/lib/types/verification";
import { PacketBuilderPanel } from "@/components/program/PacketBuilderPanel";
import { AttorneyReviewPanel } from "@/components/distribution/AttorneyReviewPanel";
import { EmailDistributionPanel } from "@/components/distribution/EmailDistributionPanel";
import { FinancialPanel } from "@/components/analytics/FinancialPanel";
import { DealCommandStepper } from "@/components/deal-command/DealCommandStepper";
import { getNextProcessStep } from "@/lib/services/analytics/process-step";
import type { getLeadFinancials } from "@/lib/services/analytics";
import { cn } from "@/lib/utils/cn";
import { guidedHrefForMacroStep } from "@/lib/constants/guided-operations";
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
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const archiveParam = searchParams.get("archive");
  const recipientEmailParam = searchParams.get("recipientEmail");
  const [tab, setTab] = useState<"overview" | "evidence" | "financials" | "packet" | "attorney" | "email">("overview");

  useEffect(() => {
    if (tabParam === "packet" || tabParam === "attorney" || tabParam === "email" || tabParam === "evidence" || tabParam === "financials") {
      setTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="space-y-4">
      <DealCommandStepper
        steps={financialData.processSteps}
        currentStep={financialData.currentStep}
        nextStep={getNextProcessStep(financialData.currentStep)}
        leadId={leadId}
        compact
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--nova-gold-muted)] bg-black/20 px-3 py-2 text-xs">
        <span className="text-slate-500">Current Process Step:</span>
        <Badge variant="warning">Step {financialData.currentStep}</Badge>
        <span className="text-slate-400">
          {financialData.processSteps.find((s) => s.stepNumber === financialData.currentStep)?.stepName ?? "In progress"}
        </span>
        <Link
          href={guidedHrefForMacroStep(financialData.currentStep, leadId)}
          className="ml-auto text-sky-400 hover:underline"
        >
          Step-by-step help for this step →
        </Link>
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
            <DealCommandStepper
              steps={financialData.processSteps}
              currentStep={financialData.currentStep}
              nextStep={getNextProcessStep(financialData.currentStep)}
              leadId={leadId}
              sectionSteps={[10, 11, 12, 13, 14]}
              compact
            />
            <PacketBuilderPanel leadId={leadId} />
          </div>
        ) : tab === "attorney" ? (
          <div className="space-y-4">
            <DealCommandStepper
              steps={financialData.processSteps}
              currentStep={financialData.currentStep}
              nextStep={getNextProcessStep(financialData.currentStep)}
              leadId={leadId}
              sectionSteps={[15, 16, 17, 18, 19]}
              compact
            />
            <AttorneyReviewPanel leadId={leadId} />
          </div>
        ) : (
          <div className="space-y-4">
            <DealCommandStepper
              steps={financialData.processSteps}
              currentStep={financialData.currentStep}
              nextStep={getNextProcessStep(financialData.currentStep)}
              leadId={leadId}
              sectionSteps={[20, 21, 22, 23]}
              compact
            />
            <EmailDistributionPanel
              leadId={leadId}
              initialFinalArchiveId={archiveParam ?? undefined}
              initialRecipientEmail={recipientEmailParam ?? undefined}
            />
          </div>
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
