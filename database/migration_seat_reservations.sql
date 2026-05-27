-- ============================================================
-- PostgreSQL migration: temporary seat reservations
-- ============================================================

CREATE TABLE IF NOT EXISTS seat_reservations (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES movie_sessions(id) ON DELETE CASCADE,
  movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_label VARCHAR(10) NOT NULL,
  reservation_token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_seat_reservation UNIQUE (session_id, seat_label)
);

CREATE INDEX IF NOT EXISTS idx_seat_reservations_expiry
  ON seat_reservations (expires_at);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_user_session
  ON seat_reservations (user_id, session_id);

DELETE FROM seat_reservations
WHERE expires_at <= NOW();
