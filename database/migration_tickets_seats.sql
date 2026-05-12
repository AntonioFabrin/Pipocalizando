-- ================================================================
-- PIPOCALIZANDO - Migracao: suporte a assentos nos tickets
-- Execute no HeidiSQL (F9) antes de reiniciar o backend
-- ================================================================

USE pipocalizando;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS seat_label  VARCHAR(10)  NULL AFTER ticket_code,
  ADD COLUMN IF NOT EXISTS movie_id    INT          NULL AFTER seat_label,
  ADD COLUMN IF NOT EXISTS session_id  INT          NULL AFTER movie_id,
  ADD COLUMN IF NOT EXISTS is_used     TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_at     DATETIME     NULL;

-- Permite varios ingressos no mesmo pedido. A unicidade correta e por sessao + assento.
DROP INDEX IF EXISTS order_id ON tickets;

CREATE INDEX IF NOT EXISTS idx_tickets_order
  ON tickets (order_id);

CREATE INDEX IF NOT EXISTS idx_tickets_session
  ON tickets (session_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tickets_session_seat
  ON tickets (session_id, seat_label);

DESCRIBE tickets;
