-- Phase 4: Attorney Review + Compensation Agreement Tracker

ALTER TABLE attorney_compensation
  ADD COLUMN IF NOT EXISTS proposed_hourly_fee NUMERIC;
