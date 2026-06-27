"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SafetyStatusBadge } from "@/components/crm/PipelineBadges";
import { checkTemplateSafety } from "@/lib/services/outreach";
import {
  DNC_REMINDER_TEXT,
  SMS_CONSENT_WARNING,
  EMAIL_OPT_OUT_REMINDER,
  CALL_DNC_REMINDER,
} from "@/lib/services/outreach";
import { applyTemplateVariables } from "@/lib/services/outreach";
import type { OutreachTemplate, LeadPipelineCard, CommunicationLog, FollowUpReminder } from "@/lib/types/crm";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { AlertTriangle, Shield, MessageSquare } from "lucide-react";

interface OutreachCenterClientProps {
  templates: OutreachTemplate[];
  contactReadyLeads: LeadPipelineCard[];
  followUps: FollowUpReminder[];
  communications: CommunicationLog[];
  overview: {
    contactReady: number;
    followUpsDue: number;
    communicationsLogged: number;
    dncActive: number;
    blockedAttempts: number;
  };
  blockedExample: {
    attempted: string;
    reason: string;
    suggested: string;
  } | null;
  isDemo: boolean;
}

export function OutreachCenterClient({
  templates,
  contactReadyLeads,
  followUps,
  communications,
  overview,
  blockedExample,
  isDemo,
}: OutreachCenterClientProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [dncAck, setDncAck] = useState(false);
  const [stateWarningAck, setStateWarningAck] = useState(false);

  const previewBody = selectedTemplate
    ? applyTemplateVariables(selectedTemplate.body, {
        owner_name: "Property Owner",
        property_address: "123 Example St",
        user_name: "Alex Morgan",
        business_phone: "(555) 123-4567",
        business_email: "contact@example.com",
      })
    : customMessage;

  const safetyResult = previewBody
    ? checkTemplateSafety(previewBody, {
        doNotContact: false,
        stateOutreachWarningReviewed: stateWarningAck,
        dncReminderAcknowledged: dncAck,
        contactSourceAttached: true,
        consentStatus: selectedTemplate?.channel === "sms" ? "consent_needed" : "unknown",
        templateToneApproved: true,
      })
    : null;

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="rounded-lg border border-sky-700/40 bg-sky-900/20 px-4 py-3 text-sm text-sky-200">
          Demo outreach data — fictional contacts. All templates use respectful, no-pressure language.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Contact Ready" value={overview.contactReady} />
        <MetricCard label="Follow-Ups Due" value={overview.followUpsDue} />
        <MetricCard label="Communications" value={overview.communicationsLogged} />
        <MetricCard label="DNC Active" value={overview.dncActive} />
      </div>

      {/* Outreach Safety Rules */}
      <Card className="border-emerald-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-300">
            <Shield className="h-4 w-4" />
            Outreach Safety Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          <ul className="space-y-1">
            <li>• Never use grief-exploiting or pressure language</li>
            <li>• Always offer no-pressure opt-out</li>
            <li>• Market contract interest only — not property you do not own</li>
            <li>• Screen DNC lists before calling</li>
            <li>• EstateLeadOS does not provide legal or brokerage advice</li>
          </ul>
        </CardContent>
      </Card>

      {blockedExample && (
        <Card className="border-red-700/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Blocked Template Example (Demo)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-red-200 line-through">{blockedExample.attempted}</p>
            <p className="text-slate-400">Reason: {blockedExample.reason}</p>
            <p className="text-emerald-300">Suggested: {blockedExample.suggested}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Template Library */}
        <Card>
          <CardHeader><CardTitle>Template Library</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedTemplate(t); setCustomMessage(""); }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      selectedTemplate?.id === t.id
                        ? "border-sky-600 bg-sky-900/20 text-sky-200"
                        : "border-slate-700/50 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <span className="font-medium">{t.templateName}</span>
                    <span className="ml-2 text-xs text-slate-500">{t.channel} — {t.tone}</span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Template Preview & Safety Check */}
        <Card>
          <CardHeader><CardTitle>Template Preview & Safety Guard</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={dncAck} onChange={(e) => setDncAck(e.target.checked)} className="mt-1" />
              <span className="text-slate-400">{DNC_REMINDER_TEXT}</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={stateWarningAck} onChange={(e) => setStateWarningAck(e.target.checked)} className="mt-1" />
              <span className="text-slate-400">I have reviewed state outreach caution for this lead.</span>
            </label>

            {selectedTemplate?.channel === "sms" && (
              <p className="text-xs text-amber-300">{SMS_CONSENT_WARNING}</p>
            )}
            {selectedTemplate?.channel === "email" && (
              <p className="text-xs text-amber-300">{EMAIL_OPT_OUT_REMINDER}</p>
            )}
            {selectedTemplate?.channel === "call" && (
              <p className="text-xs text-amber-300">{CALL_DNC_REMINDER}</p>
            )}

            <textarea
              value={customMessage || previewBody}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              placeholder="Select a template or write a message..."
            />

            {safetyResult && (
              <div className={`rounded-lg border p-3 text-sm ${
                safetyResult.blocked ? "border-red-700/50 bg-red-900/20" : "border-slate-700/50"
              }`}>
                <div className="flex items-center gap-2">
                  <SafetyStatusBadge status={safetyResult.safetyStatus} />
                  {safetyResult.blocked && <span className="text-red-300">Blocked</span>}
                </div>
                {safetyResult.flaggedPhrases.length > 0 && (
                  <p className="mt-2 text-xs text-amber-300">Flagged: {safetyResult.flaggedPhrases.join(", ")}</p>
                )}
                {safetyResult.suggestedRewrite && (
                  <p className="mt-2 text-xs text-emerald-300">Try: {safetyResult.suggestedRewrite}</p>
                )}
                {safetyResult.feedback.map((f, i) => (
                  <p key={i} className="mt-1 text-xs text-slate-400">{f}</p>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={!safetyResult || safetyResult.blocked || !dncAck || !stateWarningAck}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-40"
            >
              Log Outreach (Phase 4 — log only)
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Ready Leads */}
      <Card>
        <CardHeader><CardTitle>Contact Ready Leads</CardTitle></CardHeader>
        <CardContent>
          {contactReadyLeads.length === 0 ? (
            <p className="text-sm text-slate-400">No contact-ready leads.</p>
          ) : (
            <ul className="space-y-2">
              {contactReadyLeads.map((l) => (
                <li key={l.id}>
                  <Link href={`/leads/${l.id}`} className="text-sm text-sky-400 hover:underline">
                    {l.propertyAddress}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Follow-Ups Due */}
      <Card>
        <CardHeader><CardTitle>Follow-Ups Due</CardTitle></CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <p className="text-sm text-slate-400">No follow-ups scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {followUps.map((f) => (
                <li key={f.id} className="flex justify-between text-sm">
                  <Link href={`/leads/${f.leadId}`} className="text-sky-400 hover:underline">{f.propertyAddress}</Link>
                  <span className="text-slate-400">{f.followUpDate} — {f.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Communication Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communication Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {communications.length === 0 ? (
            <p className="text-sm text-slate-400">No communications logged.</p>
          ) : (
            <ul className="space-y-3">
              {communications.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-700/40 p-3 text-sm">
                  <div className="flex justify-between text-xs text-slate-500">
                    <Link href={`/leads/${c.leadId}`} className="text-sky-400">{c.leadId}</Link>
                    <span>{c.communicationDate} — {c.contactMethod}</span>
                  </div>
                  <p className="mt-1 text-slate-300">{c.messageBodySnapshot.slice(0, 120)}...</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">{GLOBAL_DISCLAIMER}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}
