-- ============================================================
-- PostgreSQL migration: Mercado Pago payment fields
-- ============================================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS status_detail VARCHAR(100),
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS external_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS checkout_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS qr_code TEXT,
  ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS raw_response JSONB;

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON payments (provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_reference
  ON payments (external_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status_expires_at
  ON payments (status, expires_at);
