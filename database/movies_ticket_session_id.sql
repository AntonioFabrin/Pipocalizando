ALTER TABLE tickets
  ADD COLUMN seat_label VARCHAR(10) NOT NULL DEFAULT '' AFTER ticket_code,
  ADD COLUMN movie_id INT NULL AFTER seat_label,
  ADD COLUMN session_id INT NULL AFTER movie_id;