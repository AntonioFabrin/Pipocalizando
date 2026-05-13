USE pipocalizando;

CREATE INDEX idx_tickets_order ON tickets (order_id);

ALTER TABLE tickets DROP INDEX order_id;

CREATE INDEX idx_tickets_session ON tickets (session_id);

CREATE UNIQUE INDEX uq_tickets_session_seat
ON tickets (session_id, seat_label);
