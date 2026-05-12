USE pipocalizando;

ALTER TABLE movies
  ADD COLUMN category_id INT NULL AFTER description,
  ADD COLUMN room_id INT NULL AFTER room,
  ADD COLUMN status VARCHAR(50) DEFAULT 'now_playing' AFTER is_active,
  ADD COLUMN trailer_url VARCHAR(500) NULL AFTER poster_url;