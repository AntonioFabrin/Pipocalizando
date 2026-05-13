USE pipocalizando;

ALTER TABLE payments
  ADD COLUMN status_detail VARCHAR(100) NULL AFTER status,
  ADD COLUMN provider VARCHAR(50) NULL AFTER status_detail,
  ADD COLUMN provider_payment_id VARCHAR(100) NULL AFTER provider,
  ADD COLUMN external_reference VARCHAR(100) NULL AFTER provider_payment_id,
  ADD COLUMN checkout_url VARCHAR(500) NULL AFTER external_reference,
  ADD COLUMN qr_code TEXT NULL AFTER checkout_url,
  ADD COLUMN qr_code_base64 MEDIUMTEXT NULL AFTER qr_code,
  ADD COLUMN expires_at DATETIME NULL AFTER qr_code_base64,
  ADD COLUMN raw_response JSON NULL AFTER expires_at;

CREATE INDEX idx_payments_provider_payment_id ON payments (provider_payment_id);
CREATE INDEX idx_payments_external_reference ON payments (external_reference);
CREATE INDEX idx_payments_status_expires_at ON payments (status, expires_at);
