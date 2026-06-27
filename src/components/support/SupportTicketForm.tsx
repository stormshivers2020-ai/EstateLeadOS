"use client";

import { useState } from "react";

const ISSUE_TYPES = [
  "Data Source Issue", "CSV Import Issue", "Lead Scoring Issue", "Compliance Question",
  "Document Template Issue", "Billing Issue", "Account Access Issue", "Buyer Network Issue",
  "Assignment Tracker Issue", "White Label Issue", "Bug Report", "Feature Request", "Other",
] as const;

const PRIORITIES = ["Low", "Normal", "High", "Urgent", "Compliance Sensitive", "Billing Critical"] as const;

export function SupportTicketForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/30 p-5 text-sm text-emerald-200">
        Support ticket submitted (placeholder). SCS Nova will respond via your organization contact email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-300">Issue Type</label>
        <select required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
          {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-300">Priority</label>
        <select required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-300">Subject</label>
        <input required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
      </div>
      <div>
        <label className="block text-sm text-slate-300">Description</label>
        <textarea required rows={4} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-slate-300">Related Lead (optional)</label>
          <input className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" placeholder="Lead ID" />
        </div>
        <div>
          <label className="block text-sm text-slate-300">Related State (optional)</label>
          <input className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" placeholder="e.g. TX" />
        </div>
      </div>
      <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500">Create Support Ticket</button>
    </form>
  );
}
