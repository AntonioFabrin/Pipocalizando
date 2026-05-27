-- ============================================================
-- PostgreSQL migration: orders.session_id and password reset table
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS session_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_session_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user
  ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token
  ON password_reset_tokens (token);
