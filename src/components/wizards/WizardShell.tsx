"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { NOVA_SYSTEM_LABELS } from "@/lib/constants/brand";

interface WizardShellProps {
  title: string;
  subtitle?: string;
  steps: readonly string[];
  step: number;
  onStepChange: (n: number) => void;
  children: React.ReactNode;
  onComplete?: () => void;
  completeLabel?: string;
  disclaimer?: string;
  recommendations?: { label: string; href: string }[];
}

export function WizardShell({
  title,
  subtitle,
  steps,
  step,
  onStepChange,
  children,
  onComplete,
  completeLabel = "Complete Workflow",
  disclaimer,
  recommendations,
}: WizardShellProps) {
  const progress = Math.round(((step + 1) / steps.length) * 100);
  const isLast = step === steps.length - 1;

  return (
    <div className="space-y-6 nova-animate-in">
      <div className="nova-panel rounded-xl p-5 premium-glow">
        <p className="nova-label mb-2">{NOVA_SYSTEM_LABELS.guidedWorkflow}</p>
        <h2 className="text-lg font-semibold text-[var(--nova-text-primary)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--nova-text-secondary)]">
          {subtitle ?? "Step-by-step workflow powered by SCS Nova."}
        </p>
        {disclaimer && <p className="mt-3 rounded-lg border border-[var(--nova-orange)]/20 bg-[var(--nova-orange)]/5 p-3 text-xs text-[var(--nova-orange)]">{disclaimer}</p>}
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs text-[var(--nova-text-muted)]">
          <span>Step {step + 1} of {steps.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--nova-panel-soft)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--nova-gold)] to-[var(--nova-blue)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button key={s} type="button" onClick={() => i <= step && onStepChange(i)} className="cursor-pointer">
            <Badge variant={i === step ? "info" : i < step ? "success" : "default"}>{i + 1}. {s}</Badge>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>

      {isLast && recommendations && recommendations.length > 0 && (
        <Card className="border-[var(--nova-gold-muted)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--nova-gold)]" />
              Nova Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recommendations.map((r) => (
              <a key={r.href} href={r.href} className="nova-btn-secondary px-3 py-1.5 text-xs">
                {r.label}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => onStepChange(step - 1)}
          className="flex items-center gap-1 rounded-lg border border-[var(--nova-border-strong)] px-4 py-2 text-sm text-[var(--nova-text-secondary)] hover:border-[var(--nova-gold-muted)] disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {isLast ? (
          <button type="button" onClick={onComplete} className="nova-btn-primary px-4 py-2 text-sm">
            {completeLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStepChange(step + 1)}
            className="nova-btn-primary flex items-center gap-1 px-4 py-2 text-sm"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function WizardField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--nova-text-primary)]">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--nova-text-muted)]">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-[var(--nova-border-strong)] bg-[var(--nova-panel-soft)] px-3 py-2 text-sm text-[var(--nova-text-primary)] placeholder:text-[var(--nova-text-muted)] focus:border-[var(--nova-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-gold-muted)]";

export const selectClass = inputClass;

export const textareaClass = `${inputClass} min-h-[100px] resize-y`;
