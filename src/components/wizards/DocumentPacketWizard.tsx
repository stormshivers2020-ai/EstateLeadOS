"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardShell, WizardField, selectClass } from "./WizardShell";
import { useLeads } from "@/hooks/useLeads";
import { buildDocumentPacketSummary } from "@/lib/services/wizards";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2 } from "lucide-react";

const STEPS = ["Select Lead", "Lead Summary", "Research Sheet", "Compliance", "Contact Record", "Buyer Sheet", "Assignment Packet", "Deal Printout"] as const;

const PACKET_ITEMS = [
  { key: "leadSummary", label: "Lead Summary" },
  { key: "researchSheet", label: "Property Research Sheet" },
  { key: "complianceChecklist", label: "Compliance Checklist" },
  { key: "contactRecord", label: "Seller Contact Record" },
  { key: "buyerSheet", label: "Buyer Sheet" },
  { key: "assignmentPlaceholder", label: "Assignment / Intent Packet" },
  { key: "dealPrintout", label: "Deal Calculator Printout" },
] as const;

export function DocumentPacketWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { leads } = useLeads();
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState(params.get("leadId") ?? leads[0]?.id ?? "");
  const [included, setIncluded] = useState<Record<string, boolean>>({
    leadSummary: true, researchSheet: true, complianceChecklist: true,
    contactRecord: true, buyerSheet: true, assignmentPlaceholder: true, dealPrintout: true,
  });

  const summary = useMemo(() => buildDocumentPacketSummary(leadId), [leadId]);

  function toggle(key: string) {
    setIncluded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <WizardShell
      title="Document Packet Wizard"
      subtitle="Assemble a professional deal packet for review or disposition"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      onComplete={() => router.push(`/documents?leadId=${leadId}`)}
      completeLabel="Open Document Center"
    >
      {step === 0 && (
        <>
          <WizardField label="Select Lead">
            <select className={selectClass} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.propertyAddress}</option>)}
            </select>
          </WizardField>
          <p className="text-sm text-slate-400">Packet readiness: <Badge variant="info">{summary.packetReadiness}%</Badge> · {summary.documentCount} documents</p>
        </>
      )}
      {step >= 1 && step <= 7 && (
        <div className="space-y-4">
          {PACKET_ITEMS.map((item, i) => {
            if (step !== i + 1) return null;
            const value = summary[item.key as keyof typeof summary];
            return (
              <div key={item.key}>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <input type="checkbox" checked={included[item.key]} onChange={() => toggle(item.key)} />
                  Include in packet
                </label>
                <div className="mt-2 rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-sm text-slate-400">
                  {Array.isArray(value) ? (
                    <ul className="space-y-1">{value.map((v) => <li key={String(v)} className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{String(v)}</li>)}</ul>
                  ) : (
                    <p>{String(value ?? "Not available — complete prior wizards")}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WizardShell>
  );
}
