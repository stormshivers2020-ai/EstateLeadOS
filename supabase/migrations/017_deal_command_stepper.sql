-- EstateLeadOS Deal Command Wizard — expand process_step_status for guided stepper

ALTER TABLE process_step_status
  ADD COLUMN IF NOT EXISTS packet_id UUID REFERENCES lead_program_packets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS required_documents_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_documents_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manual_approval_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attorney_review_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status TEXT,
  ADD COLUMN IF NOT EXISTS attorney_review_status TEXT,
  ADD COLUMN IF NOT EXISTS blocker_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_process_step_packet ON process_step_status(packet_id);
CREATE INDEX IF NOT EXISTS idx_process_step_status ON process_step_status(status);
