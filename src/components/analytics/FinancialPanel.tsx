"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { DealCommandStepper } from "@/components/deal-command/DealCommandStepper";
import { getNextProcessStep } from "@/lib/services/analytics/process-step";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import { ACCRUED_MONEY_WARNING } from "@/lib/types/analytics";
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/types/analytics";
import type { getLeadFinancials } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

type LeadFinancialData = ReturnType<typeof getLeadFinancials>;

interface FinancialPanelProps {
  leadId: string;
  data: LeadFinancialData;
}

export function FinancialPanel({ leadId, data }: FinancialPanelProps) {
  const df = data.dealFinancials;
  const expenseTotal = Object.values(data.expenseBreakdown).reduce((s, v) => s + v, 0);
  const expensePie = Object.entries(data.expenseBreakdown).map(([k, v]) => ({
    label: EXPENSE_CATEGORY_LABELS[k as ExpenseCategory] ?? k,
    value: v,
  }));

  return (
    <div className="space-y-6">
      <AnalyticsDisclaimer compact />
      <Card className="border-amber-800/30 bg-amber-950/10">
        <CardContent className="flex gap-2 py-3 text-xs text-amber-200/90">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {ACCRUED_MONEY_WARNING}
        </CardContent>
      </Card>

      <DealCommandStepper
        steps={data.processSteps}
        currentStep={data.currentStep}
        nextStep={getNextProcessStep(data.currentStep)}
        leadId={leadId}
        compact
      />

      <SectionHeader title="Deal Financials" subtitle="Estimated, accrued, pending, and received — never mixed" />

      {!df ? (
        <Card className="premium-panel">
          <CardContent className="py-8 text-center text-sm text-slate-400">
            No financial data for this lead. Use Deal Calculator to start estimates.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnalyticsMetricCard title="Estimated ARV" value={formatCurrency(df.estimatedArv)} explanation="User-entered estimate" moneyLabel="user_entered" />
            <AnalyticsMetricCard title="Est. Repairs" value={formatCurrency(df.estimatedRepairs)} explanation="User-entered repair estimate" moneyLabel="estimated" />
            <AnalyticsMetricCard title="Investor Max Offer" value={formatCurrency(df.investorMaxOffer)} explanation="Calculator output" moneyLabel="system_calculated" />
            <AnalyticsMetricCard title="Suggested Seller Offer" value={formatCurrency(df.suggestedSellerOffer)} explanation="Calculator output" moneyLabel="system_calculated" />
            <AnalyticsMetricCard title="Target Assignment Fee" value={formatCurrency(df.targetAssignmentFee)} explanation="User target fee" moneyLabel="user_entered" />
            <AnalyticsMetricCard title="Min Acceptable Spread" value={formatCurrency(df.minimumAcceptableSpread)} explanation="User-entered floor" moneyLabel="user_entered" />
            <AnalyticsMetricCard title="Est. Deal Spread" value={formatCurrency(df.estimatedSpread)} explanation="Projected spread" moneyLabel="projected" />
            <AnalyticsMetricCard title="Agreed Assignment Fee" value={formatCurrency(df.agreedAssignmentFee)} explanation="Recorded agreement" moneyLabel="accrued" />
            <AnalyticsMetricCard title="Projected Net Profit" value={formatCurrency(df.projectedNetProfit)} explanation="Estimated fees minus expenses" moneyLabel="projected" />
            <AnalyticsMetricCard title="Accrued Amount" value={formatCurrency(df.accruedAmount)} explanation="Not received" moneyLabel="accrued" />
            <AnalyticsMetricCard title="Pending Payout" value={formatCurrency(df.pendingPayoutAmount)} explanation="Awaiting confirmation" moneyLabel="pending" />
            <AnalyticsMetricCard title="Received Amount" value={formatCurrency(df.receivedAmount)} explanation="Manually recorded only" moneyLabel="received" />
            <AnalyticsMetricCard title="Actual Net P/L" value={formatCurrency(df.actualNetProfit)} explanation="Received minus paid expenses" moneyLabel="system_calculated" />
            <AnalyticsMetricCard title="Total Expenses" value={formatCurrency(expenseTotal || df.expensesTotal)} explanation="Lead-attributed costs" moneyLabel="received" />
            <AnalyticsMetricCard title="Financial Status" value={df.financialStatus.replace(/_/g, " ")} explanation={`Last updated ${new Date(df.updatedAt).toLocaleDateString()}`} moneyLabel="system_calculated" />
          </div>

          {data.accrued && (
            <Card className="premium-panel">
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="font-medium text-slate-200">Accrued Money Record</p>
                <p className="text-slate-400">Status: {data.accrued.payoutStatus.replace(/_/g, " ")} · Buyer: {data.accrued.buyerName ?? "—"}</p>
                <p className="text-slate-400">Title: {data.accrued.titleCompany ?? "—"} · Closing: {data.accrued.closingStatus ?? "—"}</p>
              </CardContent>
            </Card>
          )}

          {expensePie.length > 0 && (
            <AnalyticsPieChart title="Deal Expense Breakdown" explanation="Costs attributed to this lead" data={expensePie} moneyLabel="received" />
          )}
        </>
      )}
    </div>
  );
}
