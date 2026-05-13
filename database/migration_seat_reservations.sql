-- ================================================================
-- PIPOCALIZANDO - Migracao: reservas temporarias de assentos
-- Segura assentos por 20 minutos antes da compra final.
-- ================================================================

USE pipocalizando;

CREATE TABLE IF NOT EXISTS seat_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  movie_id INT NOT NULL,
  user_id INT NOT NULL,
  seat_label VARCHAR(10) NOT NULL,
  reservation_token VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_seat_reservation (session_id, seat_label),
  INDEX idx_seat_reservations_expiry (expires_at),
  INDEX idx_seat_reservations_user_session (user_id, session_id)
);

DELETE FROM seat_reservations WHERE expires_at <= NOW();

DESCRIBE seat_reservations;
