"use client";

import { useState } from "react";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import {
  ASSIGNMENT_WARNING, NO_ADVICE_DISCLAIMER, OUTREACH_WARNING,
  PROFIT_DISCLAIMER, SOURCE_WARNING,
} from "@/lib/constants/compliance-copy";

export function DisclaimerAcknowledgement() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [logged, setLogged] = useState(false);

  function handleAcknowledge() {
    setAcknowledged(true);
    setLogged(true);
  }

  return (
    <div className="space-y-6 text-sm text-slate-300">
      <section className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
        <h2 className="font-semibold text-slate-100">Global Disclaimer</h2>
        <p className="mt-2">{GLOBAL_DISCLAIMER}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-100">No Professional Advice</h2>
        <p>{NO_ADVICE_DISCLAIMER}</p>
        <p>EstateLeadOS does not provide tax, brokerage, financial, or investment advice.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-100">No Guaranteed Profit</h2>
        <p>{PROFIT_DISCLAIMER}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-100">Data Source Limitations</h2>
        <p>{SOURCE_WARNING}</p>
        <p>State and county requirements vary. Confirm with a licensed attorney, broker, or title company.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-100">Outreach Compliance</h2>
        <p>{OUTREACH_WARNING}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-100">Assignment Workflow</h2>
        <p>{ASSIGNMENT_WARNING}</p>
      </section>

      <section className="rounded-lg border border-slate-700 p-5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1"
          />
          <span>I understand and acknowledge this disclaimer.</span>
        </label>
        <button
          type="button"
          disabled={!acknowledged}
          onClick={handleAcknowledge}
          className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Record Acknowledgement
        </button>
        {logged && (
          <p className="mt-3 text-xs text-emerald-400">
            Acknowledgement recorded to audit trail (placeholder — connect to PlatformAuditLog in production).
          </p>
        )}
      </section>
    </div>
  );
}
