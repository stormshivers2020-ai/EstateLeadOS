"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardShell, WizardField, inputClass, selectClass, textareaClass } from "./WizardShell";
import { useLeads } from "@/hooks/useLeads";
import { isSupabaseMode } from "@/lib/config/runtime";
import { generateOutreachScripts, logOutreachFromWizard } from "@/lib/services/wizards";
import { getSessionContext } from "@/lib/config/session";
import { DNC_REMINDER_TEXT } from "@/lib/services/outreach";

const STEPS = ["Select Lead", "Call Script", "SMS Script", "Email Script", "Mailer Letter", "Follow-Up", "Contact Log"] as const;

export function SellerOutreachWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const session = getSessionContext();
  const { leads } = useLeads();
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState(params.get("leadId") ?? leads[0]?.id ?? "");
  const [channel, setChannel] = useState("phone");
  const [followUpDays, setFollowUpDays] = useState("7");
  const [dncAck, setDncAck] = useState(false);

  const lead = leads.find((l) => l.id === leadId);
  const vars = useMemo(() => ({
    owner_name: lead?.ownerName ?? "Property Owner",
    property_address: lead?.propertyAddress ?? "",
    user_name: session.userName,
    business_phone: "(555) 000-0000",
  }), [lead, session.userName]);

  const scripts = useMemo(() => generateOutreachScripts(vars), [vars]);

  async function finish() {
    if (!leadId || !dncAck) {
      router.push("/outreach");
      return;
    }
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + Number(followUpDays));
    const followUpDate = followUp.toISOString().split("T")[0];

    if (isSupabaseMode()) {
      await fetch(`/api/leads/${leadId}/activity`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "communication",
          contactMethod: channel,
          messageBody: `Outreach logged via seller outreach wizard (${channel})`,
          followUpDate,
          notes: "Logged via Seller Outreach Wizard",
        }),
      });
    } else {
      logOutreachFromWizard({
        leadId,
        channel,
        scriptUsed: channel,
        followUpDate,
      });
    }
    router.push("/outreach");
  }

  return (
    <WizardShell
      title="Seller Outreach Wizard"
      subtitle="Respectful, no-pressure outreach — never predatory"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      onComplete={finish}
      completeLabel="Log Outreach & Finish"
      disclaimer="You are responsible for all call, text, email, mail, consent, and Do Not Contact requirements."
    >
      {step === 0 && (
        <>
          <WizardField label="Select Lead">
            <select className={selectClass} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.propertyAddress} — {l.ownerName}</option>)}
            </select>
          </WizardField>
          {lead?.doNotContact && <p className="text-sm text-red-400">Warning: Lead is marked Do Not Contact.</p>}
          <WizardField label="Primary Channel">
            <select className={selectClass} value={channel} onChange={(e) => setChannel(e.target.value)}>
              {["phone", "sms", "email", "direct_mail", "voicemail"].map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </WizardField>
        </>
      )}
      {step === 1 && (
        <WizardField label="Call / Voicemail Script">
          <textarea className={textareaClass} readOnly value={scripts.call || "No call template available — customize in Outreach CRM."} />
        </WizardField>
      )}
      {step === 2 && (
        <WizardField label="SMS Script" hint="SMS requires documented consent where applicable">
          <textarea className={textareaClass} readOnly value={scripts.sms || "Hi {{owner_name}}, this is {{user_name}}. I had a question about {{property_address}}. Would selling as-is ever be something you'd consider? No pressure."} />
        </WizardField>
      )}
      {step === 3 && (
        <WizardField label="Email Script">
          <textarea className={textareaClass} readOnly value={scripts.email || scripts.mailer} />
        </WizardField>
      )}
      {step === 4 && (
        <WizardField label="Mailer Letter">
          <textarea className={textareaClass} readOnly value={scripts.mailer} />
        </WizardField>
      )}
      {step === 5 && (
        <WizardField label="Follow-Up Schedule (days)">
          <input className={inputClass} type="number" value={followUpDays} onChange={(e) => setFollowUpDays(e.target.value)} min={1} max={90} />
          <p className="mt-2 text-xs text-slate-500">A follow-up reminder will be scheduled automatically.</p>
        </WizardField>
      )}
      {step === 6 && (
        <>
          <p className="text-sm text-slate-400">{DNC_REMINDER_TEXT}</p>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={dncAck} onChange={(e) => setDncAck(e.target.checked)} />
            I confirm DNC and compliance checks before logging contact
          </label>
        </>
      )}
    </WizardShell>
  );
}
