-- ============================================================
-- PostgreSQL migration: ticket seat support
-- Safe to run on an existing Supabase database.
-- ============================================================

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS seat_label VARCHAR(10),
  ADD COLUMN IF NOT EXISTS movie_id BIGINT,
  ADD COLUMN IF NOT EXISTS session_id BIGINT,
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

ALTER TABLE tickets
  ALTER COLUMN movie_id DROP NOT NULL,
  ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_order_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tickets_movie_id_fkey'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_movie_id_fkey
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tickets_session_id_fkey'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tickets_session_seat
  ON tickets (session_id, seat_label);
CREATE INDEX IF NOT EXISTS idx_tickets_order
  ON tickets (order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_session
  ON tickets (session_id);
