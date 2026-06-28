-- Phase 2 — Government proof chain: required document attorney flag

ALTER TABLE required_documents
  ADD COLUMN IF NOT EXISTS required_for_attorney_review BOOLEAN NOT NULL DEFAULT false;
