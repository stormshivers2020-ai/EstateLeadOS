-- EstateLeadOS Billion-Dollar Analytics + Financial Command Center

CREATE TABLE deal_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_id UUID,
  assignment_id UUID,
  estimated_arv NUMERIC,
  estimated_repairs NUMERIC,
  investor_max_offer NUMERIC,
  suggested_seller_offer NUMERIC,
  target_assignment_fee NUMERIC,
  minimum_acceptable_spread NUMERIC,
  estimated_spread NUMERIC,
  agreed_assignment_fee NUMERIC,
  accrued_amount NUMERIC,
  pending_payout_amount NUMERIC,
  received_amount NUMERIC,
  expenses_total NUMERIC,
  projected_net_profit NUMERIC,
  actual_net_profit NUMERIC,
  financial_status TEXT NOT NULL DEFAULT 'no_financial_data',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, lead_id)
);

CREATE TABLE expense_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  packet_id UUID,
  category TEXT NOT NULL,
  vendor TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'estimated',
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE accrued_money_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assignment_id UUID,
  target_assignment_fee NUMERIC,
  agreed_assignment_fee NUMERIC,
  accrued_amount NUMERIC NOT NULL DEFAULT 0,
  accrued_date TIMESTAMPTZ,
  expected_payout_date TIMESTAMPTZ,
  payout_method TEXT,
  payout_status TEXT NOT NULL DEFAULT 'not_accrued',
  buyer_name TEXT,
  title_company TEXT,
  attorney_review_status TEXT,
  closing_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE process_step_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  next_action TEXT,
  related_module TEXT,
  related_financial_impact NUMERIC,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, lead_id, step_number)
);

CREATE TABLE executive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  filters JSONB DEFAULT '{}',
  report_html TEXT,
  pdf_url TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  filters JSONB DEFAULT '{}',
  metrics_json JSONB DEFAULT '{}',
  charts_json JSONB DEFAULT '{}',
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_financials_lead ON deal_financials(lead_id);
CREATE INDEX idx_expense_records_lead ON expense_records(lead_id);
CREATE INDEX idx_accrued_money_lead ON accrued_money_records(lead_id);
CREATE INDEX idx_process_step_lead ON process_step_status(lead_id);

ALTER TABLE deal_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE accrued_money_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_step_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
